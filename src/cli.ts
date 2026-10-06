import { Command } from 'commander';
import { packageVersion } from './assets.js';
import { runDoctor } from './commands/doctor.js';
import { printResult, runInit } from './commands/init.js';
import { NEW_TYPES, runNew, type NewOptions, type NewType } from './commands/new.js';
import { formatShow, runShow } from './commands/show.js';
import { runUpdate } from './commands/update.js';
import { formatHuman, listRules, runValidate } from './commands/validate.js';
import { runViews } from './commands/views.js';

const program = new Command();

program
  .name('alterspec')
  .description('alterspec — the spec changes with the product.')
  .version(packageVersion());

program
  .command('init')
  .description('Install alterspec into a project: .alterspec/, .claude/ wrappers and the spec/ skeleton')
  .argument('[dir]', 'project directory', '.')
  .option('-n, --name <name>', 'application name (defaults to the directory name)')
  .action((dir: string, opts: { name?: string }) => {
    const result = runInit(dir, opts);
    printResult(result);
    console.log('\nNext: open Claude Code in this project and run /alter-init.');
  });

program
  .command('update')
  .description('Refresh framework files (.alterspec/ and .claude/ wrappers). Never touches spec/ or custom/')
  .argument('[dir]', 'project directory', '.')
  .option('-f, --force', 'overwrite .claude/ wrappers you modified')
  .action((dir: string, opts: { force?: boolean }) => {
    printResult(runUpdate(dir, opts));
  });

program
  .command('doctor')
  .description('Check the alterspec installation')
  .argument('[dir]', 'project directory', '.')
  .action((dir: string) => {
    const checks = runDoctor(dir);
    for (const c of checks) console.log(`${c.ok ? '✓' : '✗'} ${c.message}`);
    if (checks.some((c) => !c.ok)) process.exitCode = 1;
  });

program
  .command('validate')
  .description('Lint the spec: references, coverage, generated views, glossary and technology words')
  .argument('[dir]', 'project directory', '.')
  .option('--spec <path>', 'spec folder, relative to the project', 'spec')
  .option('--json', 'print findings as JSON')
  .option('--report', 'also write spec/_generated/lint-report.md')
  .option('--list-rules', 'list the lint rules and exit')
  .action((dir: string, opts: { spec: string; json?: boolean; report?: boolean; listRules?: boolean }) => {
    if (opts.listRules) {
      console.log(listRules());
      return;
    }
    const result = runValidate(dir, opts);
    console.log(opts.json ? JSON.stringify(result, null, 2) : formatHuman(result, opts.spec));
    if (result.summary.errors > 0) process.exitCode = 1;
  });

program
  .command('views')
  .description('Regenerate GENERATED blocks and spec/_generated/ from the spec front-matter')
  .argument('[dir]', 'project directory', '.')
  .option('--spec <path>', 'spec folder, relative to the project', 'spec')
  .option('--check', "don't write; exit 1 if anything is out of date")
  .action((dir: string, opts: { spec: string; check?: boolean }) => {
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

const PLANNED: [string, string, string][] = [
  ['impact', 'Impact analysis of a change proposal', 'change management (phase 4)'],
  ['apply', 'Merge an approved change proposal', 'change management (phase 4)'],
];
for (const [name, description, phase] of PLANNED) {
  program
    .command(name)
    .description(`${description} — not available yet`)
    .allowUnknownOption()
    .argument('[args...]')
    .action(() => {
      console.error(`alterspec ${name} is not available yet. It arrives with ${phase}.`);
      process.exitCode = 2;
    });
}

program.parseAsync().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
