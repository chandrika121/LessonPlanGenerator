/**
 * SVG Template Engine for K12 Scientific Diagrams
 * Generates parametric, grade-appropriate SVG diagrams for CBSE/NCERT curriculum
 */

import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type {
  SvgTemplateFn,
  SvgTemplateParams,
  SvgTemplateRegistryEntry,
  VisualType,
  GeneratedVisualAsset,
  GeneratorType,
} from "../../../src/types-visual.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ASSET_DIR = path.resolve(__dirname, "../../../assets/visuals");

// Ensure asset directory exists
async function ensureAssetDir() {
  await fs.mkdir(ASSET_DIR, { recursive: true });
}

// ───────────────────────────────────────────────
// SVG HELPERS
// ───────────────────────────────────────────────

function wrapSvg(content: string, width: number, height: number, title?: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${title ? `<title>${escapeXml(title)}</title>` : ""}
  ${content}
</svg>`;
}

function escapeXml(str: string): string {
  let result = str;
  const amp = String.fromCharCode(38);
  result = result.replace(new RegExp(amp, "g"), amp + "amp;");
  result = result.replace(/</g, amp + "lt;");
  result = result.replace(/>/g, amp + "gt;");
  result = result.replace(new RegExp(String.fromCharCode(34), "g"), amp + "quot;");
  result = result.replace(new RegExp(String.fromCharCode(39), "g"), amp + "apos;");
  return result;
}

function labelBox(x: number, y: number, text: string, fontSize = 12): string {
  const lines = text.split("\n");
  const lineHeight = fontSize * 1.3;
  const textContent = lines
    .map((line, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`)
    .join("");
  return `
<rect x="${x - 4}" y="${y - fontSize - 2}" width="${text.length * fontSize * 0.6 + 8}" height="${lines.length * lineHeight + 4}" rx="3" fill="rgba(255,255,255,0.92)" stroke="#94a3b8" stroke-width="0.5"/>
<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${fontSize}" fill="#1e293b" font-weight="500">${textContent}</text>`;
}

function arrowHead(x: number, y: number, angle: number, size = 6, color = "#334155"): string {
  const rad = (angle * Math.PI) / 180;
  const x1 = x - size * Math.cos(rad - 0.5);
  const y1 = y - size * Math.sin(rad - 0.5);
  const x2 = x - size * Math.cos(rad + 0.5);
  const y2 = y - size * Math.sin(rad + 0.5);
  return `<polygon points="${x},${y} ${x1},${y1} ${x2},${y2}" fill="${color}"/>`;
}

// ───────────────────────────────────────────────
// TEMPLATE DEFINITIONS
// ───────────────────────────────────────────────

const builtinTemplates: SvgTemplateRegistryEntry[] = [];

// 1. Cell Structure (Plant Cell) — Class 6-9
function plantCellTemplate(params: SvgTemplateParams): string {
  const grade = params.gradeLevel || 7;
  const detailLevel = grade <= 8 ? "basic" : "detailed";
  const labels = params.labels || [
    "Cell wall", "Cell membrane", "Cytoplasm", "Nucleus", "Vacuole", "Chloroplast", "Mitochondria",
  ];
  const W = 600, H = 400;

  let body = "";
  // Cell wall (outer rectangle with rounded corners)
  body += `<rect x="50" y="40" width="500" height="320" rx="30" fill="#dcfce7" stroke="#16a34a" stroke-width="3"/>`;
  // Cell membrane
  body += `<rect x="60" y="50" width="480" height="300" rx="25" fill="#f0fdf4" stroke="#22c55e" stroke-width="2" stroke-dasharray="4,2"/>`;
  // Nucleus
  body += `<ellipse cx="300" cy="200" rx="60" ry="40" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>`;
  body += `<circle cx="300" cy="200" r="15" fill="#fde68a" stroke="#d97706" stroke-width="1.5"/>`;
  body += `<text x="300" y="205" text-anchor="middle" font-size="10" fill="#92400e">Nucleus</text>`;
  // Large vacuole
  body += `<ellipse cx="420" cy="140" rx="50" ry="35" fill="#dbeafe" stroke="#3b82f6" stroke-width="1.5"/>`;
  body += `<text x="420" y="145" text-anchor="middle" font-size="10" fill="#1e40af">Vacuole</text>`;
  // Chloroplasts
  body += `<ellipse cx="150" cy="120" rx="22" ry="14" fill="#bbf7d0" stroke="#16a34a" stroke-width="1.5"/>`;
  body += `<ellipse cx="180" cy="280" rx="22" ry="14" fill="#bbf7d0" stroke="#16a34a" stroke-width="1.5"/>`;
  body += `<ellipse cx="450" cy="260" rx="22" ry="14" fill="#bbf7d0" stroke="#16a34a" stroke-width="1.5"/>`;
  // Mitochondria
  if (detailLevel === "detailed") {
    body += `<ellipse cx="150" cy="260" rx="18" ry="12" fill="#fecaca" stroke="#dc2626" stroke-width="1.5"/>`;
    body += `<ellipse cx="440" cy="100" rx="18" ry="12" fill="#fecaca" stroke="#dc2626" stroke-width="1.5"/>`;
  }
  // Cytoplasm fill
  body += `<text x="300" y="320" text-anchor="middle" font-size="11" fill="#166534">Cytoplasm</text>`;

  // Label lines
  const labelPositions = [
    { x: 50, y: 20, text: "Cell wall" },
    { x: 60, y: 360, text: "Cell membrane" },
    { x: 520, y: 140, text: "Vacuole" },
  ];
  for (const lp of labelPositions) {
    if (labels.includes(lp.text)) {
      body += labelBox(lp.x, lp.y, lp.text);
    }
  }

  return wrapSvg(body, W, H, "Plant Cell Diagram");
}

