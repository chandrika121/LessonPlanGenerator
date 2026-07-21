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
- Include all visible units, chapters, topics, and subtopics in this input.
- Preserve official syllabus wording as closely as possible.
- Do not omit visible curriculum content for brevity.
- Extract all curriculum content visible in the current input chunk.
- Never reconstruct, continue, complete, or generate curriculum content that is not visible in the current input chunk.
- Do not use prior knowledge of the subject or curriculum.

Hierarchy:
- Preserve the hierarchy explicitly visible in the source.
- Prefer source structure over semantic assumptions.
- Determine hierarchy from headings, numbering, labels, indentation, list structure, tables, repeated formatting patterns, and surrounding context.
- Do not assume every curriculum uses the same hierarchy depth.
- Valid visible structures may include:
  class -> unit -> chapter -> topic -> subtopic
  class -> unit -> topic -> subtopic
  class -> chapter -> topic -> subtopic
  class -> section -> unit -> chapter -> topic
- Preserve only hierarchy supported by the source.

Class detection:
- Treat explicit class, grade, standard, level, year, or equivalent academic-level labels as class boundaries when they identify the curriculum level.
- Keep content under the current class until another explicit class boundary appears.
- Never merge curriculum content from different classes or grades.
- If multiple classes are visible, preserve each class separately.

Unit detection:
- Treat explicitly labelled units, modules, themes, blocks, strands, domains, sections, parts, or equivalent top-level curriculum divisions as units when they function as the major syllabus grouping.
- Preserve the official visible name.
- Treat a complete labelled heading and its title as one atomic structural heading.
- For a heading such as "Unit-I: Relations and Functions", the title after the label belongs to the unit heading.
- Do not separate the title from its structural label and emit it as a lower-level node solely because it is title-like.
- Never convert a unit into a chapter because no deeper heading exists.
- Never create fallback or synthetic chapters from unit names.
- If a unit is followed directly by syllabus content without explicit chapter-like structure, attach the content to unit topics.

Chapter detection:
- Create chapters only when explicit chapter-like structure is visible inside the parent unit or section.
- Chapter evidence may include numbered headings, named lesson headings, chapter labels, prescribed text titles, work titles, module subdivisions, or repeated heading patterns that clearly introduce separate syllabus content.
- A numbering marker and heading title may be split across adjacent lines because of PDF or OCR extraction.
- Reconstruct adjacent split headings only when the structural relationship is clear from the visible source.
- Attach syllabus content following a chapter heading to that chapter until the next chapter, unit, class, or equivalent structural boundary.
- Never create a chapter solely from the parent unit title.
- Never classify a unit title as an explicit chapter without independent chapter-heading evidence.

Structural title ownership:
- A title belongs to the structural label with which it appears.
- Text belonging to a unit heading must remain the unit name.
- Text belonging to a chapter heading must remain the chapter name.
- Unit and chapter names may contain identical text.
- Do not deduplicate structural nodes based only on matching text.
- Preserve separate structural occurrences when each occurrence has independent visible structural evidence.

Topic extraction:
- Extract topics from syllabus statements under the current unit or chapter.
- A topic is a distinct curriculum content item, concept, skill, process, method, principle, theory, theme, issue, event, period, text, work, genre, competency, application area, practical area, or named content group explicitly expressed in the source.
- Preserve explicit syllabus wording as closely as possible.
- Decompose syllabus paragraphs into separate topics when the source clearly lists multiple distinct curriculum content items.
- Do not store an entire syllabus paragraph as one topic when multiple distinct items are explicitly enumerated.
- Do not create generic summary topics that replace specific source content.
- Do not duplicate the chapter or unit title as a topic unless the source independently presents it as curriculum content.

Subtopic extraction:
- Extract subtopics when the source explicitly expresses subordinate content belonging to a broader topic.
- Subtopic evidence may include examples, types, categories, components, properties, methods, stages, cases, forms, classifications, authors, texts, works, events, periods, regions, processes, techniques, applications, experiments, skills, or other constituent items.
- Use topic -> subtopics when a broader visible curriculum item is followed by specific constituent items.
- Preserve the relationship expressed by the source.
- Do not invent subtopics merely to make the hierarchy deeper.
- Do not split a topic into subtopics when the source does not express a meaningful parent-child relationship.

