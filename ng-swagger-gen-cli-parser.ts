import { ArgumentParser, SubParser } from 'argparse';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

import { Configuration, execute, Operation } from './ng-swagger-gen-cli-executor';

const parseJSON = (file: any): any => JSON.parse(readFileSync(file, 'utf8'));

interface BaseOptions {
  configurations: Configuration[];
}

const createOperationParser = (subParser: SubParser, operation: Operation): void => {
  const parser = subParser.addParser(operation, { addHelp: true });

  parser.addArgument(['-s', '--selection'], {
    action: 'append',
    dest: 'selection',
    help: 'Selection of services, that should be operated on.',
    required: false,
  });
  parser.addArgument(['-i', '--input'], {
    action: 'store',
    dest: 'config',
    help: 'The ng-swagger-gen-cli configuration file.',
    required: true,
  });
};

export const parse = (): void => {
  const pkg: { version: string } = parseJSON(join(__dirname, 'package.json'));
  const parser = new ArgumentParser({
    addHelp: true,
    description: 'Swagger API client generator CLI for Angular 2+ projects.',
    version: pkg.version,
  });

  const subParser = parser.addSubparsers({ dest: 'operation', title: 'Operation' });
  createOperationParser(subParser, 'generate');
  createOperationParser(subParser, 'update');
  createOperationParser(subParser, 'local-update');

  const args: {
    config: string;
    operation: Operation;
    selection: string[] | undefined;
  } = parser.parseArgs();

  if (existsSync(args.config)) {
    const baseOptions: BaseOptions = parseJSON(args.config);

    execute({ configurations: baseOptions.configurations, operation: args.operation, selection: args.selection });
  } else {
    parser.parseArgs(['--help']);
  }
};