builtinTemplates.push({
  id: "plant_cell",
  name: "Plant Cell",
  subject: "Science",
  gradeRange: [6, 10],
  visualType: "scientific_diagram",
  template: plantCellTemplate,
  defaultParams: { gradeLevel: 7, labels: ["Cell wall", "Cell membrane", "Cytoplasm", "Nucleus", "Vacuole", "Chloroplast"], style: "clean" },
});

// 2. Animal Cell — Class 6-9
function animalCellTemplate(params: SvgTemplateParams): string {
  const grade = params.gradeLevel || 7;
  const detailLevel = grade <= 8 ? "basic" : "detailed";
  const labels = params.labels || ["Cell membrane", "Cytoplasm", "Nucleus", "Mitochondria", "Vacuole"];
  const W = 600, H = 400;

  let body = "";
  // Cell membrane (irregular oval)
  body += `<path d="M300,60 C450,60 520,150 510,250 C500,340 400,380 300,370 C200,360 100,320 90,220 C80,130 160,60 300,60 Z" fill="#fef2f2" stroke="#ef4444" stroke-width="3"/>`;
  body += `<path d="M300,75 C430,75 490,155 480,245 C470,325 380,360 300,350 C220,340 120,305 110,215 C100,135 170,75 300,75 Z" fill="#fff5f5" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="4,2"/>`;

  // Nucleus
  body += `<ellipse cx="300" cy="200" rx="55" ry="38" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>`;
  body += `<circle cx="300" cy="200" r="14" fill="#fde68a" stroke="#d97706" stroke-width="1.5"/>`;
  body += `<text x="300" y="205" text-anchor="middle" font-size="10" fill="#92400e">Nucleus</text>`;

  // Small vacuoles
  body += `<ellipse cx="400" cy="140" rx="18" ry="12" fill="#dbeafe" stroke="#3b82f6" stroke-width="1.5"/>`;
  body += `<ellipse cx="200" cy="280" rx="18" ry="12" fill="#dbeafe" stroke="#3b82f6" stroke-width="1.5"/>`;

  // Mitochondria
  if (detailLevel === "detailed") {
    body += `<ellipse cx="180" cy="150" rx="20" ry="12" fill="#fecaca" stroke="#dc2626" stroke-width="1.5" transform="rotate(-20 180 150)"/>`;
    body += `<ellipse cx="420" cy="260" rx="20" ry="12" fill="#fecaca" stroke="#dc2626" stroke-width="1.5" transform="rotate(15 420 260)"/>`;
  }

  body += `<text x="300" y="330" text-anchor="middle" font-size="11" fill="#991b1b">Cytoplasm</text>`;

  const labelPositions = [
    { x: 520, y: 40, text: "Cell membrane" },
    { x: 520, y: 140, text: "Vacuole" },
  ];
  for (const lp of labelPositions) {
    if (labels.includes(lp.text)) {
      body += labelBox(lp.x, lp.y, lp.text);
    }
  }

  return wrapSvg(body, W, H, "Animal Cell Diagram");
}

builtinTemplates.push({
  id: "animal_cell",
  name: "Animal Cell",
  subject: "Science",
  gradeRange: [6, 10],
  visualType: "scientific_diagram",
  template: animalCellTemplate,
  defaultParams: { gradeLevel: 7, labels: ["Cell membrane", "Cytoplasm", "Nucleus", "Mitochondria", "Vacuole"], style: "clean" },
});

// 3. Human Digestive System — Class 7-10
function digestiveSystemTemplate(params: SvgTemplateParams): string {
  const grade = params.gradeLevel || 7;
  const labels = params.labels || ["Mouth", "Oesophagus", "Stomach", "Small intestine", "Large intestine"];
  const W = 600, H = 400;

  let body = "";
  // Body outline
  body += `<rect x="0" y="0" width="${W}" height="${H}" fill="#f8fafc"/>`;
  // Mouth / head
  body += `<ellipse cx="80" cy="80" rx="50" ry="45" fill="#fed7aa" stroke="#ea580c" stroke-width="2"/>`;
  // Oesophagus
  body += `<rect x="70" y="120" width="20" height="80" rx="10" fill="#fca5a5" stroke="#dc2626" stroke-width="1.5"/>`;
  // Stomach (J-shape)
  body += `<path d="M90,200 C120,180 160,190 170,230 C175,260 150,290 120,300 C90,305 60,280 70,250 Z" fill="#fecaca" stroke="#dc2626" stroke-width="2"/>`;
  // Small intestine (coiled)
  body += `<path d="M120,300 C180,310 220,280 240,250 C260,230 270,280 250,310 C230,340 180,350 140,330 C110,320 100,350 120,370 C150,390 200,380 230,360 C260,340 280,300 260,270" fill="none" stroke="#f59e0b" stroke-width="14" stroke-linecap="round"/>`;
  // Large intestine (frame around)
  body += `<path d="M110,190 C250,170 350,190 380,240 C400,290 350,350 250,370 C150,380 80,350 70,300" fill="none" stroke="#3b82f6" stroke-width="18" stroke-linecap="round"/>`;

  // Labels
  const labelMap = [
    { x: 80, y: 35, text: "Mouth" },
    { x: 100, y: 160, text: "Oesophagus" },
    { x: 180, y: 250, text: "Stomach" },
    { x: 300, y: 320, text: "Small intestine" },
    { x: 400, y: 220, text: "Large intestine" },
  ];
  for (const lp of labelMap) {
    if (labels.includes(lp.text)) {
      body += labelBox(lp.x, lp.y, lp.text, 11);
    }
  }

  return wrapSvg(body, W, H, "Human Digestive System");
}

