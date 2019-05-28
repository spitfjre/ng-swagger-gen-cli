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

interface ApiDifference {
  apiName: string;
  currentVersion: string;
  latestVersion: string;
}

const findApi = (apis: Configuration[], differentApi: ApiDifference): [Configuration | undefined, ApiDifference] => {
  const foundApi: Configuration | undefined = apis.find((api: Configuration) => api.name === differentApi.apiName);
  return [foundApi, differentApi] as [Configuration | undefined, ApiDifference];
};

const presentCompareResult = (apis: Configuration[], differentApis: ApiDifference[]): void => {
  const filteredApis: [Configuration, ApiDifference][] = differentApis
    .map((differentApi: ApiDifference) => findApi(apis, differentApi))
    .filter(([api]: [Configuration | undefined, ApiDifference]) => api !== undefined)
    .map((filteredApi: [Configuration | undefined, ApiDifference]) => filteredApi as [Configuration, ApiDifference]);

  if (filteredApis.length === 0) {
    console.log(`\nAll (requested) services are in sync.`);
  } else {
    console.log('');

    filteredApis.forEach(([api, compareResult]: [Configuration, ApiDifference]) => {
      const apiName: string = chalk.blue.bold(api.name);
      const apiUrl: string = chalk.green.bold(api.url);
      const currentVersion: string = chalk.red.bold(compareResult.currentVersion);
      const latestVersion: string = chalk.red.bold(compareResult.latestVersion);

      console.log(`${apiName}@${apiUrl} changed (${currentVersion}->${latestVersion})`);
    });

    const allUpdateCommand: string = chalk.yellow.bold(
      '../node_modules/.bin/ng-swagger-gen-cli -i ng-swagger-gen-cli.json -o update',
    );
    const apiNameParameters: string = filteredApis
      .map(([api]: [Configuration, ApiDifference]) => api.name)
      .map((apiName: string) => `-s ${apiName}`)
      .join(' ');
    const specificUpdateCommand: string = chalk.yellow.bold(
      `../node_modules/.bin/ng-swagger-gen-cli -i ng-swagger-gen-cli.json -o update ${apiNameParameters}`,
    );

    console.log(`\nPlease run ${allUpdateCommand} to update all services`);
    console.log(`or`);
    console.log(`run ${specificUpdateCommand} to update only changed services.\n`);

    process.exit(1);
  }
};

const compare = (apis: Configuration[]): void => {
  const differentApis: ApiDifference[] = [];

  const tasks = new listr(
    apis.map((api: Configuration) => ({
      title: `Compare ${api.name}`,
      task: () =>
        requestPromise(api.url).then((data: string) => {
          const currentSwaggerGenJson = readFileSync(api.swaggerGen, 'utf8');
          const swaggerPath: string = JSON.parse(currentSwaggerGenJson).swagger;
          const currentJson = readFileSync(swaggerPath, 'utf8');

          const currentHash = md5(currentJson);
          const fetchedHash = md5(data);

          if (fetchedHash !== currentHash) {
            differentApis.push({
              apiName: api.name,
              currentVersion: JSON.parse(currentJson).info.version,
              latestVersion: JSON.parse(data).info.version,
            });
          }
        }),
    })),
    { concurrent: false, exitOnError: false },
  );

  tasks.run().then(
    () => presentCompareResult(apis, differentApis),
    () => {
      presentCompareResult(apis, differentApis);
      process.exit(1);
    },
  );
};

const generate = (apis: Configuration[]): void => {
  const tasks = new listr(
    apis.map((api: Configuration) => ({
      title: `Generate ${api.name}`,
      task: () => execa.stdout('./node_modules/.bin/ng-swagger-gen', ['-c', api.swaggerGen]).then(),
    })),
    { concurrent: false, exitOnError: false },
  );

  tasks.run().then(
    () => {},
    () => {
      process.exit(1);
    },
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

  tasks.run().then(
    () => {},
    () => {
      process.exit(1);
    },
  );
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
