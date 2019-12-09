import { ArgumentParser } from 'argparse';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

import { Configuration, execute, Operation } from './ng-swagger-gen-cli-executor';

const parseJSON = (file: any): any => JSON.parse(readFileSync(file, 'utf8'));

interface BaseOptions {
  configurations: BaseConfiguration[];
  defaultLocalUrl: string;
}

interface BaseConfiguration {
  defaultUrl: string;
  name: string;
  swaggerGen: string;
}

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
  argParser.addArgument(['-l', '--local'], {
    action: 'storeTrue',
    dest: 'local',
    help: 'Indicator if configuration url or local url should be used.',
    required: false,
  });

  const args: {
    config: string;
    local: boolean | null;
    operation: Operation;
    selection: string[] | null;
  } = argParser.parseArgs();

  if (existsSync(args.config)) {
    const baseOptions: BaseOptions = parseJSON(args.config);
    const configurations: Configuration[] = baseOptions.configurations.map((configuration: BaseConfiguration) => ({
      name: configuration.name,
      swaggerGen: configuration.swaggerGen,
      url: args.local === true ? baseOptions.defaultLocalUrl : configuration.defaultUrl,
    }));

    execute({
      configurations: configurations,
      operation: args.operation,
      selection: !!args.selection ? args.selection : undefined,
    });
  } else {
    argParser.parseArgs(['--help']);
  }
};
