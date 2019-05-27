import { ArgumentParser } from 'argparse';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

import { Configuration, execute, Operation } from './ng-swagger-gen-cli-executor';

const parseJSON = (file: any): any => JSON.parse(readFileSync(file, 'utf8'));

const BRANCH_REPLACEMENT_TOKEN = '$BRANCH_NAME';

const getDesiredUrl = (
  configuration: BaseConfiguration,
  branchName?: string,
  branchNameMappings?: BranchNameMapping[],
): string => {
  if (branchName && configuration.urlBranchBase) {
    if (branchNameMappings) {
      const matchedMapping: BranchNameMapping | undefined = branchNameMappings.find(
        (mapping: BranchNameMapping) => branchName === mapping.provide,
      );

      return configuration.urlBranchBase.replace(
        BRANCH_REPLACEMENT_TOKEN,
        matchedMapping ? matchedMapping.replace : branchName,
      );
    } else {
      return configuration.urlBranchBase.replace(BRANCH_REPLACEMENT_TOKEN, branchName);
    }
  } else {
    return configuration.defaultUrl;
  }
};

interface BaseOptions {
  branchNameMappings?: BranchNameMapping[];
  configurations: BaseConfiguration[];
}

interface BranchNameMapping {
  provide: string;
  replace: string;
}

interface BaseConfiguration {
  defaultUrl: string;
  name: string;
  swaggerGen: string;
  urlBranchBase?: string;
}

export const parse = (): void => {
  const pkg: { version: string } = parseJSON(join(__dirname, 'package.json'));

  const argParser = new ArgumentParser({
    addHelp: true,
    description: 'Swagger API client generator CLI for Angular 2+ projects.',
    version: pkg.version,
  });
  argParser.addArgument(['-b', '--branch'], {
    action: 'store',
    dest: 'branchName',
    help: 'The remote branch name to operate against.',
    required: false,
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

  const args: {
    branchName?: string;
    config: string;
    operation: Operation;
    selection: string[] | null;
  } = argParser.parseArgs();

  if (existsSync(args.config)) {
    const baseOptions: BaseOptions = parseJSON(args.config);
    const configurations: Configuration[] = baseOptions.configurations.map((configuration: BaseConfiguration) => ({
      name: configuration.name,
      swaggerGen: configuration.swaggerGen,
      url: getDesiredUrl(configuration, args.branchName, baseOptions.branchNameMappings),
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
