{{STAGE_NAME}}
{{EXTRACTION_RULES}}

Return JSON only.
Disable reasoning and answer directly.
Extract only concise curriculum facts needed to build the hierarchy.

Capture:
- document_metadata
- classes
- units
- chapters
- marks attached to units or chapters when explicit

Rules:
- Keep output concise, but include all visible units and chapters in this input
- Never include topics, subtopics, key concepts, activities, projects, raw nodes, or long prose paragraphs
- Include practical and assessment section names only when they appear as units or chapter-like structural entries tied to the visible class/section
- Never generate the complete curriculum content
- Only capture class names, subject, unit names, chapter names, section labels, and explicit marks
- If a chunk contains only partial information, return only what is visible in that chunk
- Do not infer, estimate, explain, recommend, or analyze
- Do not include any fields other than the requested schema
{{CHUNK_RULE}}

Curriculum source text:
{{SOURCE_TEXT}}