builtinTemplates.push({
  id: "digestive_system",
  name: "Human Digestive System",
  subject: "Science",
  gradeRange: [7, 10],
  visualType: "scientific_diagram",
  template: digestiveSystemTemplate,
  defaultParams: { gradeLevel: 7, labels: ["Mouth", "Oesophagus", "Stomach", "Small intestine", "Large intestine"], style: "clean" },
});

// 4. Simple Electric Circuit — Class 6-10
function electricCircuitTemplate(params: SvgTemplateParams): string {
  const grade = params.gradeLevel || 7;
  const circuitType = params.circuitType || "series";
  const W = 600, H = 400;

  let body = "";
  body += `<rect x="0" y="0" width="${W}" height="${H}" fill="#f8fafc"/>`;

  // Battery
  body += `<rect x="120" y="180" width="60" height="40" rx="4" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>`;
  body += `<text x="150" y="205" text-anchor="middle" font-size="12" fill="#854d0e">Battery</text>`;
  body += `<rect x="110" y="185" width="10" height="12" fill="#ca8a04"/>`;
  body += `<rect x="110" y="203" width="10" height="12" fill="#ca8a04"/>`;
  body += `<text x="110" y="182" text-anchor="end" font-size="10" fill="#ca8a04">+</text>`;
  body += `<text x="110" y="225" text-anchor="end" font-size="10" fill="#ca8a04">−</text>`;

  // Bulb
  body += `<circle cx="450" cy="100" r="25" fill="#fef9c3" stroke="#eab308" stroke-width="2"/>`;
  body += `<path d="M440,100 L450,90 L460,100 L455,108 L445,108 Z" fill="#fde047"/>`;
  body += `<text x="450" y="140" text-anchor="middle" font-size="11" fill="#854d0e">Bulb</text>`;

  // Switch (open or closed)
  const switchOpen = params.switchOpen !== false;
  if (switchOpen) {
    body += `<line x1="350" y1="300" x2="380" y2="270" stroke="#475569" stroke-width="3"/>`;
  } else {
    body += `<line x1="350" y1="300" x2="390" y2="300" stroke="#475569" stroke-width="3"/>`;
  }
  body += `<circle cx="340" cy="300" r="5" fill="#475569"/>`;
  body += `<circle cx="390" cy="300" r="5" fill="#475569"/>`;
  body += `<text x="365" y="330" text-anchor="middle" font-size="11" fill="#334155">Switch</text>`;

  // Connecting wires
  body += `<line x1="180" y1="200" x2="450" y2="200" stroke="#475569" stroke-width="2.5"/>`; // battery top to bulb level
  body += `<line x1="450" y1="200" x2="450" y2="125" stroke="#475569" stroke-width="2.5"/>`; // up to bulb
  body += `<line x1="450" y1="75" x2="450" y2="300" stroke="#475569" stroke-width="2.5"/>`; // bulb down to switch
  body += `<line x1="340" y1="300" x2="120" y2="300" stroke="#475569" stroke-width="2.5"/>`; // switch to battery bottom
  body += `<line x1="120" y1="300" x2="120" y2="220" stroke="#475569" stroke-width="2.5"/>`; // to battery -

  // Current arrows (if switch closed)
  if (!switchOpen) {
    body += arrowHead(300, 200, 0, 8, "#ef4444");
    body += arrowHead(450, 180, 90, 8, "#ef4444");
    body += arrowHead(400, 300, 180, 8, "#ef4444");
    body += arrowHead(120, 260, 270, 8, "#ef4444");
    body += `<text x="250" y="190" font-size="10" fill="#ef4444">Current</text>`;
  }

  return wrapSvg(body, W, H, `Simple ${circuitType} Electric Circuit`);
}

builtinTemplates.push({
  id: "electric_circuit_series",
  name: "Simple Electric Circuit",
  subject: "Science",
  gradeRange: [6, 10],
  visualType: "experiment_setup",
  template: electricCircuitTemplate,
  defaultParams: { gradeLevel: 7, circuitType: "series", switchOpen: false, style: "clean" },
});

