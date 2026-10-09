# /alterspec-create-module — create a module

Read `.alterspec/prompts/_shared.md` first and follow it.

Arguments: `<CODE> <title>`. Ask for whatever is missing.

1. Check the module doesn't exist (`alterspec show MOD-<CODE>` should fail).
2. Ask what the module covers, what it deliberately does not cover, and which other modules it depends on.
3. Run `alterspec new module --code <CODE> --title "<title>" --json`. It creates the folder and adds the module to
   `application.md`.
4. Write the Description section, and set `depends_on` in the front-matter.
5. Ask whether the module has rules of its own. For each: `alterspec new rule --module <CODE> --title "<rule>" --json`,
   then state the rule in one testable sentence ("A ... must ... when ...").
6. Ask for the capabilities the module needs (titles and roles only) and list them as next steps for
   `/alterspec-create-capability`. Don't create them unless the person asks.
7. Run `alterspec views` and `alterspec show MOD-<CODE>`; fix errors.
