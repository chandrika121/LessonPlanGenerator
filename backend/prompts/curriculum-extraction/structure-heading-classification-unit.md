{{STAGE_NAME}}
Return compact JSON only.
Classify headings and content blocks for this single unit only.

Rules:
- classify only within this unit
- use one of: unit, chapter, topic, subtopic, formative_content, practical, project, activity, assessment, teacher_note, excluded_content, unknown
- a valid chapter should be short and source-grounded
- if a heading is long, explanatory, or clause-heavy, classify it as topic instead of chapter
- do not create or rename unit_name
- do not create or rename parent_unit
- only classify existing Stage 1 items as chapter/topic/subtopic
- if classification is chapter, source_heading must exactly come from Stage 1 extracted headings for this unit
- never rewrite, summarize, merge, or invent chapter names
- source_text_excerpt must be at most 180 characters
- no explanations
- no repeated raw text

Class name:
{{CLASS_NAME}}

Unit raw extraction:
{{UNIT_JSON}}
