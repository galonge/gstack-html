import * as yaml from "js-yaml";
import { marked } from "marked";
import { readdir, readFile, stat } from "fs/promises";
import { join, basename, dirname } from "path";

export interface SkillData {
  name: string;
  slug: string;
  version: string;
  description: string;
  preambleTier: number | null;
  allowedTools: string[];
  triggers: string[];
  bodyHtml: string;
  bodyMarkdown: string;
}

const SHARED_SECTIONS = new Set([
  "Preamble (run first)",
  "Plan Mode Safe Operations",
  "Skill Invocation During Plan Mode",
  "Skill routing",
  "AskUserQuestion Format",
  "Artifacts Sync (skill start)",
  "Model-Specific Behavioral Patch (claude)",
  "Voice",
  "Context Recovery",
  "Writing Style",
  "Completeness Principle — Boil the Lake",
  "Confusion Protocol",
  "Continuous Checkpoint Mode",
  "Context Health (soft directive)",
  "Question Tuning (skip entirely if `QUESTION_TUNING: false`)",
  "Repo Ownership — See Something, Say Something",
  "Search Before Building",
  "Completion Status Protocol",
  "Operational Self-Improvement",
  "Telemetry (run last)",
  "Plan Status Footer",
]);

function parseFrontmatter(content: string): {
  meta: Record<string, any>;
  body: string;
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };
  return {
    meta: yaml.load(match[1]) as Record<string, any>,
    body: match[2],
  };
}

function stripSharedPreamble(body: string): string {
  const lines = body.split("\n");
  const result: string[] = [];
  let skipping = false;
  let inCodeBlock = false;
  let codeBlockDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        codeBlockDepth--;
        if (codeBlockDepth === 0) inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeBlockDepth = 1;
      }
      if (skipping) continue;
    }

    if (inCodeBlock) {
      if (skipping) continue;
      result.push(line);
      continue;
    }

    const headingMatch = line.match(/^## (.+)/);
    if (headingMatch) {
      const title = headingMatch[1].trim();
      const isShared = [...SHARED_SECTIONS].some(
        (s) => title === s || title.startsWith(s.split("(")[0].trim())
      );
      if (isShared) {
        skipping = true;
        continue;
      } else {
        skipping = false;
      }
    }

    if (skipping) continue;

    if (line.startsWith("<!-- AUTO-GENERATED")) continue;
    if (line.startsWith("<!-- Regenerate:")) continue;

    result.push(line);
  }

  return result.join("\n").trim();
}

async function discoverSkillFiles(root: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(root);

  for (const entry of entries) {
    if (entry.startsWith(".") || entry === "node_modules" || entry === "dist")
      continue;
    const fullPath = join(root, entry);
    const s = await stat(fullPath);
    if (s.isDirectory()) {
      const skillFile = join(fullPath, "SKILL.md");
      try {
        await stat(skillFile);
        files.push(skillFile);
      } catch {}
    }
  }

  return files;
}

export async function parseSkills(gstackRoot: string): Promise<SkillData[]> {
  const files = await discoverSkillFiles(gstackRoot);
  const skills: SkillData[] = [];

  for (const file of files) {
    const content = await readFile(file, "utf-8");
    const { meta, body } = parseFrontmatter(content);

    if (!meta.name) continue;

    const cleanBody = stripSharedPreamble(body);
    const bodyHtml = await marked(cleanBody);

    skills.push({
      name: meta.name,
      slug: basename(dirname(file)),
      version: meta.version || "0.0.0",
      description: (meta.description || "").trim(),
      preambleTier: meta["preamble-tier"] || null,
      allowedTools: Array.isArray(meta["allowed-tools"])
        ? meta["allowed-tools"]
        : [],
      triggers: Array.isArray(meta.triggers) ? meta.triggers : [],
      bodyHtml,
      bodyMarkdown: cleanBody,
    });
  }

  return skills.sort((a, b) => a.name.localeCompare(b.name));
}
