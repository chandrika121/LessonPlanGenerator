/**
 * Geometry Diagram Engine
 * Generates geometric diagrams and shapes
 */

export async function generateGeometryDiagram(request: {
  type: string;
  template?: string;
  params: {
    points?: { x: number; y: number; label?: string }[];
    lines?: { p1: [number, number]; p2: [number, number]; label?: string }[];
    arcs?: { center: [number, number]; radius: number; startAngle: number; endAngle: number; label?: string }[];
    labels?: string[];
  };
  outputFormat?: "png" | "svg";
  width?: number;
  height?: number;
}): Promise<{
  imageUrl: string;
  svgCode?: string;
  mimeType: string;
  width: number;
  height: number;
}> {
  const { type, params, outputFormat = "png", width = 800, height = 600 } = request;
  const { points = [], lines = [], arcs = [], labels = [] } = params;
  
  let svgContent = "";
  
  switch (type) {
    case "triangle":
      svgContent = generateTriangle(points, labels, width, height);
      break;
    case "circle":
      svgContent = generateCircle(points, labels, width, height);
      break;
    case "quadrilateral":
      svgContent = generateQuadrilateral(points, labels, width, height);
      break;
    case "angle":
      svgContent = generateAngle(points, labels, width, height);
      break;
    default:
      svgContent = generateGenericGeometry(points, lines, arcs, labels, width, height);
  }
  
  const mimeType = outputFormat === "png" ? "image/png" : "image/svg+xml";
  
  return {
    imageUrl: `data:image/svg+xml;base64,${Buffer.from(svgContent).toString("base64")}`,
    svgCode: svgContent,
    mimeType,
    width,
    height,
  };
}

function generateTriangle(points: any[], labels: string[], width: number, height: number): string {
  if (points.length < 3) return "";
  
  const [p1, p2, p3] = points;
  const centerX = width / 2;
  const centerY = height / 2;
  const scale = Math.min(width, height) / 4;
  
  const x1 = centerX + (p1.x || 0) * scale;
  const y1 = centerY - (p1.y || 0) * scale;
  const x2 = centerX + (p2.x || 1) * scale;
  const y2 = centerY - (p2.y || 0) * scale;
  const x3 = centerX + (p3.x || 0.5) * scale;
  const y3 = centerY - (p3.y || 1) * scale;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="white"/>
    <polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3}" fill="lightblue" stroke="black" stroke-width="2"/>
    ${labels.map((label, i) => {
      const pts = [p1, p2, p3][i];
      return `<text x="${centerX + (pts.x || 0) * scale}" y="${centerY - (pts.y || 0) * scale - 10}" text-anchor="middle" font-family="Arial" font-size="12">${label}</text>`;
    }).join("")}
  </svg>`;
}

function generateCircle(points: any[], labels: string[], width: number, height: number): string {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 4;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="white"/>
    <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="lightgreen" stroke="black" stroke-width="2"/>
    ${labels.map((label, i) => {
      const angle = (i * 2 * Math.PI) / (labels.length || 1);
      const x = centerX + (radius + 20) * Math.cos(angle);
      const y = centerY + (radius + 20) * Math.sin(angle);
      return `<text x="${x}" y="${y}" text-anchor="middle" font-family="Arial" font-size="12">${label}</text>`;
    }).join("")}
  </svg>`;
}

function generateQuadrilateral(points: any[], labels: string[], width: number, height: number): string {
  if (points.length < 4) return "";
  
  const centerX = width / 2;
  const centerY = height / 2;
  const scale = Math.min(width, height) / 4;
  
  const coords = points.map((p: any) => {
    return `${centerX + (p.x || 0) * scale},${centerY - (p.y || 0) * scale}`;
  }).join(" ");
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="white"/>
    <polygon points="${coords}" fill="lightyellow" stroke="black" stroke-width="2"/>
    ${labels.map((label, i) => {
      const p = points[i];
      return `<text x="${centerX + (p.x || 0) * scale}" y="${centerY - (p.y || 0) * scale - 10}" text-anchor="middle" font-family="Arial" font-size="12">${label}</text>`;
    }).join("")}
  </svg>`;
}

function generateAngle(points: any[], labels: string[], width: number, height: number): string {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 4;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="white"/>
    <text x="${centerX}" y="${centerY - radius - 20}" text-anchor="middle" font-family="Arial" font-size="14">Angle</text>
  </svg>`;
}

function generateGenericGeometry(points: any[], lines: any[], arcs: any[], labels: string[], width: number, height: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="white"/>
    <text x="${width/2}" y="${height/2}" text-anchor="middle" font-family="Arial" font-size="14">Geometry Diagram</text>
  </svg>`;
}