// 5. Water Cycle — Class 5-8
function waterCycleTemplate(params: SvgTemplateParams): string {
  const W = 600, H = 400;

  let body = "";
  body += `<rect x="0" y="0" width="${W}" height="${H}" fill="#e0f2fe"/>`;
  // Sun
  body += `<circle cx="100" cy="80" r="40" fill="#fde047" stroke="#eab308" stroke-width="2"/>`;
  body += `<line x1="60" y1="80" x2="30" y2="80" stroke="#eab308" stroke-width="3"/>`;
  body += `<line x1="140" y1="80" x2="170" y2="80" stroke="#eab308" stroke-width="3"/>`;
  body += `<line x1="100" y1="40" x2="100" y2="10" stroke="#eab308" stroke-width="3"/>`;
  body += `<line x1="100" y1="120" x2="100" y2="150" stroke="#eab308" stroke-width="3"/>`;
  body += `<text x="100" y="85" text-anchor="middle" font-size="12" fill="#854d0e">Sun</text>`;

  // Mountains
  body += `<path d="M0,280 L100,180 L200,280 Z" fill="#a8a29e" stroke="#78716c" stroke-width="2"/>`;
  body += `<path d="M150,280 L280,150 L400,280 Z" fill="#a8a29e" stroke="#78716c" stroke-width="2"/>`;
  body += `<text x="150" y="210" font-size="11" fill="#57534e">Mountains</text>`;

  // Water body
  body += `<path d="M400,280 C450,260 500,260 550,280 L600,280 L600,400 L400,400 Z" fill="#3b82f6" stroke="#2563eb" stroke-width="2"/>`;
  body += `<text x="500" y="340" text-anchor="middle" font-size="11" fill="#dbeafe">Water</text>`;

  // Clouds
  body += `<ellipse cx="350" cy="60" rx="60" ry="25" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>`;
  body += `<ellipse cx="420" cy="55" rx="50" ry="20" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>`;
  body += `<text x="380" y="65" text-anchor="middle" font-size="11" fill="#475569">Clouds</text>`;

  // Evaporation arrows (up from water)
  body += arrowHead(500, 260, 270, 8, "#3b82f6");
  body += `<text x="520" y="240" font-size="10" fill="#2563eb">Evaporation</text>`;

  // Condensation arrows (to clouds)
  body += arrowHead(400, 100, 0, 8, "#94a3b8");
  body += `<text x="410" y="90" font-size="10" fill="#475569">Condensation</text>`;

  // Precipitation arrows (down from clouds)
  body += arrowHead(350, 120, 90, 8, "#3b82f6");
  body += arrowHead(380, 120, 90, 8, "#3b82f6");
  body += `<text x="320" y="130" font-size="10" fill="#2563eb">Precipitation</text>`;

  // Collection arrow
  body += arrowHead(450, 280, 90, 8, "#3b82f6");
  body += `<text x="460" y="300" font-size="10" fill="#2563eb">Collection</text>`;

  return wrapSvg(body, W, H, "Water Cycle");
}

builtinTemplates.push({
  id: "water_cycle",
  name: "Water Cycle",
  subject: "Science",
  gradeRange: [5, 8],
  visualType: "scientific_diagram",
  template: waterCycleTemplate,
  defaultParams: { gradeLevel: 6, style: "clean" },
});

// 6. Human Heart (Basic) — Class 7-10
function humanHeartTemplate(params: SvgTemplateParams): string {
  const grade = params.gradeLevel || 7;
  const labels = params.labels || ["Aorta", "Left ventricle", "Right ventricle", "Left atrium", "Right atrium", "Pulmonary artery"];
  const W = 600, H = 400;

  let body = "";
  body += `<rect x="0" y="0" width="${W}" height="${H}" fill="#fef2f2"/>`;
  // Heart shape (simplified)
  body += `<path d="M300,120 C360,60 420,80 420,150 C420,210 300,300 300,300 C300,300 180,210 180,150 C180,80 240,60 300,120 Z" fill="#fecaca" stroke="#dc2626" stroke-width="3"/>`;
  // Septum
  body += `<line x1="300" y1="100" x2="300" y2="280" stroke="#dc2626" stroke-width="2"/>`;
  // Atria
  body += `<ellipse cx="240" cy="110" rx="35" ry="25" fill="#fde68a" stroke="#d97706" stroke-width="1.5"/>`;
  body += `<ellipse cx="360" cy="110" rx="35" ry="25" fill="#fde68a" stroke="#d97706" stroke-width="1.5"/>`;
  // Ventricles
  body += `<ellipse cx="250" cy="220" rx="40" ry="55" fill="#fca5a5" stroke="#dc2626" stroke-width="1.5"/>`;
  body += `<ellipse cx="350" cy="220" rx="40" ry="55" fill="#fca5a5" stroke="#dc2626" stroke-width="1.5"/>`;
  // Aorta
  body += `<path d="M300,100 Q300,60 330,50 Q360,40 380,60" fill="none" stroke="#7f1d1d" stroke-width="8" stroke-linecap="round"/>`;
  // Pulmonary artery
  body += `<path d="M300,100 Q300,50 270,40 Q240,30 220,50" fill="none" stroke="#3b82f6" stroke-width="6" stroke-linecap="round"/>`;

  const labelMap = [
    { x: 400, y: 50, text: "Aorta" },
    { x: 180, y: 50, text: "Pulmonary artery" },
    { x: 240, y: 80, text: "Left atrium" },
    { x: 360, y: 80, text: "Right atrium" },
    { x: 200, y: 220, text: "Left ventricle" },
    { x: 400, y: 220, text: "Right ventricle" },
  ];
  for (const lp of labelMap) {
    if (labels.includes(lp.text)) {
      body += labelBox(lp.x, lp.y, lp.text, 11);
    }
  }

  return wrapSvg(body, W, H, "Human Heart Diagram");
}