List handling:
- Preserve explicit lists and enumerations.
- When the source introduces a broader item followed by a list of constituent items, preserve the broader item as the topic and the listed items as subtopics.
- When listed items are independent syllabus items with no explicit broader parent, preserve them as separate topics.
- Use punctuation, introductory phrases, numbering, bullets, table structure, and sentence grammar to determine whether items are topics or subtopics.
- Do not replace explicit lists with "etc.", generic summaries, or shortened prose.

Subject-neutral interpretation:
- Do not assume topics must be scientific or mathematical concepts.
- In science subjects, curriculum items may include concepts, laws, processes, experiments, applications, or methods.
- In mathematics, curriculum items may include concepts, operations, properties, methods, theorems, applications, or problem types.
- In humanities and social sciences, curriculum items may include themes, events, periods, movements, institutions, regions, issues, case studies, or analytical concepts.
- In literature and language subjects, curriculum items may include texts, prose, poetry, drama, authors, genres, grammar areas, writing skills, reading skills, or language competencies.
- In commerce subjects, curriculum items may include principles, processes, statements, systems, methods, regulations, applications, or business concepts.
- In computer and vocational subjects, curriculum items may include technologies, tools, procedures, workflows, practical skills, systems, commands, techniques, or applications.
- These subject examples are interpretation guidance only.
- Never generate curriculum items from these examples unless they are visible in the source.

Scope and qualifiers:
- Preserve visible restrictions, scope qualifiers, exclusions, conditions, ranges, limits, prescribed cases, and assessment constraints when they are part of curriculum content.
- Preserve parenthetical content when it changes curriculum scope or meaning.
- Do not remove phrases equivalent to "with reference to", "up to", "limited to", "without proof", "excluding", "only", "including", or other visible scope constraints.
- Preserve formulas, named works, text titles, historical periods, technical terminology, and official labels as faithfully as the source text permits.

Key concepts:
- Extract concise key concepts explicitly present in the visible source.
- Key concepts are enrichment fields.
- Key concepts must not replace classes, units, chapters, topics, or subtopics.
- Do not use key concepts to reconstruct missing hierarchy.
- A structural node may also appear as a key concept only when useful, but the original structural node must remain.

Marks:
- Capture marks only when explicitly attached to a unit or chapter.
- Attach marks to the exact visible structural node indicated by the source.
- Do not infer marks from totals, percentages, nearby tables, assessment patterns, or curriculum knowledge.
- Do not swap marks and percentage values.

Assessment and practical content:
- Include practical and assessment section names only when they appear as units or chapter-like structural entries tied to the visible class or curriculum section.
- Do not convert general question paper design, marks tables, Bloom's taxonomy descriptions, internal assessment instructions, teacher guidance, or explanatory notes into curriculum units, chapters, topics, or subtopics unless the source explicitly presents them as curriculum content.
- Do not merge formative-only content with summative curriculum content when the source explicitly distinguishes them.

Partial chunks:
- If the input contains only partial information, return only the curriculum structure and content visible in that chunk.
- A chapter, topic, or list may continue outside the current chunk.
- Do not complete truncated content from subject knowledge or likely curriculum structure.
- Do not generate the complete curriculum when only part of it is visible.

Validation:
- Every extracted unit must have visible unit-level or equivalent top-level structural evidence.
- Every extracted chapter must have independent chapter-like structural evidence.
- Every topic must be supported by visible syllabus content.
- Every subtopic must be supported by visible subordinate content.
- If explicit chapters are visible, preserve them as chapters and attach their syllabus content to them.
- If no chapter structure is visible, keep syllabus content at unit -> topics.
- Never create fallback, synthetic, reconstructed, or schema-filling chapters.
- Never shift hierarchy by treating units as chapters or chapters as topics.
- Never remove visible topics or subtopics merely to keep output concise.
- Structural classification must be based on the current source input, not prior subject knowledge.

Do not infer, estimate, explain, recommend, analyze, or repair missing source content.
Do not include any fields other than the requested schema.

{{CHUNK_RULE}}

Curriculum source text:
{{SOURCE_TEXT}}