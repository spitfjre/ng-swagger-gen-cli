import { ArgumentParser } from 'argparse';
import { Configuration, execute, Operation, Options } from './ng-swagger-gen-cli-executor';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';

export function parse(): void {
  const pkg: { version: string } = parseJSON(join(__dirname, 'package.json'));

  const argParser = new ArgumentParser({
    addHelp: true,
    description: 'Swagger API client generator CLI for Angular 2+ projects.',
    version: pkg.version,
  });
  argParser.addArgument(['-i', '--input'], {
    action: 'store',
    dest: 'config',
    help: 'The swagger-gen CLI configuration file.',
  });
  argParser.addArgument(['-o', '--operation'], {
    action: 'store',
    choices: ['compare', 'generate', 'update'],
    dest: 'operation',
    help: 'Desired operation that should be executed.',
  });

  const args: { config: string; operation: Operation } = argParser.parseArgs();

  if (existsSync(args.config)) {
    const parsedConfig: { configurations: Configuration[] } = parseJSON(args.config);

    run({ configurations: parsedConfig.configurations, operation: args.operation });
  } else {
    argParser.parseArgs(['--help']);
  }
}

function parseJSON(file: any): any {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function run(options: Options) {
  execute(options);
}
