import type { SkillData } from "./parse-skills";

export interface GraphNode {
  id: string;
  name: string;
  category: string;
  tier: number | null;
  description: string;
  version: string;
  triggers: string[];
  allowedTools: string[];
  workflowStage: number;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface CategoryInfo {
  color: string;
  label: string;
  stage: number;
  count: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  categories: Record<string, CategoryInfo>;
  meta: {
    version: string;
    totalSkills: number;
    buildDate: string;
  };
}

const CATEGORY_MAP: Record<string, string[]> = {
  Planning: [
    "office-hours",
    "plan-ceo-review",
    "plan-eng-review",
    "plan-design-review",
    "plan-devex-review",
    "plan-tune",
    "autoplan",
  ],
  Design: [
    "design-consultation",
    "design-html",
    "design-review",
    "design-shotgun",
  ],
  Build: ["review", "codex", "investigate", "qa", "qa-only"],
  Ship: [
    "ship",
    "land-and-deploy",
    "canary",
    "landing-report",
    "document-release",
    "setup-deploy",
    "gstack-upgrade",
  ],
  Ops: [
    "learn",
    "context-save",
    "context-restore",
    "retro",
    "health",
    "benchmark",
    "benchmark-models",
    "devex-review",
  ],
  Security: ["cso"],
  Browser: [
    "browse",
    "open-gstack-browser",
    "setup-browser-cookies",
    "pair-agent",
    "scrape",
  ],
  Safety: ["careful", "freeze", "unfreeze", "guard"],
  Utilities: ["skillify", "make-pdf", "sync-gbrain", "setup-gbrain"],
};

const CATEGORY_STYLES: Record<string, { color: string; stage: number }> = {
  Planning: { color: "#3B82F6", stage: 1 },
  Design: { color: "#8B5CF6", stage: 2 },
  Build: { color: "#22C55E", stage: 3 },
  Ship: { color: "#F59E0B", stage: 4 },
  Ops: { color: "#06B6D4", stage: 5 },
  Security: { color: "#EF4444", stage: 6 },
  Browser: { color: "#EC4899", stage: 7 },
  Safety: { color: "#F97316", stage: 8 },
  Utilities: { color: "#6B7280", stage: 9 },
};

const WORKFLOW_EDGES: [string, string][] = [
  ["office-hours", "plan-ceo-review"],
  ["office-hours", "plan-eng-review"],
  ["plan-ceo-review", "plan-eng-review"],
  ["plan-eng-review", "plan-design-review"],
  ["plan-design-review", "plan-devex-review"],
  ["design-consultation", "design-shotgun"],
  ["design-shotgun", "design-html"],
  ["design-html", "design-review"],
  ["qa", "review"],
  ["review", "ship"],
  ["ship", "land-and-deploy"],
  ["land-and-deploy", "canary"],
  ["canary", "document-release"],
  ["context-save", "context-restore"],
  ["careful", "guard"],
  ["freeze", "guard"],
  ["investigate", "qa"],
  ["browse", "qa"],
  ["browse", "scrape"],
  ["setup-gbrain", "sync-gbrain"],
  ["benchmark", "benchmark-models"],
  ["learn", "retro"],
];

function getCategory(skillName: string): string {
  for (const [cat, skills] of Object.entries(CATEGORY_MAP)) {
    if (skills.includes(skillName)) return cat;
  }
  return "Utilities";
}

function inferEdgesFromText(
  skill: SkillData,
  allNames: Set<string>
): GraphEdge[] {
  const edges: GraphEdge[] = [];
  const text = skill.description + " " + skill.bodyMarkdown;
  const pattern = /\/([a-z][\w-]*)/g;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    const target = match[1];
    if (target !== skill.slug && allNames.has(target)) {
      edges.push({ source: skill.slug, target });
    }
  }
  return edges;
}

export function generateGraphData(
  skills: SkillData[],
  version: string
): GraphData {
  const allNames = new Set(skills.map((s) => s.slug));

  const nodes: GraphNode[] = skills.map((s) => ({
    id: s.slug,
    name: s.name,
    category: getCategory(s.slug),
    tier: s.preambleTier,
    description: s.description,
    version: s.version,
    triggers: s.triggers,
    allowedTools: s.allowedTools,
    workflowStage: CATEGORY_STYLES[getCategory(s.slug)]?.stage ?? 9,
  }));

  const edgeSet = new Set<string>();
  const edges: GraphEdge[] = [];

  const addEdge = (source: string, target: string) => {
    const key = `${source}->${target}`;
    if (!edgeSet.has(key) && allNames.has(source) && allNames.has(target)) {
      edgeSet.add(key);
      edges.push({ source, target });
    }
  };

  for (const [s, t] of WORKFLOW_EDGES) addEdge(s, t);

  for (const skill of skills) {
    for (const edge of inferEdgesFromText(skill, allNames)) {
      addEdge(edge.source, edge.target);
    }
  }

  const categoryCounts: Record<string, number> = {};
  for (const n of nodes) {
    categoryCounts[n.category] = (categoryCounts[n.category] || 0) + 1;
  }

  const categories: Record<string, CategoryInfo> = {};
  for (const [name, style] of Object.entries(CATEGORY_STYLES)) {
    categories[name] = {
      ...style,
      label: name,
      count: categoryCounts[name] || 0,
    };
  }

  return {
    nodes,
    edges,
    categories,
    meta: {
      version,
      totalSkills: skills.length,
      buildDate: new Date().toISOString(),
    },
  };
}
