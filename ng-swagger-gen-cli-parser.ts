import { ArgumentParser, SubParser } from 'argparse';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

import { Configuration, execute, Operation } from './ng-swagger-gen-cli-executor';

const parseJSON = (file: any): any => JSON.parse(readFileSync(file, 'utf8'));

interface BaseOptions {
  configurations: BaseConfiguration[];
}

interface BaseConfiguration {
  defaultUrl: string;
  name: string;
  swaggerGen: string;
}

export const createGenerateParser = (subParser: SubParser): void => {
  const generateParser = subParser.addParser('generate', { addHelp: true });

  generateParser.addArgument(['-s', '--selection'], {
    action: 'append',
    dest: 'selection',
    help: 'Selection of services, that should be operated on.',
    required: false,
  });
  generateParser.addArgument(['-i', '--input'], {
    action: 'store',
    dest: 'config',
    help: 'The ng-swagger-gen-cli configuration file.',
    required: true,
  });
};

export const createUpdateParser = (subParser: SubParser): void => {
  const updateParser = subParser.addParser('update', { addHelp: true });

  updateParser.addArgument(['-s', '--selection'], {
    action: 'append',
    dest: 'selection',
    help: 'Selection of services, that should be operated on.',
    required: false,
  });
  updateParser.addArgument(['-i', '--input'], {
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
  createGenerateParser(subParser);
  createUpdateParser(subParser);

  const args: {
    config: string;
    operation: Operation;
    selection: string[] | null;
  } = parser.parseArgs();

  if (existsSync(args.config)) {
    const baseOptions: BaseOptions = parseJSON(args.config);
    const configurations: Configuration[] = baseOptions.configurations.map((configuration: BaseConfiguration) => ({
      name: configuration.name,
      swaggerGen: configuration.swaggerGen,
      url: configuration.defaultUrl,
    }));

    execute({
      configurations: configurations,
      operation: args.operation,
      selection: !!args.selection ? args.selection : undefined,
    });
  } else {
    parser.parseArgs(['--help']);
  }
};
