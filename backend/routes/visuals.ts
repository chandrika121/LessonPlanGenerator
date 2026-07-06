import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { imageOrchestratorService } from "../services/visual/image-orchestrator.js";
import { svgTemplateRegistry } from "../services/visual/svg-template-engine.js";
import type { VisualAnalyzeRequest, VisualGenerationRequest } from "../../src/types-visual.js";

const router = Router();

// POST /api/visuals/analyze - Analyze content and determine visual requirements
router.post("/analyze", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request: VisualAnalyzeRequest = req.body;
    if (!request.sessionId || !request.slides || !Array.isArray(request.slides)) {
      return res.status(400).json({ error: "Missing required fields: sessionId, slides" });
    }
    const result = await imageOrchestratorService.analyzeContent(request);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/visuals/generate - Generate a single visual asset
router.post("/generate", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request: VisualGenerationRequest = req.body;
    if (!request.sessionId || !request.slideId) {
      return res.status(400).json({ error: "Missing required fields: sessionId, slideId" });
    }
    const asset = await imageOrchestratorService.generateVisual(request);
    res.json(asset);
  } catch (error: any) {
    if (error.message?.includes("Template") && error.message?.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
});

// POST /api/visuals/generate-batch - Batch generate visuals for a session
router.post("/generate-batch", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = req.body;
    if (!request.sessionId || !request.analyses || !Array.isArray(request.analyses)) {
      return res.status(400).json({ error: "Missing required fields: sessionId, analyses" });
    }
    const batch = await imageOrchestratorService.generateBatch(request);
    res.json(batch);
  } catch (error) {
    next(error);
  }
});

// POST /api/visuals/validate - Validate a generated visual
router.post("/validate", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = req.body;
    if (!request.assetId) {
      return res.status(400).json({ error: "Missing required field: assetId" });
    }
    const asset = await imageOrchestratorService.getAsset(request.assetId);
    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }
    const { validateImage } = await import("../services/visual/validation-service.js");
    const result = await validateImage(asset);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/visuals/assets/:assetId - Get a specific visual asset
router.get("/assets/:assetId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const asset = await imageOrchestratorService.getAsset(req.params.assetId);
    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }
    res.json(asset);
  } catch (error) {
    next(error);
  }
});

// POST /api/visuals/regenerate - Regenerate a specific visual
router.post("/regenerate", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = req.body;
    if (!request.assetId) {
      return res.status(400).json({ error: "Missing required field: assetId" });
    }
    const asset = await imageOrchestratorService.regenerateVisual(
      request.assetId,
      request.reason || "Regeneration requested",
      request.preferredGenerator
    );
    res.json(asset);
  } catch (error) {
    next(error);
  }
});

// GET /api/visuals/templates - List all available SVG templates
router.get("/templates", (_req: Request, res: Response) => {
  const templates = svgTemplateRegistry.listAll().map((t) => ({
    id: t.id,
    name: t.name,
    subject: t.subject,
    gradeRange: t.gradeRange,
    visualType: t.visualType,
  }));
  res.json({ templates });
});

export default router;