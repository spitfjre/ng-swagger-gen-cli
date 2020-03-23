import execa from 'execa';
import { readFileSync, writeFileSync } from 'fs';
import got from 'got';
import listr from 'listr';

export interface Configuration {
  name: string;
  swaggerGen: string;
  url: string;
}

export type Operation = 'generate' | 'update';

export interface Options {
  configurations: Configuration[];
  operation: Operation;
  selection?: string[];
}

const generate = (apis: Configuration[]): void => {
  const tasks = new listr(
    apis.map((api: Configuration) => ({
      title: `Generate ${api.name}`,
      task: () => execa('./node_modules/.bin/ng-swagger-gen', ['-c', api.swaggerGen]).then(),
    })),
    { concurrent: false, exitOnError: false },
  );

  tasks.run().then(
    () => {},
    () => process.exit(1),
  );
};

const update = (apis: Configuration[]): void => {
  const tasks = new listr(
    apis.map((api: Configuration) => ({
      title: `Update ${api.name}`,
      task: () =>
        new listr(
          [
            {
              title: 'Fetch swagger json',
              task: () =>
                got(api.url).then((data: any) => {
                  const currentSwaggerGenJson = readFileSync(api.swaggerGen, 'utf8');
                  const swaggerPath = JSON.parse(currentSwaggerGenJson).swagger;
                  writeFileSync(swaggerPath, data.body);
                }),
            },
            {
              title: 'Generating classes',
              task: () => execa('./node_modules/.bin/ng-swagger-gen', ['-c', api.swaggerGen]).then(),
            },
          ],
          { concurrent: false, exitOnError: true },
        ),
    })),
    { concurrent: false, exitOnError: false },
  );

  tasks.run().then(
    () => {},
    () => process.exit(1),
  );
};

const executeOperation = (operation: Operation, configurations: Configuration[]): void => {
  switch (operation) {
    case 'generate':
      generate(configurations);
      break;
    case 'update':
      update(configurations);
      break;
    default:
      console.error('No valid operation was specified');
      process.exit(1);
  }
};

export const execute = (options: Options): void => {
  if (!options.configurations || options.configurations.length === 0) {
    console.error('Configurations not specified');
    process.exit(1);
  }

  if (!options.operation) {
    console.error('No operation was specified');
    process.exit(1);
  }

  if (options.selection !== undefined) {
    const filteredConfigurations: Configuration[] = options.configurations.filter(
      (configuration: Configuration) => (options.selection as string[]).indexOf(configuration.name) !== -1,
    );

    if (filteredConfigurations.length === 0) {
      console.error('No selected services were specified');
      process.exit(1);
    } else {
      executeOperation(options.operation, filteredConfigurations);
    }
  } else {
    executeOperation(options.operation, options.configurations);
  }
};
