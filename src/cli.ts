import { Command } from 'commander';
import { packageVersion } from './assets.js';
import { runDoctor } from './commands/doctor.js';
import { printResult, runInit } from './commands/init.js';
import { NEW_TYPES, runNew, type NewOptions, type NewType } from './commands/new.js';
import { formatShow, runShow } from './commands/show.js';
import { runUpdate } from './commands/update.js';
import { runBaseline } from './commands/baseline.js';
import { runHandoff } from './commands/handoff.js';
import { runChangeEdit, runChangeNew, runChangeRemove, runChangeStatus } from './commands/change.js';
import { runApply } from './changes/apply.js';
import { computeImpact, formatImpact } from './changes/impact.js';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { formatHuman, listRules, runValidate } from './commands/validate.js';
import { runViews } from './commands/views.js';
import { runPrototypeBuild, runPrototypeCheck, runPrototypeInit } from './commands/prototype.js';

const program = new Command();

program
  .name('alterspec')
  .description('alterspec — the spec changes with the product.')
  .version(packageVersion());

program
  .command('init')
  .description('Install alterspec into a project: .alterspec/, .claude/ wrappers and the spec/ skeleton')
  .argument('[dir]', 'project directory', '.')
  .option('-C, --dir <dir>', 'project directory (same as [dir])')
  .option('-n, --name <name>', 'application name (defaults to the directory name)')
  .action((pos: string, opts: { name?: string; dir?: string }) => {
    const result = runInit(opts.dir ?? pos, opts);
    printResult(result);
    console.log('\nNext: open Claude Code in this project and run /alterspec-init.');
  });

program
  .command('update')
  .description('Refresh framework files (.alterspec/ and .claude/ wrappers). Never touches spec/ or custom/')
  .argument('[dir]', 'project directory', '.')
  .option('-C, --dir <dir>', 'project directory (same as [dir])')
  .option('-f, --force', 'overwrite .claude/ wrappers you modified')
  .action((pos: string, opts: { force?: boolean; dir?: string }) => {
    printResult(runUpdate(opts.dir ?? pos, opts));
  });

program
  .command('doctor')
  .description('Check the alterspec installation')
  .argument('[dir]', 'project directory', '.')
  .option('-C, --dir <dir>', 'project directory (same as [dir])')
  .action((pos: string, opts: { dir?: string }) => {
    const checks = runDoctor(opts.dir ?? pos);
    for (const c of checks) console.log(`${c.ok ? '✓' : '✗'} ${c.message}`);
    if (checks.some((c) => !c.ok)) process.exitCode = 1;
  });

program
  .command('validate')
  .description('Lint the spec: references, coverage, generated views, glossary and technology words')
  .argument('[dir]', 'project directory', '.')
  .option('-C, --dir <dir>', 'project directory (same as [dir])')
  .option('--spec <path>', 'spec folder, relative to the project', 'spec')
  .option('--json', 'print findings as JSON')
  .option('--report', 'also write spec/_generated/lint-report.md')
  .option('--list-rules', 'list the lint rules and exit')
  .option('--change <CHG>', 'validate the spec as it would be after this change')
  .action(
    (
      pos: string,
      opts: {
        spec: string;
        json?: boolean;
        report?: boolean;
        listRules?: boolean;
        change?: string;
        dir?: string;
      },
    ) => {
      const dir = opts.dir ?? pos;
      if (opts.listRules) {
        console.log(listRules());
        return;
      }
      const result = runValidate(dir, opts);
      console.log(opts.json ? JSON.stringify(result, null, 2) : formatHuman(result, opts.spec));
      if (result.summary.errors > 0) process.exitCode = 1;
    },
  );

program
  .command('views')
  .description('Regenerate GENERATED blocks and spec/_generated/ from the spec front-matter')
  .argument('[dir]', 'project directory', '.')
  .option('-C, --dir <dir>', 'project directory (same as [dir])')
  .option('--spec <path>', 'spec folder, relative to the project', 'spec')
  .option('--check', "don't write; exit 1 if anything is out of date")
  .action((pos: string, opts: { spec: string; check?: boolean; dir?: string }) => {
    const dir = opts.dir ?? pos;
    const result = runViews(dir, opts);
    for (const s of result.skipped) console.log(`skipped (invalid front-matter): ${opts.spec}/${s}`);
    for (const m of result.missing)
      console.log(`missing GENERATED block "${m.block}" in ${opts.spec}/${m.file}`);
    if (result.changed.length === 0) console.log('Views are up to date.');
    else {
      console.log(`${opts.check ? 'Out of date' : 'Updated'}: ${result.changed.length}`);
      for (const f of result.changed) console.log(`  ${opts.spec}/${f}`);
      if (opts.check) process.exitCode = 1;
    }
  });

