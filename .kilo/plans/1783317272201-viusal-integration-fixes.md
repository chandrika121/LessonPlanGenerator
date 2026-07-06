# Fix Visual Integration TypeScript Errors

## Errors to Fix

### 1. `findTemplateForContent` not found (image-orchestrator.ts:77)
- **File**: `backend/services/visual/image-orchestrator.ts`
- **Fix**: Add `findTemplateForContent` to the import from `./svg-template-engine.js`

### 2. `sessionId` and `subject` missing on `GeneratedVisualAsset` (image-orchestrator.ts:311, 321)
- **File**: `src/types-visual.ts`
- **Fix**: Add optional fields `sessionId?: string` and `subject?: string` to `GeneratedVisualAsset` interface

### 3. `width` and `height` missing on `MermaidRequest` (mermaid-engine.ts:23)
- **File**: `src/types-visual.ts`
- **Fix**: Add optional fields `width?: number` and `height?: number` to `MermaidRequest` interface

### 4. Type incompatibility in regenerateVisual (image-orchestrator.ts:346)
- **File**: `backend/services/visual/image-orchestrator.ts`
- **Fix**: Change `getAsset` return type expectation from `null` to handle `undefined` or update the call site

## Implementation Order

1. Update `MermaidRequest` interface in `src/types-visual.ts`
2. Update `GeneratedVisualAsset` interface in `src/types-visual.ts`
3. Fix import in `backend/services/visual/image-orchestrator.ts`
4. Fix null/undefined handling in `regenerateVisual` method