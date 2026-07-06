/**
 * Asset Store Service
 * Manages storage and retrieval of generated visual assets
 */

import type { GeneratedVisualAsset, VisualGenerationBatch } from "../../../src/types-visual.js";

// In-memory store for development (would use MongoDB in production)
const assetStore = new Map<string, GeneratedVisualAsset>();
const batchStore = new Map<string, VisualGenerationBatch>();

export function storeAsset(asset: GeneratedVisualAsset): void {
  assetStore.set(asset.assetId, asset);
}

export function getAsset(assetId: string): GeneratedVisualAsset | undefined {
  return assetStore.get(assetId);
}

export function getAssetsBySlideId(slideId: string): GeneratedVisualAsset[] {
  return Array.from(assetStore.values()).filter(asset => asset.slideId === slideId);
}

export function getAllAssets(): GeneratedVisualAsset[] {
  return Array.from(assetStore.values());
}

export function deleteAsset(assetId: string): boolean {
  return assetStore.delete(assetId);
}

export function storeBatch(batch: VisualGenerationBatch): void {
  batchStore.set(batch.batchId, batch);
}

export function getBatch(batchId: string): VisualGenerationBatch | undefined {
  return batchStore.get(batchId);
}

export function updateBatchStatus(batchId: string, status: VisualGenerationBatch["status"]): void {
  const batch = batchStore.get(batchId);
  if (batch) {
    batch.status = status;
  }
}

export function getBatchBySessionId(sessionId: string): VisualGenerationBatch | undefined {
  return Array.from(batchStore.values()).find(b => b.batchId === sessionId || b.sessionId === sessionId);
}

export function clearStore(): void {
  assetStore.clear();
  batchStore.clear();
}