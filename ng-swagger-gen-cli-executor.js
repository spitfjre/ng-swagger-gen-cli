"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var chalk_1 = __importDefault(require("chalk"));
var execa_1 = __importDefault(require("execa"));
var fs_1 = require("fs");
var listr_1 = __importDefault(require("listr"));
var request_promise_native_1 = __importDefault(require("request-promise-native"));
// tslint:disable-next-line:no-require-imports
var subset = require('json-subset');
var findApi = function (apis, differentApi) {
    var foundApi = apis.find(function (api) { return api.name === differentApi.apiName; });
    return [foundApi, differentApi];
};
var presentCompareResult = function (apis, differentApis) {
    var filteredApis = differentApis
        .map(function (differentApi) { return findApi(apis, differentApi); })
        .filter(function (_a) {
        var api = _a[0];
        return api !== undefined;
    })
        .map(function (filteredApi) { return filteredApi; });
    if (filteredApis.length === 0) {
        console.log("\nAll (requested) services are in sync.");
    }
    else {
        console.log('');
        filteredApis.forEach(function (_a) {
            var api = _a[0], compareResult = _a[1];
            var apiName = chalk_1.default.blue.bold(api.name);
            var apiUrl = chalk_1.default.green.bold(api.url);
            var currentVersion = chalk_1.default.red.bold(compareResult.currentVersion);
            var latestVersion = chalk_1.default.red.bold(compareResult.latestVersion);
            console.log(apiName + "@" + apiUrl + " changed (" + currentVersion + "->" + latestVersion + ")");
        });
        var allUpdateCommand = chalk_1.default.yellow.bold('../node_modules/.bin/ng-swagger-gen-cli -i ng-swagger-gen-cli.json -o update');
        var apiNameParameters = filteredApis
            .map(function (_a) {
            var api = _a[0];
            return api.name;
        })
            .map(function (apiName) { return "-s " + apiName; })
            .join(' ');
        var specificUpdateCommand = chalk_1.default.yellow.bold("../node_modules/.bin/ng-swagger-gen-cli -i ng-swagger-gen-cli.json -o update " + apiNameParameters);
        console.log("\nPlease run " + allUpdateCommand + " to update all services");
        console.log("or");
        console.log("run " + specificUpdateCommand + " to update only changed services.\n");
        process.exit(1);
    }
};
var compare = function (apis) {
    var differentApis = [];
    var tasks = new listr_1.default(apis.map(function (api) { return ({
        title: "Compare " + api.name,
        task: function () {
            return request_promise_native_1.default(api.url).then(function (data) {
                var currentSwaggerGenJson = fs_1.readFileSync(api.swaggerGen, 'utf8');
                var swaggerPath = JSON.parse(currentSwaggerGenJson).swagger;
                var currentJson = fs_1.readFileSync(swaggerPath, 'utf8');
                var currentObject = JSON.parse(currentJson);
                var latestObject = JSON.parse(data);
                var currentIsSubsetOfLatest = subset(currentObject.paths, latestObject.paths) &&
                    subset(currentObject.definitions, latestObject.definitions);
                if (!currentIsSubsetOfLatest) {
                    differentApis.push({
                        apiName: api.name,
                        currentVersion: currentObject.info.version,
                        latestVersion: latestObject.info.version,
                    });
                }
            });
        },
    }); }), { concurrent: false, exitOnError: false });
    tasks.run().then(function () { return presentCompareResult(apis, differentApis); }, function () {
        presentCompareResult(apis, differentApis);
        process.exit(1);
    });
};
var generate = function (apis) {
    var tasks = new listr_1.default(apis.map(function (api) { return ({
        title: "Generate " + api.name,
        task: function () { return execa_1.default.stdout('./node_modules/.bin/ng-swagger-gen', ['-c', api.swaggerGen]).then(); },
    }); }), { concurrent: false, exitOnError: false });
    tasks.run().then(function () { }, function () {
        process.exit(1);
    });
};
var update = function (apis) {
    var tasks = new listr_1.default(apis.map(function (api) { return ({
        title: "Update " + api.name,
        task: function () {
            return new listr_1.default([
                {
                    title: 'Fetch swagger json',
                    task: function () {
                        return request_promise_native_1.default(api.url).then(function (data) {
                            var currentSwaggerGenJson = fs_1.readFileSync(api.swaggerGen, 'utf8');
                            var swaggerPath = JSON.parse(currentSwaggerGenJson).swagger;
                            fs_1.writeFileSync(swaggerPath, data);
                        });
                    },
                },
                {
                    title: 'Generating classes',
                    task: function () { return execa_1.default.stdout('./node_modules/.bin/ng-swagger-gen', ['-c', api.swaggerGen]).then(); },
                },
            ], { concurrent: false, exitOnError: true });
        },
    }); }), { concurrent: false, exitOnError: false });
    tasks.run().then(function () { }, function () {
        process.exit(1);
    });
};
var executeOperation = function (operation, configurations) {
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
exports.execute = function (options) {
    if (!options.configurations || options.configurations.length === 0) {
        console.error('Configurations not specified');
        process.exit(1);
    }
    if (!options.operation) {
        console.error('No operation was specified');
        process.exit(1);
    }
    if (options.selection !== undefined) {
        var filteredConfigurations = options.configurations.filter(function (configuration) { return options.selection.indexOf(configuration.name) !== -1; });
        if (filteredConfigurations.length === 0) {
            console.error('No selected services were specified');
            process.exit(1);
        }
        else {
            executeOperation(options.operation, filteredConfigurations);
        }
    }
    else {
        executeOperation(options.operation, options.configurations);
    }
};
