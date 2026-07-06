/**
 * Mermaid Flowchart Engine
 * Generates diagrams using Mermaid.js syntax with fallback SVG generation
 */

import type { MermaidRequest } from "../../../src/types-visual.js";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function generateMermaidDiagram(request: MermaidRequest): Promise<{
  imageUrl: string;
  svgCode?: string;
  mimeType: string;
  width: number;
  height: number;
}> {
  const { diagramType, sourceCode, theme = "default", outputFormat = "png", width = 800, height = 600 } = request;

  // Create a temporary directory for output
  const tempDir = path.join(__dirname, `temp_${Date.now()}`);
  await fs.promises.mkdir(tempDir, { recursive: true });

  try {
    // Write Mermaid source to file
    const mermaidFile = path.join(tempDir, "diagram.mmd");
    await fs.promises.writeFile(mermaidFile, sourceCode);

    // Generate diagram using mermaid-cli if available, otherwise use fallback
    const outputFile = path.join(tempDir, `diagram.${outputFormat === "png" ? "png" : "svg"}`);
    
    try {
      await execFileAsync("mmdc", [
        "--input", mermaidFile,
        "--output", outputFile,
        "--theme", theme,
        "--width", width.toString(),
        "--height", height.toString(),
      ], { timeout: 30000 });
    } catch (error) {
      // Fallback: generate a simple SVG representation
      const svgCode = generateSimpleMermaidSvg(sourceCode, diagramType, width, height);
      const imageUrl = `data:image/svg+xml;base64,${Buffer.from(svgCode).toString("base64")}`;
      
      return {
        imageUrl,
        svgCode,
        mimeType: "image/svg+xml",
        width,
        height,
      };
    }

    // Read the generated file
    const buffer = await fs.promises.readFile(outputFile);
    const imageUrl = `data:${outputFormat === "png" ? "image/png" : "image/svg+xml"};base64,${buffer.toString("base64")}`;
    const mimeType = outputFormat === "png" ? "image/png" : "image/svg+xml";

    return {
      imageUrl,
      mimeType,
      width,
      height,
    };
  } catch (error) {
    console.error("[MermaidEngine] Error generating diagram:", error);
    // Fallback to simple SVG generation
    const svgCode = generateSimpleMermaidSvg(sourceCode, diagramType, width, height);
    const imageUrl = `data:image/svg+xml;base64,${Buffer.from(svgCode).toString("base64")}`;
    
    return {
      imageUrl,
      svgCode,
      mimeType: "image/svg+xml",
      width,
      height,
    };
  } finally {
    // Clean up temp directory
    await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

function generateSimpleMermaidSvg(sourceCode: string, diagramType: string, width: number, height: number): string {
  // Parse basic mermaid syntax and generate simple SVG
  const lines = sourceCode.split('\n');
  let content = '';
  
  switch (diagramType) {
    case "flowchart":
      content = generateFlowchartSvg(lines, width, height);
      break;
    case "sequence":
      content = generateSequenceSvg(lines, width, height);
      break;
    case "gantt":
      content = generateGanttSvg(lines, width, height);
      break;
    case "mindmap":
      content = generateMindmapSvg(lines, width, height);
      break;
    case "stateDiagram":
      content = generateStateDiagramSvg(lines, width, height);
      break;
    default:
      content = generateGenericMermaidSvg(lines, width, height);
  }
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="white"/>
  <g transform="translate(20, 20)">
    ${content}
  </g>
</svg>`;
}

function generateFlowchartSvg(lines: string[], width: number, height: number): string {
  let svg = '';
  let y = 20;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('%%')) continue;
    
    if (trimmed.includes('-->')) {
      // Draw arrow
      const parts = trimmed.split('-->');
      const from = parts[0].trim();
      const to = parts[1].trim();
      
      svg += `<text x="20" y="${y}" font-family="Arial" font-size="12">${from}</text>`;
      svg += `<line x1="120" y1="${y - 5}" x2="180" y2="${y - 5}" stroke="black" stroke-width="1"/>`;
      svg += `<text x="200" y="${y}" font-family="Arial" font-size="12">${to}</text>`;
      y += 30;
    } else if (trimmed.includes('[') && trimmed.includes(']')) {
      // Node definition
      const nodeMatch = trimmed.match(/([A-Z])\[(.*)\]/);
      if (nodeMatch) {
        const label = nodeMatch[2];
        svg += `<rect x="100" y="${y - 10}" width="80" height="20" rx="3" fill="lightblue" stroke="black" stroke-width="1"/><text x="140" y="${y}" font-family="Arial" font-size="12" text-anchor="middle">${label}</text>`;
        y += 40;
      }
    }
  }
  
  return svg;
}

function generateSequenceSvg(lines: string[], width: number, height: number): string {
  let svg = '';
  let y = 20;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('%%')) continue;
    
    if (trimmed.includes(' participant')) {
      const participants = trimmed.split(' participant')[1];
      svg += `<text x="20" y="${y}" font-family="Arial" font-size="12" font-weight="bold">${participants}</text>`;
      y += 25;
    } else if (trimmed.includes('->')) {
      const parts = trimmed.split('->');
      const from = parts[0].trim();
      const to = parts[1].trim();
      
      svg += `<line x1="60" y1="${y - 10}" x2="120" y2="${y - 10}" stroke="black" stroke-width="2"/><text x="130" y="${y - 5}" font-family="Arial" font-size="10">${from}</text>`;
      svg += `<line x1="140" y1="${y - 10}" x2="200" y2="${y - 10}" stroke="black" stroke-width="2"/><text x="220" y="${y}" font-family="Arial" font-size="10">${to}</text>`;
      y += 30;
    }
  }
  
  return svg;
}

function generateGanttSvg(lines: string[], width: number, height: number): string {
  let svg = '';
  let y = 20;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('%%') || trimmed.startsWith('title')) continue;
    
    if (trimmed.includes('[')) {
      const taskMatch = trimmed.match(/([a-zA-Z0-9_]+)\s*\[(\d+)-(\d+)\]/);
      if (taskMatch) {
        const task = taskMatch[1];
        const start = parseInt(taskMatch[2]);
        const end = parseInt(taskMatch[3]);
        
        const x = 20 + start * 30;
        const taskWidth = (end - start) * 30;
        
        svg += `<rect x="${x}" y="${y}" width="${taskWidth}" height="20" fill="lightgreen" stroke="black" stroke-width="1"/><text x="${x + taskWidth/2}" y="${y + 15}" font-family="Arial" font-size="11" text-anchor="middle">${task}</text>`;
      }
    }
  }
  
  return svg;
}

function generateMindmapSvg(lines: string[], width: number, height: number): string {
  let svg = '';
  let y = 20;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('%%')) continue;
    
    if (trimmed.includes('root')) {
      const rootMatch = trimmed.match(/root\((.*)\)/);
      if (rootMatch) {
        svg += `<text x="${width/2}" y="${y}" font-family="Arial" font-size="16" font-weight="bold" text-anchor="middle">${rootMatch[1]}</text>`;
        y += 40;
      }
    } else if (trimmed.includes('->')) {
      const parts = trimmed.split('->');
      const parent = parts[0].trim();
      const child = parts[1].trim();
      
      svg += `<line x1="50" y1="${y - 20}" x2="150" y2="${y - 20}" stroke="black" stroke-width="2"/><text x="60" y="${y}" font-family="Arial" font-size="12">${parent}</text><text x="160" y="${y}" font-family="Arial" font-size="12">${child}</text>`;
      y += 30;
    }
  }
  
  return svg;
}

function generateStateDiagramSvg(lines: string[], width: number, height: number): string {
  let svg = '';
  let y = 20;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('%%') || trimmed.startsWith('state')) continue;
    
    if (trimmed.includes('-->')) {
      const parts = trimmed.split('-->');
      const from = parts[0].trim();
      const to = parts[1].trim();
      
      svg += `<rect x="50" y="${y - 15}" width="80" height="30" rx="5" fill="lightcoral" stroke="black" stroke-width="1"/><text x="90" y="${y}" font-family="Arial" font-size="12" text-anchor="middle">${from}</text>`;
      svg += `<line x1="130" y1="${y + 15}" x2="210" y2="${y + 15}" stroke="black" stroke-width="2"/><text x="220" y="${y}" font-family="Arial" font-size="12">${to}</text>`;
      y += 50;
    }
  }
  
  return svg;
}

function generateGenericMermaidSvg(lines: string[], width: number, height: number): string {
  return `<rect x="0" y="0" width="${width}" height="${height}" fill="#f0f0f0" stroke="#ccc" stroke-width="2"/><text x="${width/2}" y="${height/2}" font-family="Arial" font-size="16" text-anchor="middle" dominant-baseline="middle">Mermaid Diagram: ${lines[0] || 'Diagram'}</text>`;
}