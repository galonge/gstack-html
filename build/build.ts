import { parseSkills } from "./parse-skills";
import { generateGraphData } from "./generate-graph-data";
import { generateHtml } from "./generate-html";
import {
  normalizeVersion,
  snapshotVersion,
  upsertVersion,
  backfillVersions,
  loadIndex,
} from "./snapshot";
import { readFile, cp, mkdir } from "fs/promises";
import { join } from "path";
import { execSync } from "child_process";
import { existsSync } from "fs";

const ROOT = join(import.meta.dir, "..");
const DIST = join(ROOT, "dist");
const SRC = join(ROOT, "src");
const UPSTREAM = join(ROOT, "upstream", "gstack");
const VERSIONS = join(ROOT, "versions");

async function fetchUpstream(): Promise<{ version: string; sha: string }> {
  if (existsSync(UPSTREAM)) {
    console.log("Pulling upstream gstack...");
    try {
      execSync("git pull --ff-only", { cwd: UPSTREAM, stdio: "inherit" });
    } catch {
      // If pull fails (likely due to a checkout from backfill), reset
      execSync("git checkout -q main", { cwd: UPSTREAM });
      execSync("git pull --ff-only", { cwd: UPSTREAM, stdio: "inherit" });
    }
  } else {
    console.log("Cloning upstream gstack (with full history)...");
    execSync(`git clone https://github.com/garrytan/gstack.git ${UPSTREAM}`, {
      stdio: "inherit",
    });
  }
  const version = (await readFile(join(UPSTREAM, "VERSION"), "utf-8")).trim();
  const sha = execSync(`git -C "${UPSTREAM}" rev-parse HEAD`).toString().trim();
  return { version, sha };
}

async function main() {
  console.log("=== gstack-html build ===\n");

  let version: string;
  let gstackRoot: string;
  let sha: string = "";

  const localGstack = join(
    process.env.HOME || "~",
    ".claude",
    "skills",
    "gstack"
  );

  const useUpstream = process.env.USE_UPSTREAM || !existsSync(localGstack);

  if (useUpstream) {
    const fetched = await fetchUpstream();
    version = fetched.version;
    sha = fetched.sha;
    gstackRoot = UPSTREAM;
  } else {
    console.log("Using local gstack installation...");
    gstackRoot = localGstack;
    version = (await readFile(join(localGstack, "VERSION"), "utf-8")).trim();
    try {
      sha = execSync(`git -C "${localGstack}" rev-parse HEAD 2>/dev/null`)
        .toString()
        .trim();
    } catch {
      sha = "local";
    }
  }

  console.log(`Version: ${version}`);
  console.log(`Source: ${gstackRoot}\n`);

  console.log("Parsing skills...");
  const skills = await parseSkills(gstackRoot);
  console.log(`Found ${skills.length} skills\n`);

  // === Version snapshot ===
  const normalized = normalizeVersion(version);
  console.log(`Snapshotting v${normalized}...`);
  await mkdir(VERSIONS, { recursive: true });
  const meta = await snapshotVersion(
    VERSIONS,
    normalized,
    version,
    sha,
    skills
  );
  await upsertVersion(VERSIONS, meta);

  // === Backfill (only if upstream + flag set, or first time) ===
  const index = await loadIndex(VERSIONS);
  if (useUpstream && (process.env.BACKFILL || index.versions.length < 5)) {
    console.log(`\nBackfilling historical versions...`);
    const snapshots = await backfillVersions(gstackRoot, VERSIONS, 12);
    if (snapshots) {
      for (const snap of snapshots) {
        await upsertVersion(VERSIONS, snap);
      }
    }
  }

  const finalIndex = await loadIndex(VERSIONS);
  console.log(`Tracked versions: ${finalIndex.versions.map((v) => v.version).join(", ")}\n`);

  console.log("Generating graph data...");
  const graphData = generateGraphData(skills, version);
  console.log(
    `${graphData.nodes.length} nodes, ${graphData.edges.length} edges\n`
  );

  console.log("Generating HTML...");
  await generateHtml(graphData, skills, DIST, SRC, finalIndex);
  console.log(`Output: ${DIST}/index.html\n`);

  // Copy versions/ to dist/
  console.log("Copying version snapshots to dist...");
  await mkdir(join(DIST, "versions"), { recursive: true });
  await cp(VERSIONS, join(DIST, "versions"), { recursive: true });

  console.log("=== Build complete ===");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