builtinTemplates.push({
  id: "human_heart",
  name: "Human Heart",
  subject: "Science",
  gradeRange: [7, 10],
  visualType: "scientific_diagram",
  template: humanHeartTemplate,
  defaultParams: { gradeLevel: 7, labels: ["Aorta", "Left ventricle", "Right ventricle", "Left atrium", "Right atrium"], style: "clean" },
});

// 7. Food Chain (Grassland) — Class 5-8
function foodChainTemplate(params: SvgTemplateParams): string {
  const ecosystem = params.ecosystem || "grassland";
  const W = 600, H = 200;

  let body = "";
  body += `<rect x="0" y="0" width="${W}" height="${H}" fill="#f0fdf4"/>`;
  // Grass / Producer
  body += `<rect x="40" y="120" width="40" height="60" fill="#22c55e"/>`;
  body += `<path d="M40,120 L60,80 L80,120" fill="#4ade80"/>`;
  body += `<text x="60" y="170" text-anchor="middle" font-size="11" fill="#166534">Grass</text>`;
  body += `<text x="60" y="185" text-anchor="middle" font-size="10" fill="#15803d">Producer</text>`;

  // Arrow 1
  body += arrowHead(140, 120, 0, 10, "#475569");
  body += `<line x1="80" y1="120" x2="140" y2="120" stroke="#475569" stroke-width="2"/>`;

  // Deer / Primary consumer
  body += `<ellipse cx="200" cy="140" rx="35" ry="25" fill="#d97706"/>`;
  body += `<circle cx="190" cy="120" r="12" fill="#d97706"/>`;
  body += `<ellipse cx="170" cy="115" rx="5" ry="10" fill="#d97706"/>`;
  body += `<ellipse cx="165" cy="100" rx="4" ry="8" fill="#d97706"/>`;
  body += `<text x="200" y="180" text-anchor="middle" font-size="11" fill="#92400e">Deer</text>`;
  body += `<text x="200" y="195" text-anchor="middle" font-size="10" fill="#a16207">Consumer</text>`;

  // Arrow 2
  body += arrowHead(290, 120, 0, 10, "#475569");
  body += `<line x1="240" y1="120" x2="290" y2="120" stroke="#475569" stroke-width="2"/>`;

  // Lion / Secondary consumer
  body += `<ellipse cx="350" cy="140" rx="40" ry="28" fill="#ef4444"/>`;
  body += `<circle cx="340" cy="115" r="14" fill="#ef4444"/>`;
  body += `<ellipse cx="315" cy="110" rx="6" ry="12" fill="#ef4444"/>`;
  body += `<ellipse cx="310" cy="95" rx="5" ry="10" fill="#ef4444"/>`;
  body += `<text x="350" y="185" text-anchor="middle" font-size="11" fill="#991b1b">Lion</text>`;
  body += `<text x="350" y="200" text-anchor="middle" font-size="10" fill="#b91c1c">Predator</text>`;

  // Arrow 3 (decomposer return)
  body += `<line x1="350" y1="200" x2="60" y2="200" stroke="#78716c" stroke-width="1.5" stroke-dasharray="5,3"/>`;
  body += arrowHead(70, 200, 180, 8, "#78716c");
  body += `<text x="200" y="215" text-anchor="middle" font-size="10" fill="#57534e">Decomposers return nutrients</text>`;

  return wrapSvg(body, W, H, "Food Chain — Grassland Ecosystem");
}

builtinTemplates.push({
  id: "food_chain_grassland",
  name: "Food Chain (Grassland)",
  subject: "Science",
  gradeRange: [5, 8],
  visualType: "scientific_diagram",
  template: foodChainTemplate,
  defaultParams: { gradeLevel: 6, ecosystem: "grassland", style: "clean" },
});

