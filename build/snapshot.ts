// Version snapshot system — tracks gstack versions over time

import { readFile, writeFile, mkdir, readdir, stat } from "fs/promises";
import { join } from "path";
import { execSync } from "child_process";
import { existsSync } from "fs";
import { parseSkills, type SkillData } from "./parse-skills";

export interface VersionMeta {
  version: string;        // "1.32.0" — MAJOR.MINOR.PATCH
  fullVersion: string;    // "1.32.0.0" — raw from VERSION file
  date: string;           // ISO date "2026-05-11"
  sha: string;            // commit sha
  skillCount: number;
}

export interface VersionsIndex {
  versions: VersionMeta[];
  current: string;        // version key
}

// Normalize "1.32.0.0" → "1.32.0" (drop the 4th digit which changes per commit)
export function normalizeVersion(v: string): string {
  const parts = v.split(".");
  return parts.slice(0, 3).join(".");
}

function versionToSortable(v: string): number {
  const [a, b, c] = v.split(".").map((n) => parseInt(n, 10) || 0);
  return a * 1_000_000 + b * 1000 + c;
}

function compareVersions(a: string, b: string): number {
  return versionToSortable(b) - versionToSortable(a); // newest first
}

export async function snapshotVersion(
  versionsDir: string,
  version: string,
  fullVersion: string,
  sha: string,
  skills: SkillData[],
  date: string = new Date().toISOString().slice(0, 10)
): Promise<VersionMeta> {
  const versionDir = join(versionsDir, `v${version}`);
  await mkdir(versionDir, { recursive: true });

  // Only persist the data we need for compare (no need for bodyHtml — we can re-render from markdown)
  const minimal = skills.map((s) => ({
    name: s.name,
    slug: s.slug,
    version: s.version,
    description: s.description,
    preambleTier: s.preambleTier,
    allowedTools: s.allowedTools,
    triggers: s.triggers,
    bodyMarkdown: s.bodyMarkdown,
  }));

  await writeFile(
    join(versionDir, "skills.json"),
    JSON.stringify(minimal)
  );

  return {
    version,
    fullVersion,
    date,
    sha,
    skillCount: skills.length,
  };
}

export async function loadIndex(versionsDir: string): Promise<VersionsIndex> {
  const indexPath = join(versionsDir, "index.json");
  if (!existsSync(indexPath)) {
    return { versions: [], current: "" };
  }
  return JSON.parse(await readFile(indexPath, "utf-8"));
}

export async function saveIndex(
  versionsDir: string,
  index: VersionsIndex
): Promise<void> {
  await mkdir(versionsDir, { recursive: true });
  index.versions.sort((a, b) => compareVersions(a.version, b.version));
  await writeFile(
    join(versionsDir, "index.json"),
    JSON.stringify(index, null, 2)
  );
}

export async function upsertVersion(
  versionsDir: string,
  meta: VersionMeta
): Promise<VersionsIndex> {
  const index = await loadIndex(versionsDir);
  const existing = index.versions.findIndex((v) => v.version === meta.version);
  if (existing >= 0) {
    index.versions[existing] = meta;
  } else {
    index.versions.push(meta);
  }
  // current is the version with the highest sortable key
  index.versions.sort((a, b) => compareVersions(a.version, b.version));
  index.current = index.versions[0]?.version || "";
  await saveIndex(versionsDir, index);
  return index;
}

// Backfill: walk git history, find unique MAJOR.MINOR.PATCH versions, snapshot each
export async function backfillVersions(
  gstackRoot: string,
  versionsDir: string,
  maxToBackfill: number = 12
): Promise<VersionMeta[] | null> {
  // Only works if gstackRoot is a git repo
  try {
    execSync(`git -C "${gstackRoot}" rev-parse HEAD`, { stdio: "pipe" });
  } catch {
    console.log("  (not a git repo — skipping backfill)");
    return null;
  }

  const existing = await loadIndex(versionsDir);
  const existingVersions = new Set(existing.versions.map((v) => v.version));

  // Save current HEAD so we can restore it
  const originalHead = execSync(`git -C "${gstackRoot}" rev-parse HEAD`)
    .toString()
    .trim();

  // Get commit log with VERSION file changes
  const log = execSync(
    `git -C "${gstackRoot}" log --format="%H|%aI" -- VERSION`
  )
    .toString()
    .trim()
    .split("\n")
    .filter(Boolean);

  const snapshots: VersionMeta[] = [];
  const seen = new Set<string>();

  console.log(`  walking ${log.length} VERSION commits...`);

  for (const line of log) {
    if (snapshots.length >= maxToBackfill) break;
    const [sha, isoDate] = line.split("|");
    if (!sha) continue;

    let rawVersion: string;
    try {
      rawVersion = execSync(`git -C "${gstackRoot}" show ${sha}:VERSION`, {
        stdio: ["pipe", "pipe", "pipe"],
      })
        .toString()
        .trim();
    } catch {
      continue;
    }

    const normalized = normalizeVersion(rawVersion);
    if (seen.has(normalized) || existingVersions.has(normalized)) continue;
    seen.add(normalized);

    const date = isoDate?.slice(0, 10) || "";

    // Checkout this commit
    try {
      execSync(`git -C "${gstackRoot}" checkout -q ${sha}`, { stdio: "pipe" });
    } catch (err) {
      console.warn(`  ✗ failed to checkout ${sha.slice(0, 7)}`);
      continue;
    }

    try {
      const skills = await parseSkills(gstackRoot);
      const meta = await snapshotVersion(
        versionsDir,
        normalized,
        rawVersion,
        sha,
        skills,
        date
      );
      snapshots.push(meta);
      console.log(`  ✓ v${normalized}  ${date}  ${skills.length} skills  ${sha.slice(0, 7)}`);
    } catch (err) {
      console.warn(`  ✗ failed parsing ${sha.slice(0, 7)}: ${err}`);
    }
  }

  // Restore HEAD
  execSync(`git -C "${gstackRoot}" checkout -q ${originalHead}`, {
    stdio: "pipe",
  });

  return snapshots;
}
