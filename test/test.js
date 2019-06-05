"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
// tslint:disable-next-line:no-require-imports
var subset = require('json-subset');
var test = function () {
    var currentJson = fs_1.readFileSync('./swagger_v1.0.json', 'utf8');
    var latestJson = fs_1.readFileSync('./swagger_v1.1.json', 'utf8');
    var nextJson = fs_1.readFileSync('./swagger_v1.2.json', 'utf8');
    var currentObject = JSON.parse(currentJson);
    var latestObject = JSON.parse(latestJson);
    var nextObject = JSON.parse(nextJson);
    var currentIsSubsetOfLatest = subset(currentObject.paths, latestObject.paths) && subset(currentObject.definitions, latestObject.definitions);
    var currentIsSubsetOfNext = subset(currentObject.paths, nextObject.paths) && subset(currentObject.definitions, nextObject.definitions);
    console.log('should be true: ', currentIsSubsetOfLatest);
    console.log('should be false: ', currentIsSubsetOfNext);
};
test();
