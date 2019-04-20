'use strict';

const chalk = require('chalk');
const execa = require('execa');
const fs = require('fs-extra');
const listr = require('listr');
const md5 = require('md5');
const requestPromise = require('request-promise');

/**
 * Main generate function
 */
function ngSwaggerGenCli(options) {
  if (!options.configurations || options.configurations.leading === 0) {
    console.error('Configurations not specified');
    process.exit(1);
  }

  if (!options.operation) {
    console.error('No operation was specified');
    process.exit(1);
  }

  switch (options.operation) {
    case 'compare':
      compare(options.configurations);
      break;
    case 'generate':
      generate(options.configurations);
      break;
    case 'update':
      update(options.configurations);
      break;
    default:
      console.error('No valid operation was specified');
      process.exit(1);
  }
}

function compare(apis) {
  const checkedApis = [];

  const tasks = new listr(
    apis.map((api) => ({
      title: `Check ${api.name}`,
      task: () =>
        new listr(
          [
            {
              title: 'Fetch and compare swagger json',
              task: () =>
                requestPromise(api.url).then((data) => {
                  const currentSwaggerGenJson = fs.readFileSync(api.swaggerGen, 'utf8');
                  const swaggerPath = JSON.parse(currentSwaggerGenJson).swagger;
                  const currentJson = fs.readFileSync(swaggerPath, 'utf8');

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
        .map((result, index) => (!result ? apis[index] : null))
        .filter((api) => api !== null);

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
    .catch((err) => console.error(err));
}

function generate(apis) {
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

  tasks.run().catch((err) => console.error(err));
}

function update(apis) {
  const tasks = new listr(
    apis.map((api) => ({
      title: `Update ${api.name}`,
      task: () =>
        new listr(
          [
            {
              title: 'Fetch swagger json',
              task: () =>
                requestPromise(api.url).then((data) => {
                  const currentSwaggerGenJson = fs.readFileSync(api.swaggerGen);
                  const swaggerPath = JSON.parse(currentSwaggerGenJson).swagger;
                  fs.writeFileSync(swaggerPath, data);
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

  tasks.run().catch((err) => console.error(err));
}

module.exports = ngSwaggerGenCli;
