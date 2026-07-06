/**
 * LaTeX SVG Engine
 * Generates mathematical formulas as SVG
 */

export async function generateLatexSvg(request: {
  formula: string;
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
  const { formula, outputFormat = "svg", width = 400, height = 300 } = request;
  
  // Generate SVG representation of LaTeX formula
  const svgCode = generateLatexSvgContent(formula, width, height);
  
  return {
    imageUrl: `data:image/svg+xml;base64,${Buffer.from(svgCode).toString("base64")}`,
    svgCode,
    mimeType: "image/svg+xml",
    width,
    height,
  };
}

function generateLatexSvgContent(formula: string, width: number, height: number): string {
  // Simple LaTeX to SVG conversion (would use MathJax or similar in production)
  const normalizedFormula = formula
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '$1/$2')
    .replace(/\\sqrt\{([^}]*)\}/g, '√($1)')
    .replace(/\\superscript\{([^}]*)\}/g, '^$1')
    .replace(/\\subscript\{([^}]*)\}/g, '_$1')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\pi/g, 'π')
    .replace(/\\infty/g, '∞')
    .replace(/\\int/g, '∫')
    .replace(/\\sum/g, '∑')
    .replace(/\\approx/g, '≈')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥');
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="white"/>
    <text x="${width/2}" y="${height/2}" text-anchor="middle" font-family="serif" font-size="24" fill="#333">
      ${normalizedFormula}
    </text>
  </svg>`;
}