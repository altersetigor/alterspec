# /alter-views — regenerate generated views

1. Run `npx @alterset/alterspec views` from the project root.
2. Tell the user, in a few lines, which files changed. Mention any file reported as skipped (its front-matter is
   invalid) or any missing GENERATED block, and suggest `/alter-validate` to see why.
3. Don't edit GENERATED blocks or files in `spec/_generated/` yourself. They come from the capability, screen
   and entity front-matter.
