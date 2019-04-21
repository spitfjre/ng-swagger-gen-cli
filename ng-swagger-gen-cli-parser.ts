import { ArgumentParser } from 'argparse';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

import { Configuration, execute, Operation } from './ng-swagger-gen-cli-executor';

const parseJSON = (file: any): any => JSON.parse(readFileSync(file, 'utf8'));

export const parse = (): void => {
  const pkg: { version: string } = parseJSON(join(__dirname, 'package.json'));

  const argParser = new ArgumentParser({
    addHelp: true,
    description: 'Swagger API client generator CLI for Angular 2+ projects.',
    version: pkg.version,
  });
  argParser.addArgument(['-i', '--input'], {
    action: 'store',
    dest: 'config',
    help: 'The ng-swagger-gen-cli configuration file.',
    required: true,
  });
  argParser.addArgument(['-o', '--operation'], {
    action: 'store',
    choices: ['compare', 'generate', 'update'],
    dest: 'operation',
    help: 'Desired operation that should be executed.',
    required: true,
  });
  argParser.addArgument(['-s', '--selection'], {
    action: 'append',
    dest: 'selection',
    help: 'Selection of services, that should be operated on.',
    required: false,
  });

  const args: { config: string; operation: Operation; selection: string[] | null } = argParser.parseArgs();

  if (existsSync(args.config)) {
    const parsedConfig: { configurations: Configuration[] } = parseJSON(args.config);

    execute({
      configurations: parsedConfig.configurations,
      operation: args.operation,
      selection: !!args.selection ? args.selection : undefined,
    });
  } else {
    argParser.parseArgs(['--help']);
  }
};
