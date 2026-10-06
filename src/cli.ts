import { Command } from 'commander';
import { packageVersion } from './assets.js';
import { runDoctor } from './commands/doctor.js';
import { printResult, runInit } from './commands/init.js';
import { runUpdate } from './commands/update.js';

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

const PLANNED: [string, string, string][] = [
  ['validate', 'Validate the spec (deterministic linter)', 'the linter (phase 2)'],
  ['views', 'Regenerate generated views', 'views (phase 2)'],
  ['impact', 'Impact analysis of a change proposal', 'change management (phase 4)'],
  ['apply', 'Merge an approved change proposal', 'change management (phase 4)'],
  ['new', 'Create a spec object from a template', 'authoring (phase 3)'],
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
