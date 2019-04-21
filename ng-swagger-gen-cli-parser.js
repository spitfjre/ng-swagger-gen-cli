"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var argparse_1 = require("argparse");
var fs_1 = require("fs");
var path_1 = require("path");
var ng_swagger_gen_cli_executor_1 = require("./ng-swagger-gen-cli-executor");
var parseJSON = function (file) { return JSON.parse(fs_1.readFileSync(file, 'utf8')); };
exports.parse = function () {
    var pkg = parseJSON(path_1.join(__dirname, 'package.json'));
    var argParser = new argparse_1.ArgumentParser({
        addHelp: true,
        description: 'Swagger API client generator CLI for Angular 2+ projects.',
        version: pkg.version,
    });
    argParser.addArgument(['-i', '--input'], {
        action: 'store',
        dest: 'config',
        help: 'The ng-swagger-gen-cli configuration file.',
        required: true,
    });
    argParser.addArgument(['-o', '--operation'], {
        action: 'store',
        choices: ['compare', 'generate', 'update'],
        dest: 'operation',
        help: 'Desired operation that should be executed.',
        required: true,
    });
    argParser.addArgument(['-s', '--selection'], {
        action: 'append',
        dest: 'selection',
        help: 'Selection of services, that should be operated on.',
        required: false,
    });
    var args = argParser.parseArgs();
    if (fs_1.existsSync(args.config)) {
        var parsedConfig = parseJSON(args.config);
        ng_swagger_gen_cli_executor_1.execute({
            configurations: parsedConfig.configurations,
            operation: args.operation,
            selection: !!args.selection ? args.selection : undefined,
        });
    }
    else {
        argParser.parseArgs(['--help']);
    }
};
