/**
 * Math Graph Engine
 * Generates mathematical graphs and charts using Canvas/SVG
 */

import type { MathGraphRequest } from "../../../src/types-visual.js";

export async function generateMathGraph(request: MathGraphRequest): Promise<{
  imageUrl: string;
  svgCode?: string;
  mimeType: string;
  width: number;
  height: number;
}> {
  const { type, params, outputFormat = "png", width = 800, height = 600 } = request;
  const margin = 60;
  
  // Generate SVG for the graph
  let svgContent = "";
  
  switch (type) {
    case "coordinate_plot":
      svgContent = generateCoordinatePlot(params, width, height, margin);
      break;
    case "bar_chart":
      svgContent = generateBarChart(params, width, height, margin);
      break;
    case "number_line":
      svgContent = generateNumberLine(params, width, height, margin);
      break;
    case "function_plot":
      svgContent = generateFunctionPlot(params, width, height, margin);
      break;
    case "scatter_plot":
      svgContent = generateScatterPlot(params, width, height, margin);
      break;
    case "histogram":
      svgContent = generateHistogram(params, width, height, margin);
      break;
    default:
      svgContent = generateCoordinatePlot(params, width, height, margin);
  }
  
  const mimeType = outputFormat === "png" ? "image/png" : "image/svg+xml";
  
  if (outputFormat === "svg") {
    return {
      imageUrl: `data:image/svg+xml;base64,${Buffer.from(svgContent).toString("base64")}`,
      svgCode: svgContent,
      mimeType,
      width,
      height,
    };
  }
  
  // For PNG, we return SVG as fallback (would need canvas for actual PNG)
  return {
    imageUrl: `data:image/svg+xml;base64,${Buffer.from(svgContent).toString("base64")}`,
    svgCode: svgContent,
    mimeType: "image/svg+xml",
    width,
    height,
  };
}

function generateCoordinatePlot(params: any, width: number, height: number, margin: number): string {
  const { xRange = [-10, 10], yRange = [-10, 10], title, xLabel, yLabel, grid = true } = params;
  const [xMin, xMax] = xRange;
  const [yMin, yMax] = yRange;
  
  const plotWidth = width - 2 * margin;
  const plotHeight = height - 2 * margin;
  
  const scaleX = plotWidth / (xMax - xMin);
  const scaleY = plotHeight / (yMax - yMin);
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="white"/>
    <text x="${width/2}" y="30" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold">${title || "Coordinate Plot"}</text>
    <text x="${width/2}" y="${height - 20}" text-anchor="middle" font-family="Arial" font-size="12">${xLabel || "X"}</text>
    <text x="20" y="${height/2}" text-anchor="middle" font-family="Arial" font-size="12" transform="rotate(-90, 20, ${height/2})">${yLabel || "Y"}</text>
    <rect x="${margin}" y="${margin}" width="${plotWidth}" height="${plotHeight}" fill="#f8f8f8" stroke="black" stroke-width="1"/>`;
  
  if (grid) {
    // Draw grid lines
    for (let x = xMin; x <= xMax; x++) {
      const px = margin + (x - xMin) * scaleX;
      svg += `<line x1="${px}" y1="${margin}" x2="${px}" y2="${height - margin}" stroke="#e0e0e0" stroke-width="1"/>`;
    }
    for (let y = yMin; y <= yMax; y++) {
      const py = height - margin - (y - yMin) * scaleY;
      svg += `<line x1="${margin}" y1="${py}" x2="${width - margin}" y2="${py}" stroke="#e0e0e0" stroke-width="1"/>`;
    }
  }
  
  // Draw axes
  svg += `<line x1="${margin}" y1="${height - margin}" x2="${width - margin}" y2="${height - margin}" stroke="black" stroke-width="2"/>`;
  svg += `<line x1="${margin}" y1="${margin}" x2="${margin}" y2="${height - margin}" stroke="black" stroke-width="2"/>`;
  
  // Draw tick marks and labels
  for (let x = xMin; x <= xMax; x++) {
    const px = margin + (x - xMin) * scaleX;
    svg += `<line x1="${px}" y1="${height - margin}" x2="${px}" y2="${height - margin + 5}" stroke="black" stroke-width="1"/>`;
    svg += `<text x="${px}" y="${height - margin + 20}" text-anchor="middle" font-family="Arial" font-size="10">${x}</text>`;
  }
  for (let y = yMin; y <= yMax; y++) {
    const py = height - margin - (y - yMin) * scaleY;
    svg += `<line x1="${margin - 5}" y1="${py}" x2="${margin}" y2="${py}" stroke="black" stroke-width="1"/>`;
    svg += `<text x="${margin - 10}" y="${py + 4}" text-anchor="end" font-family="Arial" font-size="10">${y}</text>`;
  }
  
  svg += "</svg>";
  return svg;
}

function generateBarChart(params: any, width: number, height: number, margin: number): string {
  const { bars = [], title, xLabel, yLabel } = params;
  const chartWidth = width - 2 * margin;
  const chartHeight = height - 2 * margin;
  const barWidth = chartWidth / (bars.length + 1);
  const maxValue = Math.max(...bars.map((b: any) => b.value), 1);
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="white"/>
    <text x="${width/2}" y="30" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold">${title || "Bar Chart"}</text>
    <rect x="${margin}" y="${margin}" width="${chartWidth}" height="${chartHeight}" fill="#f8f8f8" stroke="black" stroke-width="1"/>`;
  
  bars.forEach((bar: any, i: number) => {
    const x = margin + (i + 1) * barWidth;
    const barHeight = (bar.value / maxValue) * chartHeight;
    const color = bar.color || "steelblue";
    
    svg += `<rect x="${x}" y="${height - margin - barHeight}" width="${barWidth * 0.6}" height="${barHeight}" fill="${color}"/>`;
    svg += `<text x="${x + barWidth * 0.3}" y="${height - margin + 20}" text-anchor="middle" font-family="Arial" font-size="10">${bar.label}</text>`;
  });
  
  svg += "</svg>";
  return svg;
}

