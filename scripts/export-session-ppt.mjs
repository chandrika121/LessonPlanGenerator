import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const ROOT = process.env.REPO_ROOT || process.cwd();
const INPUT_JSON = path.join(
  ROOT,
  "backend/debug-output/generate-content-session-1782459097845-30f2w1/final-response.json",
);
const OUTPUT_DIR = path.join(ROOT, "outputs");
const OUTPUT_PPTX = path.join(OUTPUT_DIR, "session-2-cell-structure-organelles.pptx");

const SLIDE_W = 1280;
const SLIDE_H = 720;

async function loadSession() {
  const raw = await fs.readFile(INPUT_JSON, "utf8");
  return JSON.parse(raw);
}

function addTextBox(slide, { left, top, width, height, text, fontSize = 20, bold = false, color = "slate-900" }) {
  const box = slide.shapes.add({
    geometry: "textbox",
    position: { left, top, width, height },
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  box.text = text;
  box.text.style = { fontSize, bold, color };
  return box;
}

function addBulletList(slide, items, top) {
  const box = slide.shapes.add({
    geometry: "textbox",
    position: { left: 90, top, width: 1100, height: 420 },
    fill: "white",
    line: { style: "solid", fill: "slate-200", width: 1 },
    borderRadius: "rounded-2xl",
    shadow: "shadow-sm",
  });
  box.text = items.map((item) => `• ${item}`).join("\n");
  box.text.style = { fontSize: 22, color: "slate-800" };
  return box;
}

async function addSlideImage(slide, assetUrl, altText) {
  if (!assetUrl) return;
  try {
    const res = await fetch(assetUrl);
    if (!res.ok) return;
    const bytes = new Uint8Array(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") || "image/jpeg";
    slide.images.add({
      blob: bytes,
      contentType,
      alt: altText || "Session visual",
      fit: "cover",
      geometry: "roundRect",
      borderRadius: "rounded-2xl",
      position: { left: 760, top: 190, width: 430, height: 360 },
    });
  } catch (error) {
    console.warn(`Unable to load image asset ${assetUrl}:`, error);
  }
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const session = await loadSession();
  const slides = session?.materials?.ppt?.slides || [];

  const presentation = Presentation.create({
    slideSize: { width: SLIDE_W, height: SLIDE_H },
  });

  for (const [index, slideData] of slides.entries()) {
    const slide = presentation.slides.add();
    slide.background.fill = index % 2 === 0 ? "slate-50" : "white";

    addTextBox(slide, {
      left: 90,
      top: 48,
      width: 1000,
      height: 48,
      text: session?.materials?.ppt?.title || session?.title || "Session PPT",
      fontSize: 18,
      bold: true,
      color: "teal-600",
    });

    addTextBox(slide, {
      left: 90,
      top: 105,
      width: 1000,
      height: 78,
      text: slideData.slideTitle || `Slide ${index + 1}`,
      fontSize: 34,
      bold: true,
      color: "slate-950",
    });

    addBulletList(
      slide,
      Array.isArray(slideData.bulletPoints) ? slideData.bulletPoints : ["Key teaching point"],
      190,
    );

    const primaryAsset = Array.isArray(slideData.assets) ? slideData.assets[0] : null;
    const visualUrl = primaryAsset?.previewUrl || primaryAsset?.sourceUrl || "";
    await addSlideImage(slide, visualUrl, primaryAsset?.altText || slideData.slideTitle);

    addTextBox(slide, {
      left: 90,
      top: 635,
      width: 300,
      height: 28,
      text: `Session ${session?.sessionNumber || ""} • Slide ${index + 1}`,
      fontSize: 14,
      bold: true,
      color: "slate-500",
    });
  }

  const pptx = await PresentationFile.exportPptx(presentation);
  await pptx.save(OUTPUT_PPTX);
  console.log(OUTPUT_PPTX);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
