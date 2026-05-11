import { readFile, writeFile, mkdir, cp } from "fs/promises";
import { join } from "path";
import type { SkillData } from "./parse-skills";
import type { GraphData } from "./generate-graph-data";

export async function generateHtml(
  graphData: GraphData,
  skills: SkillData[],
  distDir: string,
  srcDir: string
): Promise<void> {
  await mkdir(distDir, { recursive: true });
  await mkdir(join(distDir, "assets"), { recursive: true });

  let template = await readFile(join(srcDir, "template.html"), "utf-8");

  const cssFiles = ["main.css", "story.css", "flow.css", "atlas.css"];
  const cssContents: string[] = [];
  for (const f of cssFiles) {
    cssContents.push(await readFile(join(srcDir, "styles", f), "utf-8"));
  }

  const jsFiles = ["story.js", "flow.js", "atlas.js", "app.js"];
  const jsContents: string[] = [];
  for (const f of jsFiles) {
    jsContents.push(await readFile(join(srcDir, "js", f), "utf-8"));
  }

  function escapeForScript(json: string): string {
    return json.replace(/<\/(script)/gi, "<\\/$1");
  }

  const skillsJson = escapeForScript(JSON.stringify(skills.map(s => ({
    name: s.name,
    slug: s.slug,
    version: s.version,
    description: s.description,
    preambleTier: s.preambleTier,
    allowedTools: s.allowedTools,
    triggers: s.triggers,
    bodyHtml: s.bodyHtml,
    bodyMarkdown: s.bodyMarkdown,
  }))));

  const graphJson = escapeForScript(JSON.stringify(graphData));

  // Use function-form replacements to avoid $-pattern interpretation in replacement strings
  template = template
    .replace("{{INLINE_CSS}}", () => cssContents.join("\n\n"))
    .replace("{{INLINE_JS}}", () => jsContents.join("\n\n"))
    .replace("{{SKILLS_DATA}}", () => skillsJson)
    .replace("{{GRAPH_DATA}}", () => graphJson)
    .replace(/\{\{VERSION\}\}/g, () => graphData.meta.version)
    .replace(/\{\{BUILD_DATE\}\}/g, () => graphData.meta.buildDate)
    .replace(/\{\{TOTAL_SKILLS\}\}/g, () => String(graphData.meta.totalSkills));

  await writeFile(join(distDir, "index.html"), template);

  try {
    await cp(join(srcDir, "assets"), join(distDir, "assets"), { recursive: true });
  } catch {}
}
