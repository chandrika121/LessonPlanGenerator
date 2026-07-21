{{STAGE_NAME}}
Return compact JSON only.
Enrich and label ONLY the existing document nodes for this class.

Output rules:
- Use only the provided structure hierarchy
- Return only units, chapter topic assignments, subtopics, formative_content_refs, validation_report
- Do not output practicals, activities, projects, teacher notes, assessment framework, or excluded content details
- The input contains theory/main syllabus units only; do not create or return practical, formative, SECTION A, SECTION B, or laboratory units
- source_text_excerpt is not allowed in this stage
- max 5 topics per chapter
- no explanations
- no duplicated source text
- do not repeat non-theory content
- output chapter count must equal input chapter count

Node rules:
- Stage 3 may label or enrich nodes but must never create hierarchy
- Preserve the provided hierarchy exactly
- use unit_id from Stage 2 only
- keep every chapter source_chapter_name exactly as provided
- do not create new chapters
- do not split chapters
- do not merge chapters
- do not rename chapters
- do not reclassify chapters as topics
- do not reclassify topics as chapters
- the chapter list provided in input is the source of truth
- for every chapter: keep chapter name exactly as provided, then extract only topics, subtopics, and key concepts
- each chapter must include source_type using only: explicit_chapter, chapter_heading, unit_fallback
- never create new class names, subject names, unit names, or chapter names
- do not promote unit_name, topics, subtopics, key_concepts, learning outcomes, activities, competencies, examples, or practical tasks into chapters
- topics and subtopics may be merged, reordered, or reassigned, but names must not be invented
- node_type labels must reflect the provided nodes only: unit, chapter, topic, competency, module
- not allowed: create new units, rename units, merge units, split units, convert subjects into classes, or use chapter names as units

Raw class extraction:
{{RAW_CLASS_JSON}}

Document structure hierarchy for this class:
{{STRUCTURE_CLASS_JSON}}

Curriculum source text:
{{SOURCE_TEXT}}
