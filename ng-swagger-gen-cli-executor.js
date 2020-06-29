"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var execa_1 = __importDefault(require("execa"));
var fs_1 = require("fs");
var got_1 = __importDefault(require("got"));
var listr_1 = __importDefault(require("listr"));
var generate = function (apis) {
    var tasks = new listr_1.default(apis.map(function (api) { return ({
        title: "Generate " + api.name,
        task: function () { return execa_1.default('./node_modules/.bin/ng-swagger-gen', ['-c', api.swaggerGen]).then(); },
    }); }), { concurrent: false, exitOnError: false });
    tasks.run().then(function () { }, function () { return process.exit(1); });
};
var update = function (apis, local) {
    var tasks = new listr_1.default(apis.map(function (api) { return ({
        title: "Update " + api.name,
        task: function () {
            return new listr_1.default([
                {
                    title: 'Fetch swagger json',
                    task: function () {
                        return got_1.default(local ? api.defaultLocalUrl : api.defaultUrl).then(function (data) {
                            var currentSwaggerGenJson = fs_1.readFileSync(api.swaggerGen, 'utf8');
                            var swaggerPath = JSON.parse(currentSwaggerGenJson).swagger;
                            fs_1.writeFileSync(swaggerPath, data.body);
                        });
                    },
                },
                {
                    title: 'Generating classes',
                    task: function () { return execa_1.default('./node_modules/.bin/ng-swagger-gen', ['-c', api.swaggerGen]).then(); },
                },
            ], { concurrent: false, exitOnError: true });
        },
    }); }), { concurrent: false, exitOnError: false });
    tasks.run().then(function () { }, function () { return process.exit(1); });
};
var executeOperation = function (operation, configurations) {
    switch (operation) {
        case 'generate':
            generate(configurations);
            break;
        case 'update':
            update(configurations, false);
            break;
        case 'local-update':
            update(configurations, true);
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
    if (options.selection) {
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