// 8. Periodic Table (Excerpt: First 20) — Class 9-10
function periodicTableExcerptTemplate(params: SvgTemplateParams): string {
  const W = 700, H = 300;
  const elements = [
    { symbol: "H", name: "Hydrogen", n: 1, x: 1, y: 1, color: "#fca5a5" },
    { symbol: "He", name: "Helium", n: 2, x: 18, y: 1, color: "#bae6fd" },
    { symbol: "Li", name: "Lithium", n: 3, x: 1, y: 2, color: "#fca5a5" },
    { symbol: "Be", name: "Beryllium", n: 4, x: 2, y: 2, color: "#fcd34d" },
    { symbol: "B", name: "Boron", n: 5, x: 13, y: 2, color: "#c4b5fd" },
    { symbol: "C", name: "Carbon", n: 6, x: 14, y: 2, color: "#86efac" },
    { symbol: "N", name: "Nitrogen", n: 7, x: 15, y: 2, color: "#86efac" },
    { symbol: "O", name: "Oxygen", n: 8, x: 16, y: 2, color: "#86efac" },
    { symbol: "F", name: "Fluorine", n: 9, x: 17, y: 2, color: "#86efac" },
    { symbol: "Ne", name: "Neon", n: 10, x: 18, y: 2, color: "#bae6fd" },
    { symbol: "Na", name: "Sodium", n: 11, x: 1, y: 3, color: "#fca5a5" },
    { symbol: "Mg", name: "Magnesium", n: 12, x: 2, y: 3, color: "#fcd34d" },
    { symbol: "Al", name: "Aluminium", n: 13, x: 13, y: 3, color: "#c4b5fd" },
    { symbol: "Si", name: "Silicon", n: 14, x: 14, y: 3, color: "#c4b5fd" },
    { symbol: "P", name: "Phosphorus", n: 15, x: 15, y: 3, color: "#86efac" },
    { symbol: "S", name: "Sulphur", n: 16, x: 16, y: 3, color: "#86efac" },
    { symbol: "Cl", name: "Chlorine", n: 17, x: 17, y: 3, color: "#86efac" },
    { symbol: "Ar", name: "Argon", n: 18, x: 18, y: 3, color: "#bae6fd" },
    { symbol: "K", name: "Potassium", n: 19, x: 1, y: 4, color: "#fca5a5" },
    { symbol: "Ca", name: "Calcium", n: 20, x: 2, y: 4, color: "#fcd34d" },
  ];

  let body = "";
  const cellW = 32, cellH = 36, startX = 30, startY = 20;

  for (const el of elements) {
    const cx = startX + (el.x - 1) * cellW + cellW / 2;
    const cy = startY + (el.y - 1) * cellH + cellH / 2;
    body += `<rect x="${startX + (el.x - 1) * cellW}" y="${startY + (el.y - 1) * cellH}" width="${cellW}" height="${cellH}" fill="${el.color}" stroke="#475569" stroke-width="0.5"/>`;
    body += `<text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="7" fill="#0f172a">${el.n}</text>`;
    body += `<text x="${cx}" y="${cy + 7}" text-anchor="middle" font-size="10" font-weight="bold" fill="#0f172a">${el.symbol}</text>`;
  }

  // Legend
  body += `<rect x="30" y="170" width="12" height="12" fill="#fca5a5" stroke="#475569" stroke-width="0.5"/>`;
  body += `<text x="48" y="181" font-size="10" fill="#334155">Metal</text>`;
  body += `<rect x="100" y="170" width="12" height="12" fill="#86efac" stroke="#475569" stroke-width="0.5"/>`;
  body += `<text x="118" y="181" font-size="10" fill="#334155">Non-metal</text>`;
  body += `<rect x="190" y="170" width="12" height="12" fill="#c4b5fd" stroke="#475569" stroke-width="0.5"/>`;
  body += `<text x="208" y="181" font-size="10" fill="#334155">Metalloid</text>`;
  body += `<rect x="280" y="170" width="12" height="12" fill="#bae6fd" stroke="#475569" stroke-width="0.5"/>`;
  body += `<text x="298" y="181" font-size="10" fill="#334155">Noble gas</text>`;
  body += `<rect x="370" y="170" width="12" height="12" fill="#fcd34d" stroke="#475569" stroke-width="0.5"/>`;
  body += `<text x="388" y="181" font-size="10" fill="#334155">Alkali earth</text>`;

  return wrapSvg(body, W, H, "Periodic Table (First 20 Elements)");
}

builtinTemplates.push({
  id: "periodic_table_excerpt",
  name: "Periodic Table (First 20 Elements)",
  subject: "Science",
  gradeRange: [9, 10],
  visualType: "scientific_diagram",
  template: periodicTableExcerptTemplate,
  defaultParams: { gradeLevel: 9, style: "clean" },
});