program
  .command('new')
  .description(`Create a spec object with the next free ID: ${NEW_TYPES.join(', ')}`)
  .argument('<type>', NEW_TYPES.join(' | '))
  .option('-C, --dir <dir>', 'project directory', '.')
  .option('--spec <path>', 'spec folder, relative to the project', 'spec')
  .option('--code <code>', 'module code (module)')
  .option('--module <code>', 'owning module (capability, screen, module rule)')
  .option('--title <title>', 'title')
  .option('--name <name>', 'name part of the ID (entity, event, persona, role)')
  .option('--role <role>', 'acting role (capability) or role of a persona')
  .option('--scope <scope>', 'permission scope of the role (capability): own | team | org | all')
  .option('--capability <id>', 'first step (flow)')
  .option('--external', 'event comes from or goes to an external party')
  .option('--kind <kind>', 'decision | open_question | assumption (decision)')
  .option('--term <term>', 'canonical term (term)')
  .option('--forbidden <list>', 'comma-separated forbidden synonyms (term)')
  .option('--change <CHG>', 'create the object inside this change proposal')
  .option('--json', 'print { id, file, line } as JSON')
  .action(
    (type: string, opts: Record<string, string | boolean | undefined> & { dir: string; json?: boolean }) => {
      const result = runNew(opts.dir, type as NewType, opts as NewOptions);
      console.log(
        opts.json ? JSON.stringify(result) : `created ${result.id} in ${result.file}:${result.line}`,
      );
    },
  );

program
  .command('show')
  .description('Show a spec object: references both ways, empty sections, open questions and findings')
  .argument('<id>', 'spec object ID')
  .option('-C, --dir <dir>', 'project directory', '.')
  .option('--spec <path>', 'spec folder, relative to the project', 'spec')
  .option('--json', 'print as JSON')
  .action((id: string, opts: { dir: string; spec: string; json?: boolean }) => {
    const result = runShow(opts.dir, id, opts);
    console.log(opts.json ? JSON.stringify(result, null, 2) : formatShow(result));
  });

program
  .command('baseline')
  .description('Record the agreed first version; from then on every edit goes through a change proposal')
  .option('-C, --dir <dir>', 'project directory', '.')
  .option('--spec <path>', 'spec folder, relative to the project', 'spec')
  .option('--force', 'replace an existing baseline (accepts direct edits)')
  .action((opts: { dir: string; spec: string; force?: boolean }) => {
    const r = runBaseline(opts.dir, opts);
    console.log(
      `Baseline recorded: ${r.objects} objects. From now on, change the spec through /alterspec-change.`,
    );
  });

const change = program.command('change').description('Create and edit change proposals');
const changeOpts = (c: Command) =>
  c
    .option('-C, --dir <dir>', 'project directory', '.')
    .option('--spec <path>', 'spec folder, relative to the project', 'spec');

changeOpts(change.command('new').description('Start a change proposal'))
  .requiredOption('--title <title>', 'what the change is about')
  .option('--json', 'print { id, file } as JSON')
  .action((opts: { dir: string; spec: string; title: string; json?: boolean }) => {
    const r = runChangeNew(opts.dir, opts.title, opts);
    console.log(opts.json ? JSON.stringify(r) : `created ${r.id} in ${r.file}`);
  });

changeOpts(change.command('edit').description('Copy an object into a change so it can be edited there'))
  .argument('<CHG>')
  .argument('<key>', 'object ID, term:<Term> or file:<path>')
  .option('--rebase', 'accept the current spec version as the new base (after resolving a conflict)')
  .option('--json', 'print the result as JSON')
  .action(
    (id: string, key: string, opts: { dir: string; spec: string; rebase?: boolean; json?: boolean }) => {
      const r = runChangeEdit(opts.dir, id, key, opts);
      console.log(
        opts.json
          ? JSON.stringify({ ...r, file: `${opts.spec}/${r.file}` })
          : `${r.copied ? 'copied' : 'already in the change'}: ${opts.spec}/${r.file}`,
      );
    },
  );

changeOpts(change.command('remove').description('Mark an object for removal in a change'))
  .argument('<CHG>')
  .argument('<key>', 'object ID, term:<Term> or file:<path>')
  .action((id: string, key: string, opts: { dir: string; spec: string }) => {
    const r = runChangeRemove(opts.dir, id, key, opts);
    console.log(`${id.toUpperCase()} removes ${r.key}`);
  });

changeOpts(change.command('status').description('Move a change: draft | in_review | approved | rejected'))
  .argument('<CHG>')
  .argument('<status>')
  .action((id: string, status: string, opts: { dir: string; spec: string }) => {
    const r = runChangeStatus(opts.dir, id, status, opts);
    console.log(`${r.id} is ${r.status}`);
  });

program
  .command('impact')
  .description('Impact analysis of a change proposal')
  .argument('<CHG>')
  .option('-C, --dir <dir>', 'project directory', '.')
  .option('--spec <path>', 'spec folder, relative to the project', 'spec')
  .option('--json', 'print as JSON')
  .option('--write', 'also write impact.md in the change folder')
  .action((id: string, opts: { dir: string; spec: string; json?: boolean; write?: boolean }) => {
    const impact = computeImpact(opts.dir, id, opts);
    const md = formatImpact(impact);
    if (opts.write) writeFileSync(join(opts.dir, opts.spec, 'changes', impact.id, 'impact.md'), md);
    console.log(opts.json ? JSON.stringify(impact, null, 2) : md);
    if (impact.conflicts.length || impact.errors) process.exitCode = 1;
  });

