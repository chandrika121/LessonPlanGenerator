/**
 * Wikimedia Commons Engine
 * Searches and retrieves educational images from Wikimedia Commons
 */

import type { WikimediaRequest, WikimediaAsset } from "../../../src/types-visual.js";

export async function searchWikimediaCommons(request: WikimediaRequest): Promise<WikimediaAsset[]> {
  const { searchQuery, category, minResolution = 500, licenseFilter = "cc-by", maxResults = 5, gradeLevel } = request;
  
  // Wikimedia Commons API endpoint
  const baseUrl = "https://commons.wikimedia.org/w/api.php";
  
  // Build search query
  const searchParams = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: `${searchQuery} education ${gradeLevel ? `grade ${gradeLevel}` : ""} school`,
    srnamespace: "6", // File namespace
    srlimit: maxResults.toString(),
    format: "json",
  });
  
  try {
    const response = await fetch(`${baseUrl}?${searchParams}`);
    const data = await response.json();
    
    if (!data.query?.search) {
      return [];
    }
    
    const assets: WikimediaAsset[] = [];
    
    for (const result of data.query.search.slice(0, maxResults)) {
      // Get image info
      const infoParams = new URLSearchParams({
        action: "query",
        prop: "imageinfo",
        titles: result.title,
        iiprop: "url|thumbRatio|width|height|license|attribution",
        format: "json",
      });
      
      const infoResponse = await fetch(`${baseUrl}?${infoParams}`);
      const infoData = await infoResponse.json();
      
      const pages = infoData.query?.pages || {};
      const pageId = Object.keys(pages)[0];
      const pageData = pages[pageId];
      
      if (pageData?.imageinfo?.length > 0) {
        const imageInfo = pageData.imageinfo[0];
        
        // Check minimum resolution
        if (imageInfo.width >= minResolution && imageInfo.height >= minResolution) {
          // Check license
          const license = imageInfo.license || "";
          if (licenseFilter === "any_open" || license.includes(licenseFilter.replace("cc-by", "CC-BY"))) {
            assets.push({
              title: result.title,
              pageUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(result.title)}`,
              imageUrl: imageInfo.url,
              thumbUrl: imageInfo.thumburl || imageInfo.url,
              width: imageInfo.width,
              height: imageInfo.height,
              license: license,
              attributionText: imageInfo.attribution || result.title,
              source: "wikimedia",
              confidence: 0.8,
            });
          }
        }
      }
    }
    
    return assets;
  } catch (error) {
    console.error("[WikimediaEngine] Error searching Wikimedia:", error);
    return [];
  }
}

/**
 * Generate a placeholder Wikimedia-style image
 */
export function generateWikimediaPlaceholder(query: string, width: number = 400, height: number = 300): WikimediaAsset {
  const svgCode = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="#e0e0e0" stroke="#ccc" stroke-width="2"/>
    <text x="${width/2}" y="${height/2}" text-anchor="middle" font-family="Arial" font-size="14" fill="#666">
      Wikimedia Image: ${query}
    </text>
    <text x="${width/2}" y="${height/2 + 20}" text-anchor="middle" font-family="Arial" font-size="12" fill="#999">
      (Placeholder - would show actual image from Wikimedia Commons)
    </text>
  </svg>`;
  
  return {
    title: query,
    pageUrl: `https://commons.wikimedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`,
    imageUrl: `data:image/svg+xml;base64,${Buffer.from(svgCode).toString("base64")}`,
    thumbUrl: `data:image/svg+xml;base64,${Buffer.from(svgCode).toString("base64")}`,
    width,
    height,
    license: "CC-BY-SA",
    attributionText: query,
    source: "wikimedia",
    confidence: 0.5,
  };
}