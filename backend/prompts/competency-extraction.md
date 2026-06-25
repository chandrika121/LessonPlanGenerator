{{EXTRACTION_RULES}}

{{STAGE_NAME}}
- Extract competencies only.
- No analysis or lesson-planning inference.
- Use only the provided class/unit/chapter payload as structural context.
- Do not invent new units or chapters.
- Return at most 1 competency_group per chapter.
- Never create multiple sub-groups for the same chapter.
- Limit each competency_group to 3-5 competencies maximum.
- If a chapter has no clear competencies in the source, omit it instead of expanding it.

Stage payload:
{{STAGE_PAYLOAD_JSON}}

Curriculum source text:
{{SOURCE_TEXT}}
