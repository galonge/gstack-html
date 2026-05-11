import { parseSkills } from "./parse-skills";
import { generateGraphData } from "./generate-graph-data";
import { generateHtml } from "./generate-html";
import { readFile } from "fs/promises";
import { join } from "path";
import { execSync } from "child_process";

const ROOT = join(import.meta.dir, "..");
const DIST = join(ROOT, "dist");
const SRC = join(ROOT, "src");
const UPSTREAM = join(ROOT, "upstream", "gstack");

async function fetchUpstream(): Promise<string> {
  const { existsSync } = await import("fs");
  if (existsSync(UPSTREAM)) {
    console.log("Pulling upstream gstack...");
    execSync("git pull --ff-only", { cwd: UPSTREAM, stdio: "inherit" });
  } else {
    console.log("Cloning upstream gstack...");
    execSync(
      `git clone --depth 1 https://github.com/garrytan/gstack.git ${UPSTREAM}`,
      { stdio: "inherit" }
    );
  }
  return readFile(join(UPSTREAM, "VERSION"), "utf-8").then((v) => v.trim());
}

async function main() {
  console.log("=== gstack-html build ===\n");

  let version: string;
  let gstackRoot: string;

  // Use local gstack if available (for development), otherwise fetch upstream
  const localGstack = join(
    process.env.HOME || "~",
    ".claude",
    "skills",
    "gstack"
  );
  const { existsSync } = await import("fs");

  if (process.env.USE_UPSTREAM || !existsSync(localGstack)) {
    version = await fetchUpstream();
    gstackRoot = UPSTREAM;
  } else {
    console.log("Using local gstack installation...");
    gstackRoot = localGstack;
    version = await readFile(join(localGstack, "VERSION"), "utf-8").then((v) =>
      v.trim()
    );
  }

  console.log(`Version: ${version}`);
  console.log(`Source: ${gstackRoot}\n`);

  console.log("Parsing skills...");
  const skills = await parseSkills(gstackRoot);
  console.log(`Found ${skills.length} skills\n`);

  console.log("Generating graph data...");
  const graphData = generateGraphData(skills, version);
  console.log(
    `${graphData.nodes.length} nodes, ${graphData.edges.length} edges\n`
  );

  console.log("Generating HTML...");
  await generateHtml(graphData, skills, DIST, SRC);
  console.log(`Output: ${DIST}/index.html\n`);

  console.log("=== Build complete ===");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
