import chalk from 'chalk';
import execa from 'execa';
import { readFileSync, writeFileSync } from 'fs';
import listr from 'listr';
import md5 from 'md5';
import requestPromise from 'request-promise-native';

export interface Configuration {
  name: string;
  swaggerGen: string;
  url: string;
}

export type Operation = 'compare' | 'generate' | 'update';

export interface Options {
  configurations: Configuration[];
  operation: Operation;
  selection?: string[];
}

const presentCompareResult = (apis: Configuration[], checkedApis: any): void => {
  const filteredApis = Object.entries(checkedApis)
    .map((entry: [string, any]) => apis.find((api: Configuration) => api.name === entry[0] && entry[1] === false))
    .filter((api: Configuration | undefined) => api !== undefined)
    .map((api: Configuration | undefined) => api as Configuration);

  if (filteredApis.length === 0) {
    console.log(`\nAll (requested) services are in sync.`);
  } else {
    console.log(
      `\nThe services ${filteredApis
        .map((api: Configuration) => chalk.blue.bold(api.name))
        .join(' ')} are out of sync!\n`,
    );

    filteredApis.forEach((api: Configuration) => {
      console.log(`The changes for ${chalk.blue.bold(api.name)} can be checked at ${chalk.green.bold(api.url)}.`);
    });
  }
};

const compare = (apis: Configuration[]): void => {
  const checkedApis: any = {};

  const tasks = new listr(
    apis.map((api: Configuration) => ({
      title: `Compare ${api.name}`,
      task: () =>
        requestPromise(api.url).then((data: any) => {
          const currentSwaggerGenJson = readFileSync(api.swaggerGen, 'utf8');
          const swaggerPath: string = JSON.parse(currentSwaggerGenJson).swagger;
          const currentJson = readFileSync(swaggerPath, 'utf8');

          const currentHash = md5(currentJson);
          const fetchedHash = md5(data);

          checkedApis[api.name] = fetchedHash === currentHash;
        }),
    })),
    { concurrent: false, exitOnError: false },
  );

  tasks.run().then(() => presentCompareResult(apis, checkedApis), () => presentCompareResult(apis, checkedApis));
};

const generate = (apis: Configuration[]): void => {
  const tasks = new listr(
    apis.map((api: Configuration) => ({
      title: `Generate ${api.name}`,
      task: () => execa.stdout('./node_modules/.bin/ng-swagger-gen', ['-c', api.swaggerGen]).then(),
    })),
    { concurrent: false, exitOnError: false },
  );

  tasks.run().then(() => {}, () => {});
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
          { concurrent: false, exitOnError: true },
        ),
    })),
    { concurrent: false, exitOnError: false },
  );

  tasks.run().then(() => {}, () => {});
};

const executeOperation = (operation: Operation, configurations: Configuration[]): void => {
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
