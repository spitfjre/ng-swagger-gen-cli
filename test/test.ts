import { readFileSync } from 'fs';

// tslint:disable-next-line:no-require-imports
const subset = require('json-subset');

const test = (): void => {
  const currentJson = readFileSync('./swagger_v1.0.json', 'utf8');
  const latestJson = readFileSync('./swagger_v1.1.json', 'utf8');
  const nextJson = readFileSync('./swagger_v1.2.json', 'utf8');

  const currentObject: any = JSON.parse(currentJson);
  const latestObject: any = JSON.parse(latestJson);
  const nextObject: any = JSON.parse(nextJson);

  const currentIsSubsetOfLatest: boolean =
    subset(currentObject.paths, latestObject.paths) && subset(currentObject.definitions, latestObject.definitions);
  const currentIsSubsetOfNext: boolean =
    subset(currentObject.paths, nextObject.paths) && subset(currentObject.definitions, nextObject.definitions);

  console.log('should be true: ', currentIsSubsetOfLatest);
  console.log('should be false: ', currentIsSubsetOfNext);
};

test();
