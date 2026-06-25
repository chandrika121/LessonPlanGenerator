{{STAGE_NAME}}
{{EXTRACTION_RULES}}

Return JSON only.
Disable reasoning and answer directly.
Extract curriculum hierarchy faithfully from the source.

Capture:
- document_metadata
- classes
- units
- chapters
- topics
- subtopics
- key concepts
- marks attached to units or chapters when explicit

Rules:
- Keep output concise, but include all visible units, chapters, topics, and subtopics in this input
- Preserve official syllabus wording as closely as possible; do not summarize topic lists into generic prose
- If a unit is followed directly by topic lists, keep that as unit -> topics
- Only create chapters when the source clearly contains explicit chapter-like structure inside a unit
- Never convert a unit into a chapter just because no deeper chapter heading exists
- Include practical and assessment section names only when they appear as units or chapter-like structural entries tied to the visible class/section
- Never generate the complete curriculum content
- Only capture class names, subject, unit names, chapter names, topic lists, subtopic lists, section labels, and explicit marks
- If a chunk contains only partial information, return only what is visible in that chunk
- Do not infer, estimate, explain, recommend, or analyze
- Do not include any fields other than the requested schema
{{CHUNK_RULE}}

Curriculum source text:
{{SOURCE_TEXT}}