function generateNumberLine(params: any, width: number, height: number, margin: number): string {
  const { points = [], title } = params;
  const lineY = height / 2;
  const scale = 40;
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="white"/>
    <text x="${width/2}" y="30" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold">${title || "Number Line"}</text>
    <line x1="${margin}" y1="${lineY}" x2="${width - margin}" y2="${lineY}" stroke="black" stroke-width="2"/>`;
  
  // Draw tick marks
  for (let x = margin; x <= width - margin; x += scale) {
    svg += `<line x1="${x}" y1="${lineY - 5}" x2="${x}" y2="${lineY + 5}" stroke="black" stroke-width="1"/>`;
  }
  
  // Draw points
  points.forEach((point: any) => {
    const x = margin + point.x * scale;
    svg += `<circle cx="${x}" cy="${lineY}" r="5" fill="red"/>`;
    svg += `<text x="${x}" y="${lineY + 20}" text-anchor="middle" font-family="Arial" font-size="10">${point.label || point.x}</text>`;
  });
  
  svg += "</svg>";
  return svg;
}

function generateFunctionPlot(params: any, width: number, height: number, margin: number): string {
  const { function: func, xRange = [-5, 5], title } = params;
  const plotWidth = width - 2 * margin;
  const plotHeight = height - 2 * margin;
  const [xMin, xMax] = xRange;
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="white"/>
    <text x="${width/2}" y="30" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold">${title || "Function Plot"}</text>
    <rect x="${margin}" y="${margin}" width="${plotWidth}" height="${plotHeight}" fill="#f8f8f8" stroke="black" stroke-width="1"/>`;
  
  // Draw axes
  svg += `<line x1="${margin}" y1="${height - margin}" x2="${width - margin}" y2="${height - margin}" stroke="black" stroke-width="2"/>`;
  svg += `<line x1="${margin}" y1="${margin}" x2="${margin}" y2="${height - margin}" stroke="black" stroke-width="2"/>`;
  
  // Generate function points (simple implementation)
  const points: { x: number; y: number }[] = [];
  for (let x = xMin; x <= xMax; x += 0.1) {
    let y = 0;
    try {
      // Simple function evaluation
      if (func === "x^2") y = x * x;
      else if (func === "sin(x)") y = Math.sin(x);
      else if (func === "cos(x)") y = Math.cos(x);
      else if (func === "x^3") y = x * x * x;
      else y = x;
    } catch {
      y = 0;
    }
    points.push({ x, y });
  }
  
  // Draw the function curve
  if (points.length > 0) {
    const pathData = points.map((p, i) => {
      const px = margin + ((p.x - xMin) / (xMax - xMin)) * plotWidth;
      const py = height - margin - ((p.y + 5) / 10) * plotHeight;
      return `${i === 0 ? 'M' : 'L'} ${px} ${py}`;
    }).join(' ');
    
    svg += `<path d="${pathData}" stroke="blue" stroke-width="2" fill="none"/>`;
  }
  
  svg += "</svg>";
  return svg;
}

function generateScatterPlot(params: any, width: number, height: number, margin: number): string {
  const { points = [], title } = params;
  const plotWidth = width - 2 * margin;
  const plotHeight = height - 2 * margin;
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="white"/>
    <text x="${width/2}" y="30" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold">${title || "Scatter Plot"}</text>
    <rect x="${margin}" y="${margin}" width="${plotWidth}" height="${plotHeight}" fill="#f8f8f8" stroke="black" stroke-width="1"/>`;
  
  points.forEach((point: any) => {
    const px = margin + (point.x / 10) * plotWidth;
    const py = height - margin - (point.y / 10) * plotHeight;
    svg += `<circle cx="${px}" cy="${py}" r="5" fill="blue"/>`;
  });
  
  svg += "</svg>";
  return svg;
}

function generateHistogram(params: any, width: number, height: number, margin: number): string {
  const { bins = [], title } = params;
  const chartWidth = width - 2 * margin;
  const chartHeight = height - 2 * margin;
  const barWidth = chartWidth / (bins.length + 1);
  const maxValue = Math.max(...bins.map((b: number) => b), 1);
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="white"/>
    <text x="${width/2}" y="30" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold">${title || "Histogram"}</text>
    <rect x="${margin}" y="${margin}" width="${chartWidth}" height="${chartHeight}" fill="#f8f8f8" stroke="black" stroke-width="1"/>`;
  
  bins.forEach((bin: number, i: number) => {
    const x = margin + (i + 1) * barWidth;
    const barHeight = (bin / maxValue) * chartHeight;
    svg += `<rect x="${x}" y="${height - margin - barHeight}" width="${barWidth * 0.8}" height="${barHeight}" fill="steelblue"/>`;
  });
  
  svg += "</svg>";
  return svg;
}