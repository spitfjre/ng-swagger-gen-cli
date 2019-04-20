"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var argparse_1 = require("argparse");
var ng_swagger_gen_cli_executor_1 = require("./ng-swagger-gen-cli-executor");
var path_1 = require("path");
var fs_1 = require("fs");
function parse() {
    var pkg = parseJSON(path_1.join(__dirname, 'package.json'));
    var argParser = new argparse_1.ArgumentParser({
        addHelp: true,
        description: 'Swagger API client generator CLI for Angular 2+ projects.',
        version: pkg.version,
    });
    argParser.addArgument(['-i', '--input'], {
        action: 'store',
        dest: 'config',
        help: 'The swagger-gen CLI configuration file.',
    });
    argParser.addArgument(['-o', '--operation'], {
        action: 'store',
        choices: ['compare', 'generate', 'update'],
        dest: 'operation',
        help: 'Desired operation that should be executed.',
    });
    argParser.addArgument(['-s', '--selection'], {
        action: 'append',
        dest: 'selection',
        help: 'Selection of services, that should be operated on.',
    });
    var args = argParser.parseArgs();
    if (fs_1.existsSync(args.config)) {
        var parsedConfig = parseJSON(args.config);
        run({
            configurations: parsedConfig.configurations,
            operation: args.operation,
            selection: !!args.selection ? args.selection : undefined,
        });
    }
    else {
        argParser.parseArgs(['--help']);
    }
}
exports.parse = parse;
function parseJSON(file) {
    return JSON.parse(fs_1.readFileSync(file, 'utf8'));
}
function run(options) {
    ng_swagger_gen_cli_executor_1.execute(options);
}
