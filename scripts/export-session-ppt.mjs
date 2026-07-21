console.error(
  [
    "This legacy PPT export script has been deprecated.",
    "Use the canonical server-side PPTX export pipeline instead:",
    "- start the backend",
    "- generate or refresh session materials",
    "- export through /api/export-pptx or the Lesson Planner UI",
    "",
    "Reason: the production PPT pipeline now relies on adaptive deck normalization,",
    "persistent local visual assets, and the shared server exporter.",
  ].join("\n")
);

process.exitCode = 1;