// 9. Lens Ray Diagram (Convex) — Class 10
function convexLensRayDiagramTemplate(params: SvgTemplateParams): string {
  const W = 600, H = 350;
  const objectDistance = params.objectDistance || 150; // distance from lens
  const focalLength = params.focalLength || 80;
  const lensX = 300;
  const objectHeight = 60;
  const objectX = lensX - objectDistance;
  const objectTopY = 175 - objectHeight;
  const imageDistance = (focalLength * objectDistance) / (objectDistance - focalLength);
  const imageHeight = (imageDistance * objectHeight) / objectDistance;
  const imageX = lensX + imageDistance;
  const imageTopY = 175 + imageHeight;

  let body = "";
  // Principal axis
  body += `<line x1="30" y1="175" x2="570" y2="175" stroke="#334155" stroke-width="1.5"/>`;
  body += `<text x="570" y="190" font-size="10" fill="#334155">Principal axis</text>`;
  // Lens (vertical line with arrow tips)
  body += `<line x1="${lensX}" y1="100" x2="${lensX}" y2="250" stroke="#3b82f6" stroke-width="3"/>`;
  body += `<path d="M${lensX - 10},100 L${lensX},85 L${lensX + 10},100" fill="none" stroke="#3b82f6" stroke-width="2"/>`;
  body += `<path d="M${lensX - 10},250 L${lensX},265 L${lensX + 10},250" fill="none" stroke="#3b82f6" stroke-width="2"/>`;
  body += `<text x="${lensX}" y="280" text-anchor="middle" font-size="10" fill="#1d4ed8">Convex Lens</text>`;

  // Focal points
  body += `<line x1="${lensX - focalLength}" y1="170" x2="${lensX - focalLength}" y2="180" stroke="#dc2626" stroke-width="2"/>`;
  body += `<text x="${lensX - focalLength}" y="195" text-anchor="middle" font-size="9" fill="#dc2626">F</text>`;
  body += `<line x1="${lensX + focalLength}" y1="170" x2="${lensX + focalLength}" y2="180" stroke="#dc2626" stroke-width="2"/>`;
  body += `<text x="${lensX + focalLength}" y="195" text-anchor="middle" font-size="9" fill="#dc2626">F'</text>`;

  // Object (upward arrow)
  body += `<line x1="${objectX}" y1="175" x2="${objectX}" y2="${objectTopY}" stroke="#16a34a" stroke-width="2.5"/>`;
  body += `<polygon points="${objectX},${objectTopY} ${objectX - 6},${objectTopY + 10} ${objectX + 6},${objectTopY + 10}" fill="#16a34a"/>`;
  body += `<text x="${objectX - 15}" y="150" font-size="10" fill="#16a34a">Object</text>`;

  // Ray 1: Parallel to principal axis, then through focal point F'
  body += `<line x1="${objectX}" y1="${objectTopY}" x2="${lensX}" y2="${objectTopY}" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="4,2"/>`;
  body += `<line x1="${lensX}" y1="${objectTopY}" x2="${imageX}" y2="${imageTopY > 175 ? imageTopY : 175 - (imageTopY - 175)}" stroke="#f59e0b" stroke-width="1.5"/>`;

  // Ray 2: Through optical center (straight line)
  const imageTopYActual = imageTopY > 175 ? imageTopY : 175 - (imageTopY - 175);
  body += `<line x1="${objectX}" y1="${objectTopY}" x2="${imageX}" y2="${imageTopYActual}" stroke="#8b5cf6" stroke-width="1.5" stroke-dasharray="4,2"/>`;

  // Image (if real, inverted)
  if (imageDistance > 0) {
    body += `<line x1="${imageX}" y1="175" x2="${imageX}" y2="${imageTopYActual}" stroke="#ef4444" stroke-width="2.5"/>`;
    body += `<polygon points="${imageX},${imageTopYActual} ${imageX - 6},${imageTopYActual - 10} ${imageX + 6},${imageTopYActual - 10}" fill="#ef4444"/>`;
    body += `<text x="${imageX + 15}" y="${imageTopYActual - 10}" font-size="10" fill="#ef4444">Image</text>`;
  }

  return wrapSvg(body, W, H, "Convex Lens Ray Diagram");
}

builtinTemplates.push({
  id: "convex_lens_ray_diagram",
  name: "Convex Lens Ray Diagram",
  subject: "Science",
  gradeRange: [10, 10],
  visualType: "scientific_diagram",
  template: convexLensRayDiagramTemplate,
  defaultParams: { gradeLevel: 10, objectDistance: 150, focalLength: 80, style: "clean" },
});

// 10. Magnetic Field Lines — Class 6-8
function magneticFieldLinesTemplate(params: SvgTemplateParams): string {
  const W = 600, H = 400;
  const magnetType = params.magnetType || "bar";

  let body = "";
  body += `<rect x="0" y="0" width="${W}" height="${H}" fill="#f8fafc"/>`;

  // Bar magnet
  body += `<rect x="180" y="160" width="240" height="60" rx="8" fill="#ef4444" stroke="#b91c1c" stroke-width="2"/>`;
  body += `<rect x="180" y="160" width="120" height="60" rx="8" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2"/>`;
  body += `<text x="240" y="195" text-anchor="middle" font-size="18" font-weight="bold" fill="white">N</text>`;
  body += `<text x="360" y="195" text-anchor="middle" font-size="18" font-weight="bold" fill="white">S</text>`;

  // Field lines
  const fieldPaths = [
    "M220,120 C260,80 340,80 380,120",
    "M220,100 C260,40 340,40 380,100",
    "M220,80 C260,0 340,0 380,80",
    "M220,260 C260,300 340,300 380,260",
    "M220,280 C260,340 340,340 380,280",
    "M220,300 C260,380 340,380 380,300",
  ];
  for (const path of fieldPaths) {
    body += `<path d="${path}" fill="none" stroke="#64748b" stroke-width="1.5" stroke-dasharray="5,3"/>`;
  }
  // Arrowheads on field lines (pointing N to S outside)
  body += arrowHead(300, 80, 0, 6, "#64748b");
  body += arrowHead(300, 40, 0, 6, "#64748b");
  body += arrowHead(300, 320, 0, 6, "#64748b");
  body += arrowHead(300, 360, 0, 6, "#64748b");

  body += `<text x="300" y="30" text-anchor="middle" font-size="10" fill="#475569">Magnetic field lines</text>`;
  body += `<text x="300" y="390" text-anchor="middle" font-size="10" fill="#475569">North to South (outside)</text>`;

  return wrapSvg(body, W, H, "Magnetic Field Lines Around a Bar Magnet");
}

builtinTemplates.push({
  id: "magnetic_field_lines",
  name: "Magnetic Field Lines",
  subject: "Science",
  gradeRange: [6, 8],
  visualType: "scientific_diagram",
  template: magneticFieldLinesTemplate,
  defaultParams: { gradeLevel: 6, magnetType: "bar", style: "clean" },
});