program
  .command('handoff')
  .description(
    'Export a capability or module for Spec Kit, OpenSpec, BMAD or a technical design (into handoff/)',
  )
  .argument('<id>', 'capability or module ID')
  .option('-C, --dir <dir>', 'project directory', '.')
  .option('--spec <path>', 'spec folder, relative to the project', 'spec')
  .option('-t, --target <target>', 'bundle | speckit | openspec | bmad | all', 'bundle')
  .option('--allow-draft', 'export capabilities that are not ready yet')
  .option('--date <date>', 'date written into the output (YYYY-MM-DD)')
  .option('--json', 'print as JSON')
  .action(
    (
      id: string,
      opts: {
        dir: string;
        spec: string;
        target: string;
        allowDraft?: boolean;
        date?: string;
        json?: boolean;
      },
    ) => {
      const r = runHandoff(opts.dir, id, opts);
      if (opts.json) console.log(JSON.stringify(r, null, 2));
      else {
        for (const w of r.warnings) console.log(`warning: ${w}`);
        for (const o of r.outputs) console.log(`${o.target}: ${o.folder}/ (${o.files.join(', ')})`);
      }
    },
  );

program
  .command('apply')
  .description('Merge an approved change into the spec, regenerate views and archive the change')
  .argument('<CHG>')
  .option('-C, --dir <dir>', 'project directory', '.')
  .option('--spec <path>', 'spec folder, relative to the project', 'spec')
  .option('--json', 'print as JSON')
  .action((id: string, opts: { dir: string; spec: string; json?: boolean }) => {
    const r = runApply(opts.dir, id, opts);
    if (opts.json) console.log(JSON.stringify(r, null, 2));
    else {
      console.log(`Applied ${r.id}: ${r.written.length} file(s) written, ${r.deleted.length} deleted.`);
      for (const v of r.versions) console.log(`  ${v.key} is now version ${v.version}`);
      console.log(`Archived in ${r.archivedTo}`);
    }
  });

const prototype = program
  .command('prototype')
  .description('Design-system variants of the generated prototype (design/ → prototype/<variant>/)');

prototype
  .command('init')
  .description('Write a starter design/ folder (design.yaml, tokens.css). Never overwrites')
  .option('-C, --dir <dir>', 'project directory', '.')
  .option('--base <base>', 'bootstrap | tabler | tailwind | custom', 'bootstrap')
  .option('--json', 'print as JSON')
  .action((opts: { dir: string; base: string; json?: boolean }) => {
    const r = runPrototypeInit(opts.dir, opts);
    if (opts.json) console.log(JSON.stringify(r, null, 2));
    else {
      for (const f of r.created) console.log(`created ${f}`);
      for (const f of r.skipped) console.log(`kept ${f} (exists)`);
    }
  });

prototype
  .command('build')
  .description('Render a variant into prototype/<variant>/ from the spec and design/')
  .option('-C, --dir <dir>', 'project directory', '.')
  .option('--spec <path>', 'spec folder, relative to the project', 'spec')
  .option('--variant <variant>', 'bootstrap | tabler | tailwind (default: base in design.yaml)')
  .option('--json', 'print as JSON')
  .action((opts: { dir: string; spec: string; variant?: string; json?: boolean }) => {
    const r = runPrototypeBuild(opts.dir, opts);
    if (opts.json) console.log(JSON.stringify(r, null, 2));
    else console.log(`${r.variant}: ${r.folder}/ (${r.files.length} files)`);
  });

prototype
  .command('check')
  .description('Check variants against the spec: every page and element present, nothing added, not stale')
  .option('-C, --dir <dir>', 'project directory', '.')
  .option('--spec <path>', 'spec folder, relative to the project', 'spec')
  .option('--variant <variant>', 'one variant (default: every folder in prototype/)')
  .option('--stamp', 'when only the stamp is out of date, record the current spec in variant.json')
  .option('--json', 'print as JSON')
  .action((opts: { dir: string; spec: string; variant?: string; stamp?: boolean; json?: boolean }) => {
    const r = runPrototypeCheck(opts.dir, opts);
    if (opts.json) console.log(JSON.stringify(r, null, 2));
    else if (r.variants.length === 0) console.log('No variants in prototype/.');
    else {
      for (const v of r.stamped) console.log(`stamped ${v}`);
      for (const f of r.findings) console.log(`${f.file}  ${f.kind}  ${f.message}`);
      if (r.findings.length === 0) console.log(`✓ ${r.variants.join(', ')} match the spec.`);
    }
    if (r.findings.length) process.exitCode = 1;
  });

program.parseAsync().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
