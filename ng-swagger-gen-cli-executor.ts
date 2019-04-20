import chalk from 'chalk';
import execa from 'execa';
import listr from 'listr';
import md5 from 'md5';
import requestPromise from 'request-promise-native';
import { readFileSync, writeFileSync } from 'fs';

export interface Options {
  configurations: any;
  operation: Operation;
  selection?: string[];
}

export type Operation = 'compare' | 'generate' | 'update';

export interface Configuration {
  name: string;
  swaggerGen: string;
  url: string;
}

/**
 * Main generate function
 */
export function execute(options: Options): void {
  if (!options.configurations || options.configurations.leading === 0) {
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
}

function executeOperation(operation: Operation, configurations: Configuration[]): void {
  switch (operation) {
    case 'compare':
      compare(configurations);
      break;
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
}

function compare(apis: Configuration[]): void {
  const checkedApis: boolean[] = [];

  const tasks = new listr(
    apis.map((api) => ({
      title: `Check ${api.name}`,
      task: () =>
        new listr(
          [
            {
              title: 'Fetch and compare swagger json',
              task: () =>
                requestPromise(api.url).then((data: any) => {
                  const currentSwaggerGenJson = readFileSync(api.swaggerGen, 'utf8');
                  const swaggerPath: string = JSON.parse(currentSwaggerGenJson).swagger;
                  const currentJson = readFileSync(swaggerPath, 'utf8');

                  const currentHash = md5(currentJson);
                  const fetchedHash = md5(data);

                  checkedApis.push(fetchedHash === currentHash);
                }),
            },
          ],
          { concurrent: false },
        ),
    })),
    { concurrent: false },
  );

  tasks
    .run()
    .then(() => {
      const filteredApis = checkedApis
        .map((result: boolean, index: number) => (!result ? apis[index] : null))
        .filter((api: Configuration | null) => api !== null)
        .map((api: Configuration | null) => api as Configuration);

      if (filteredApis.length === 0) {
        console.log(`\nAll (requested) services are in sync.`);
      } else {
        console.log(
          `\nThe services ${filteredApis.map((api) => chalk.blue.bold(api.name)).join(' ')} are out of sync!\n`,
        );

        filteredApis.forEach((api) => {
          console.log(`The changes for ${chalk.blue.bold(api.name)} can be checked at ${chalk.green.bold(api.url)}.`);
        });
      }
    })
    .catch((err: Error) => console.error(err));
}

function generate(apis: Configuration[]): void {
  const tasks = new listr(
    apis.map((api) => ({
      title: `Generate ${api.name}`,
      task: () =>
        new listr(
          [
            {
              title: 'Generating classes',
              task: () => execa.stdout('./node_modules/.bin/ng-swagger-gen', ['-c', api.swaggerGen]).then(),
            },
          ],
          { concurrent: false },
        ),
    })),
    { concurrent: false },
  );

  tasks.run().catch((err: Error) => console.error(err));
}

function update(apis: Configuration[]): void {
  const tasks = new listr(
    apis.map((api) => ({
      title: `Update ${api.name}`,
      task: () =>
        new listr(
          [
            {
              title: 'Fetch swagger json',
              task: () =>
                requestPromise(api.url).then((data: any) => {
                  const currentSwaggerGenJson = readFileSync(api.swaggerGen, 'utf8');
                  const swaggerPath = JSON.parse(currentSwaggerGenJson).swagger;
                  writeFileSync(swaggerPath, data);
                }),
            },
            {
              title: 'Generating classes',
              task: () => execa.stdout('./node_modules/.bin/ng-swagger-gen', ['-c', api.swaggerGen]).then(),
            },
          ],
          { concurrent: false },
        ),
    })),
    { concurrent: false },
  );

  tasks.run().catch((err: Error) => console.error(err));
}