// ───────────────────────────────────────────────
// TEMPLATE REGISTRY & ENGINE
// ───────────────────────────────────────────────

class SvgTemplateRegistry {
  private templates: Map<string, SvgTemplateRegistryEntry> = new Map();

  constructor() {
    for (const entry of builtinTemplates) {
      this.templates.set(entry.id, entry);
    }
  }

  register(entry: SvgTemplateRegistryEntry): void {
    this.templates.set(entry.id, entry);
  }

  get(id: string): SvgTemplateRegistryEntry | undefined {
    return this.templates.get(id);
  }

  findMatch(subject: string, gradeLevel: number, visualType: VisualType, topic?: string): SvgTemplateRegistryEntry | undefined {
    const normalizedTopic = (topic || "").toLowerCase().replace(/[^a-z0-9]/g, "_");
    const normalizedSubject = subject.toLowerCase();

    for (const entry of this.templates.values()) {
      const subjectMatch = entry.subject.toLowerCase() === normalizedSubject || normalizedSubject.includes(entry.subject.toLowerCase());
      const gradeMatch = gradeLevel >= entry.gradeRange[0] && gradeLevel <= entry.gradeRange[1];
      const typeMatch = entry.visualType === visualType;

      if (subjectMatch && gradeMatch && typeMatch) {
        // If topic is provided, prefer exact topic match
        if (normalizedTopic && entry.id.includes(normalizedTopic)) {
          return entry;
        }
        // Otherwise, return the first match (we'll refine later)
      }
    }

    // Second pass: topic keyword matching
    if (topic) {
      for (const entry of this.templates.values()) {
        const subjectMatch = entry.subject.toLowerCase() === normalizedSubject || normalizedSubject.includes(entry.subject.toLowerCase());
        const gradeMatch = gradeLevel >= entry.gradeRange[0] && gradeLevel <= entry.gradeRange[1];
        const typeMatch = entry.visualType === visualType;
        if (subjectMatch && gradeMatch && typeMatch) {
          return entry;
        }
      }
    }

    return undefined;
  }

  listAll(): SvgTemplateRegistryEntry[] {
    return Array.from(this.templates.values());
  }

  listForSubject(subject: string, gradeLevel?: number): SvgTemplateRegistryEntry[] {
    const normalizedSubject = subject.toLowerCase();
    return this.listAll().filter((t) => {
      const subjectMatch = t.subject.toLowerCase() === normalizedSubject || normalizedSubject.includes(t.subject.toLowerCase());
      if (gradeLevel != null) {
        return subjectMatch && gradeLevel >= t.gradeRange[0] && gradeLevel <= t.gradeRange[1];
      }
      return subjectMatch;
    });
  }
}

export const svgTemplateRegistry = new SvgTemplateRegistry();

export interface SvgGenerationResult {
  svgCode: string;
  width: number;
  height: number;
  templateId: string;
  templateName: string;
}

export async function generateSvgFromTemplate(
  templateId: string,
  params: SvgTemplateParams
): Promise<SvgGenerationResult | null> {
  const entry = svgTemplateRegistry.get(templateId);
  if (!entry) return null;

  const mergedParams = { ...entry.defaultParams, ...params };
  const svgCode = entry.template(mergedParams);

  // Extract width/height from SVG (simple parse)
  const widthMatch = svgCode.match(/width="(\d+)"/);
  const heightMatch = svgCode.match(/height="(\d+)"/);
  const width = widthMatch ? Number(widthMatch[1]) : 600;
  const height = heightMatch ? Number(heightMatch[1]) : 400;

  return {
    svgCode,
    width,
    height,
    templateId: entry.id,
    templateName: entry.name,
  };
}

export async function saveSvgToFile(svgCode: string, assetId: string): Promise<string> {
  await ensureAssetDir();
  const filePath = path.join(ASSET_DIR, `${assetId}.svg`);
  await fs.writeFile(filePath, svgCode, "utf8");
  return filePath;
}

export async function svgToPng(svgCode: string, outputPath: string, width?: number, height?: number): Promise<string> {
  // For now, return SVG path. In production, use CairoSVG or sharp
  // This is a placeholder that saves the SVG and returns its path
  await fs.writeFile(outputPath, svgCode, "utf8");
  return outputPath;
}

export function findTemplateForContent(
  subject: string,
  gradeLevel: number,
  visualType: VisualType,
  topic?: string
): { templateId: string; templateName: string; confidence: number } | null {
  const entry = svgTemplateRegistry.findMatch(subject, gradeLevel, visualType, topic);
  if (!entry) return null;

  // Calculate confidence based on topic match strength
  let confidence = 0.7; // base confidence for grade/subject match
  if (topic && entry.id.toLowerCase().includes(topic.toLowerCase().replace(/[^a-z0-9]/g, "_"))) {
    confidence = 0.95;
  } else if (topic && entry.name.toLowerCase().includes(topic.toLowerCase())) {
    confidence = 0.85;
  }

  return {
    templateId: entry.id,
    templateName: entry.name,
    confidence,
  };
}

export function getAllBuiltinTemplateIds(): string[] {
  return builtinTemplates.map((t) => t.id);
}

export { builtinTemplates };
