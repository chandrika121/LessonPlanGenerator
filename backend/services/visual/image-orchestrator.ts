/**
 * Image Orchestrator Service
 * Main service for coordinating visual generation across all artifact types
 * Integrates with the existing 5-phase Lesson Plan Generator
 */

import type { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import type {
  VisualAnalyzeRequest,
  VisualAnalyzeResponse,
  VisualGenerationRequest,
  VisualGenerationBatch,
  GeneratedVisualAsset,
  SlideContentAnalysis,
  VisualType,
  GeneratorType,
  VisualValidationRequest,
  VisualValidationResult,
} from "../../../src/types-visual.js";
import { determineGenerator, detectVisualTypeFromContent } from "./decision-engine.js";
import { generateSvgFromTemplate, findTemplateForContent } from "./svg-template-engine.js";
import { generateMathGraph } from "./math-graph-engine.js";
import { generateGeometryDiagram } from "./geometry-engine.js";
import { generateMermaidDiagram } from "./mermaid-engine.js";
import { searchWikimediaCommons } from "./wikimedia-engine.js";
import { generateAiImage } from "./ai-image-engine.js";
import { generateLatexSvg } from "./latex-svg-engine.js";
import { validateImage } from "./validation-service.js";
import { storeAsset, getAsset } from "./asset-store.js";

export class ImageOrchestratorService {
  private debugOutputDir: string;

  constructor() {
    this.debugOutputDir = "/tmp/visual-generation-debug";
  }

  /**
   * Analyze content and determine visual requirements for slides
   */
  async analyzeContent(request: VisualAnalyzeRequest): Promise<VisualAnalyzeResponse> {
    try {
      const { sessionId, slides, subject, gradeLevel, topic, subtopic } = request;

      console.log(`[ImageOrchestrator] Analyzing content for session ${sessionId}`);

      // Analyze each slide for visual requirements
      const analyses: SlideContentAnalysis[] = [];

      for (const slide of slides) {
        // Use the decision engine to detect visual type from content
        const detection = detectVisualTypeFromContent(
          slide.slideTitle,
          slide.content,
          subject,
          parseInt(gradeLevel)
        );

        const analysis: SlideContentAnalysis = {
          slideId: slide.slideId,
          slideTitle: slide.slideTitle,
          subject,
          gradeLevel: parseInt(gradeLevel),
          topic,
          subtopic,
          imageNeed: detection.visualType,
          confidence: detection.confidence,
          suggestedGenerator: detection.suggestedGenerator,
          description: this.generateVisualDescription(slide, detection),
          mustInclude: this.extractMustInclude(slide),
          avoid: this.extractAvoid(slide),
        };

        // Try to find a matching SVG template
        if (detection.visualType !== "none") {
          const templateMatch = findTemplateForContent(
            subject,
            parseInt(gradeLevel),
            detection.visualType,
            slide.slideTitle
          );

          if (templateMatch) {
            analysis.templateId = templateMatch.templateId;
          }
        }

        analyses.push(analysis);
      }

      // Generate summary statistics
      const summary = {
        totalSlides: slides.length,
        visualsNeeded: analyses.filter(a => a.imageNeed !== "none").length,
        programmaticCount: analyses.filter(a => 
          a.suggestedGenerator !== "ai_image" && a.imageNeed !== "none"
        ).length,
        aiCount: analyses.filter(a => 
          a.suggestedGenerator === "ai_image" && a.imageNeed !== "none"
        ).length,
        noneCount: analyses.filter(a => a.imageNeed === "none").length,
      };

      return {
        analyses,
        summary,
      };
    } catch (error) {
      console.error("[ImageOrchestrator] Error analyzing content:", error);
      throw error;
    }
  }

  /**
   * Generate a single visual asset
   */
  async generateVisual(request: VisualGenerationRequest): Promise<GeneratedVisualAsset> {
    try {
      const {
        sessionId,
        slideId,
        visualType,
        params,
        subject,
        gradeLevel,
        topic,
        subtopic,
        description,
        mustInclude,
        avoid,
        outputFormat = "png",
      } = request;

      console.log(`[ImageOrchestrator] Generating visual for slide ${slideId}, type: ${visualType}`);

      // Determine the best generator for this visual
      const analysis: SlideContentAnalysis = {
        slideId,
        slideTitle: slideId,
        subject,
        gradeLevel,
        topic,
        subtopic,
        imageNeed: visualType,
        confidence: 0.9, // High confidence since we're explicitly requesting
        suggestedGenerator: params.generator as GeneratorType || "svg_template",
        description,
        mustInclude,
        avoid,
        templateId: params.templateId,
      };

      const decision = determineGenerator(analysis);
      const assetId = uuidv4();

      let asset: GeneratedVisualAsset;

      // Generate based on the selected generator
      switch (decision.generator) {
        case "svg_template":
          asset = await this.generateSvgTemplate(assetId, sessionId, slideId, visualType, params, subject, gradeLevel);
          break;

        case "matplotlib":
          asset = await this.generateMathGraph(assetId, sessionId, slideId, visualType, params, subject, gradeLevel);
          break;

        case "geometry_engine":
          asset = await this.generateGeometryDiagram(assetId, sessionId, slideId, visualType, params, subject, gradeLevel);
          break;

        case "mermaid":
          asset = await this.generateMermaidDiagram(assetId, sessionId, slideId, visualType, params, subject, gradeLevel);
          break;

        case "wikimedia":
          asset = await this.generateWikimediaAsset(assetId, sessionId, slideId, visualType, params, subject, gradeLevel);
          break;

        case "ai_image":
          asset = await this.generateAiImageAsset(assetId, sessionId, slideId, visualType, params, subject, gradeLevel);
          break;

        case "latex_svg":
          asset = await this.generateLatexSvgAsset(assetId, sessionId, slideId, visualType, params, subject, gradeLevel);
          break;

        default:
          throw new Error(`Unknown generator: ${decision.generator}`);
      }

      // Validate the generated asset
      const validationRequest: VisualValidationRequest = {
        imageUrl: asset.imageUrl,
        visualType,
        subject,
        gradeLevel,
        expectedLabels: params.labels,
        mustInclude,
        avoid,
      };

      const validationResult = await validateImage(asset);
      asset.validated = validationResult.passed;
      asset.validationScore = validationResult.confidence;
      asset.validationNotes = validationResult.failureReasons || [];

      // Store the asset
      await storeAsset(asset);

      console.log(`[ImageOrchestrator] Generated asset ${assetId} with source: ${asset.generator}`);

      return asset;
    } catch (error) {
      console.error("[ImageOrchestrator] Error generating visual:", error);
      throw error;
    }
  }

  /**
   * Generate a batch of visuals for a session
   */
  async generateBatch(request: {
    sessionId: string;
    analyses: SlideContentAnalysis[];
    preferredGenerators?: Partial<Record<VisualType, GeneratorType>>;
  }): Promise<VisualGenerationBatch> {
    try {
      const { sessionId, analyses, preferredGenerators } = request;

      console.log(`[ImageOrchestrator] Generating batch for session ${sessionId}`);

      const batchId = uuidv4();
      const batch: VisualGenerationBatch = {
        batchId,
        sessionId,
        status: "generating",
        analyses,
        assets: [],
        failures: [],
        createdAt: new Date().toISOString(),
      };

      // Process each analysis
      for (const analysis of analyses) {
        try {
          // Override generator if preferred generator is specified
          const params: Record<string, any> = {
            generator: preferredGenerators?.[analysis.imageNeed] || analysis.suggestedGenerator,
            templateId: analysis.templateId,
            description: analysis.description,
            labels: analysis.mustInclude,
            gradeLevel: analysis.gradeLevel,
          };

          const request: VisualGenerationRequest = {
            sessionId,
            slideId: analysis.slideId,
            visualType: analysis.imageNeed,
            params,
            subject: analysis.subject,
            gradeLevel: analysis.gradeLevel,
            topic: analysis.topic,
            subtopic: analysis.subtopic,
            description: analysis.description,
            mustInclude: analysis.mustInclude,
            avoid: analysis.avoid,
          };

          const asset = await this.generateVisual(request);
          batch.assets.push(asset);
        } catch (error) {
          console.error(`[ImageOrchestrator] Failed to generate visual for slide ${analysis.slideId}:`, error);
          batch.failures.push({
            slideId: analysis.slideId,
            reason: error instanceof Error ? error.message : "Unknown error",
            fallbackUsed: false,
          });
        }
      }

      // Update batch status
      batch.status = batch.failures.length > 0 ? "completed" : "completed";
      batch.completedAt = new Date().toISOString();

      console.log(`[ImageOrchestrator] Batch ${batchId} completed. Success: ${batch.assets.length}, Failures: ${batch.failures.length}`);

      return batch;
    } catch (error) {
      console.error("[ImageOrchestrator] Error generating batch:", error);
      throw error;
    }
  }

  /**
   * Regenerate a specific visual
   */
  async regenerateVisual(assetId: string, reason: string, preferredGenerator?: GeneratorType): Promise<GeneratedVisualAsset> {
    try {
      // Get existing asset
      const existingAsset = await getAsset(assetId);
      if (!existingAsset) {
        throw new Error(`Asset ${assetId} not found`);
      }

      console.log(`[ImageOrchestrator] Regenerating asset ${assetId} because: ${reason}`);

      // Create new generation request based on existing asset
      const request: VisualGenerationRequest = {
        sessionId: existingAsset.sessionId || "",
        slideId: existingAsset.slideId || "",
        visualType: existingAsset.visualType,
        params: {
          generator: preferredGenerator || existingAsset.generator,
          templateId: existingAsset.svgCode ? "existing" : undefined,
          description: `Regenerated because: ${reason}`,
          labels: existingAsset.validationNotes?.includes("labelsCorrect") ? ["existing"] : undefined,
          gradeLevel: existingAsset.width ? Math.floor(existingAsset.width / 100) : 10,
        },
        subject: existingAsset.subject || "",
        gradeLevel: existingAsset.width ? Math.floor(existingAsset.width / 100) : 10,
        topic: "regenerated",
        description: reason,
        mustInclude: [],
        avoid: [],
      };

      // Generate new asset
      const newAsset = await this.generateVisual(request);

      console.log(`[ImageOrchestrator] Successfully regenerated asset ${assetId}`);

      return newAsset;
    } catch (error) {
      console.error("[ImageOrchestrator] Error regenerating visual:", error);
      throw error;
    }
  }

  /**
   * Get visual asset by ID
   */
  async getAsset(assetId: string): Promise<GeneratedVisualAsset | null> {
    try {
      return (await getAsset(assetId)) ?? null;
    } catch (error) {
      console.error("[ImageOrchestrator] Error getting asset:", error);
      throw error;
    }
  }

  /**
   * Generate SVG template
   */
private async generateSvgTemplate(
     assetId: string,
     sessionId: string,
     slideId: string,
     visualType: VisualType,
     params: Record<string, any>,
     subject: string,
     gradeLevel: number
   ): Promise<GeneratedVisualAsset> {
     const templateId = params.templateId;
     if (!templateId) {
       throw new Error("No templateId provided for SVG template generation");
     }

     const result = await generateSvgFromTemplate(templateId, {
       gradeLevel,
       labels: params.labels,
       style: "clean",
       width: params.width || 800,
       height: params.height || 600,
     });

     if (!result) {
       throw new Error(`Template ${templateId} not found`);
     }

     const { svgCode, width, height } = result;

     return {
       assetId,
       slideId,
       visualType,
       generator: "svg_template",
       imageUrl: `data:image/svg+xml;base64,${Buffer.from(svgCode).toString("base64")}`,
       svgCode,
       license: "internal/generated",
       attribution: null,
       altText: `${subject} ${visualType} diagram for grade ${gradeLevel}`,
       validated: false,
       validationScore: 0,
       validationNotes: [],
       mimeType: "image/svg+xml",
       width: width || params.width || 800,
       height: height || params.height || 600,
       createdAt: new Date().toISOString(),
     };
   }

  /**
   * Generate math graph
   */
  private async generateMathGraph(
    assetId: string,
    sessionId: string,
    slideId: string,
    visualType: VisualType,
    params: Record<string, any>,
    subject: string,
    gradeLevel: number
  ): Promise<GeneratedVisualAsset> {
    const graphData = await generateMathGraph({
      type: visualType === "math_graph" ? "coordinate_plot" : "function_plot",
      params: {
        xRange: params.xRange,
        yRange: params.yRange,
        points: params.points,
        function: params.function,
        title: params.title,
        xLabel: params.xLabel,
        yLabel: params.yLabel,
        grid: params.grid,
      },
      outputFormat: "png",
      width: params.width || 800,
      height: params.height || 600,
    });

    return {
      assetId,
      slideId,
      visualType,
      generator: "matplotlib",
      imageUrl: graphData.imageUrl,
      license: "internal/generated",
      attribution: null,
      altText: `${subject} mathematical graph for grade ${gradeLevel}`,
      validated: false,
      validationScore: 0,
      validationNotes: [],
      mimeType: "image/png",
      width: params.width || 800,
      height: params.height || 600,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Generate geometry diagram
   */
  private async generateGeometryDiagram(
    assetId: string,
    sessionId: string,
    slideId: string,
    visualType: VisualType,
    params: Record<string, any>,
    subject: string,
    gradeLevel: number
  ): Promise<GeneratedVisualAsset> {
    const diagramData = await generateGeometryDiagram({
      type: visualType === "geometry_diagram" ? "triangle" : "circle",
      template: params.template,
      params: {
        points: params.points,
        lines: params.lines,
        arcs: params.arcs,
        labels: params.labels,
      },
      outputFormat: "png",
      width: params.width || 800,
      height: params.height || 600,
    });

    return {
      assetId,
      slideId,
      visualType,
      generator: "geometry_engine",
      imageUrl: diagramData.imageUrl,
      svgCode: diagramData.svgCode,
      license: "internal/generated",
      attribution: null,
      altText: `${subject} geometry diagram for grade ${gradeLevel}`,
      validated: false,
      validationScore: 0,
      validationNotes: [],
      mimeType: diagramData.mimeType || "image/png",
      width: params.width || 800,
      height: params.height || 600,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Generate Mermaid diagram
   */
  private async generateMermaidDiagram(
    assetId: string,
    sessionId: string,
    slideId: string,
    visualType: VisualType,
    params: Record<string, any>,
    subject: string,
    gradeLevel: number
  ): Promise<GeneratedVisualAsset> {
    const diagramData = await generateMermaidDiagram({
      diagramType: "flowchart",
      sourceCode: params.sourceCode || "graph TD; A-->B; A-->C;",
      theme: "default",
      outputFormat: "png",
    });

    return {
      assetId,
      slideId,
      visualType,
      generator: "mermaid",
      imageUrl: diagramData.imageUrl,
      license: "internal/generated",
      attribution: null,
      altText: `${subject} flowchart for grade ${gradeLevel}`,
      validated: false,
      validationScore: 0,
      validationNotes: [],
      mimeType: "image/png",
      width: params.width || 800,
      height: params.height || 600,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Generate Wikimedia asset
   */
  private async generateWikimediaAsset(
    assetId: string,
    sessionId: string,
    slideId: string,
    visualType: VisualType,
    params: Record<string, any>,
    subject: string,
    gradeLevel: number
  ): Promise<GeneratedVisualAsset> {
    const searchQuery = params.searchQuery || `${subject} ${visualType}`;
    
    const wikimediaResults = await searchWikimediaCommons({
      searchQuery,
      category: params.category,
      minResolution: params.minResolution || 500,
      licenseFilter: "cc-by",
      maxResults: 5,
      gradeLevel,
    });

    if (wikimediaResults.length === 0) {
      throw new Error("No Wikimedia Commons assets found");
    }

    const selectedAsset = wikimediaResults[0];

    return {
      assetId,
      slideId,
      visualType,
      generator: "wikimedia",
      imageUrl: selectedAsset.imageUrl,
      thumbnailUrl: selectedAsset.thumbUrl,
      license: selectedAsset.license,
      attribution: selectedAsset.attributionText,
      altText: selectedAsset.title,
      validated: false,
      validationScore: 0.7, // Lower confidence for curated content
      validationNotes: ["Curated from Wikimedia Commons"],
      mimeType: "image/jpeg",
      width: selectedAsset.width,
      height: selectedAsset.height,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Generate AI image
   */
  private async generateAiImageAsset(
    assetId: string,
    sessionId: string,
    slideId: string,
    visualType: VisualType,
    params: Record<string, any>,
    subject: string,
    gradeLevel: number
  ): Promise<GeneratedVisualAsset> {
    const aiImageData = await generateAiImage({
      prompt: params.prompt || params.description || `${subject} ${visualType} for grade ${gradeLevel} K12 education`,
      negativePrompt: params.negativePrompt,
      style: "illustration",
      aspectRatio: "16:9",
      gradeLevel,
      subject,
      mustInclude: params.mustInclude || params.labels,
      avoid: params.avoid,
      outputFormat: "png",
    });

    return {
      assetId,
      slideId,
      visualType,
      generator: "ai_image",
      imageUrl: aiImageData.imageUrl,
      license: "internal/generated",
      attribution: null,
      altText: `${subject} AI-generated illustration for grade ${gradeLevel}`,
      validated: false,
      validationScore: 0,
      validationNotes: [],
      mimeType: "image/png",
      width: aiImageData.width,
      height: aiImageData.height,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Generate LaTeX SVG asset
   */
  private async generateLatexSvgAsset(
    assetId: string,
    sessionId: string,
    slideId: string,
    visualType: VisualType,
    params: Record<string, any>,
    subject: string,
    gradeLevel: number
  ): Promise<GeneratedVisualAsset> {
    const latexData = await generateLatexSvg({
      formula: params.formula || "x^2 + y^2 = r^2",
      outputFormat: "svg",
      width: params.width || 400,
      height: params.height || 300,
    });

    return {
      assetId,
      slideId,
      visualType,
      generator: "latex_svg",
      imageUrl: latexData.imageUrl,
      svgCode: latexData.svgCode,
      license: "internal/generated",
      attribution: null,
      altText: `${subject} mathematical formula for grade ${gradeLevel}`,
      validated: false,
      validationScore: 0,
      validationNotes: [],
      mimeType: "image/svg+xml",
      width: params.width || 400,
      height: params.height || 300,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Generate visual description from slide content
   */
  private generateVisualDescription(slide: any, detection: any): string {
    const parts = [];
    
    if (slide.slideTitle) parts.push(`"${slide.slideTitle}"`);
    if (detection.reason) parts.push(detection.reason);
    if (slide.bulletPoints?.length) {
      parts.push(`Contains: ${slide.bulletPoints.join(", ")}`);
    }

    return parts.join(". ") + ".";
  }

  /**
   * Extract must-include items from slide content
   */
  private extractMustInclude(slide: any): string[] {
    const mustInclude = [];
    
    if (slide.content.toLowerCase().includes("label")) mustInclude.push("labels");
    if (slide.content.toLowerCase().includes("diagram")) mustInclude.push("diagram");
    if (slide.content.toLowerCase().includes("chart")) mustInclude.push("chart");
    if (slide.content.toLowerCase().includes("graph")) mustInclude.push("graph");

    return mustInclude;
  }

  /**
   * Extract avoid items from slide content
   */
  private extractAvoid(slide: any): string[] {
    const avoid = [];
    
    if (slide.content.toLowerCase().includes("complex")) avoid.push("complex");
    if (slide.content.toLowerCase().includes("detailed")) avoid.push("detailed");
    if (slide.content.toLowerCase().includes("advanced")) avoid.push("advanced");

    return avoid;
  }
}

// Export the service instance
export const imageOrchestratorService = new ImageOrchestratorService();
