"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var chalk_1 = __importDefault(require("chalk"));
var execa_1 = __importDefault(require("execa"));
var listr_1 = __importDefault(require("listr"));
var md5_1 = __importDefault(require("md5"));
var request_promise_native_1 = __importDefault(require("request-promise-native"));
var fs_1 = require("fs");
/**
 * Main generate function
 */
function execute(options) {
    if (!options.configurations || options.configurations.leading === 0) {
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
}
exports.execute = execute;
function executeOperation(operation, configurations) {
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
function compare(apis) {
    var checkedApis = [];
    var tasks = new listr_1.default(apis.map(function (api) { return ({
        title: "Check " + api.name,
        task: function () {
            return new listr_1.default([
                {
                    title: 'Fetch and compare swagger json',
                    task: function () {
                        return request_promise_native_1.default(api.url).then(function (data) {
                            var currentSwaggerGenJson = fs_1.readFileSync(api.swaggerGen, 'utf8');
                            var swaggerPath = JSON.parse(currentSwaggerGenJson).swagger;
                            var currentJson = fs_1.readFileSync(swaggerPath, 'utf8');
                            var currentHash = md5_1.default(currentJson);
                            var fetchedHash = md5_1.default(data);
                            checkedApis.push(fetchedHash === currentHash);
                        });
                    },
                },
            ], { concurrent: false });
        },
    }); }), { concurrent: false });
    tasks
        .run()
        .then(function () {
        var filteredApis = checkedApis
            .map(function (result, index) { return (!result ? apis[index] : null); })
            .filter(function (api) { return api !== null; })
            .map(function (api) { return api; });
        if (filteredApis.length === 0) {
            console.log("\nAll (requested) services are in sync.");
        }
        else {
            console.log("\nThe services " + filteredApis.map(function (api) { return chalk_1.default.blue.bold(api.name); }).join(' ') + " are out of sync!\n");
            filteredApis.forEach(function (api) {
                console.log("The changes for " + chalk_1.default.blue.bold(api.name) + " can be checked at " + chalk_1.default.green.bold(api.url) + ".");
            });
        }
    })
        .catch(function (err) { return console.error(err); });
}
function generate(apis) {
    var tasks = new listr_1.default(apis.map(function (api) { return ({
        title: "Generate " + api.name,
        task: function () {
            return new listr_1.default([
                {
                    title: 'Generating classes',
                    task: function () { return execa_1.default.stdout('./node_modules/.bin/ng-swagger-gen', ['-c', api.swaggerGen]).then(); },
                },
            ], { concurrent: false });
        },
    }); }), { concurrent: false });
    tasks.run().catch(function (err) { return console.error(err); });
}
function update(apis) {
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
            ], { concurrent: false });
        },
    }); }), { concurrent: false });
    tasks.run().catch(function (err) { return console.error(err); });
}
