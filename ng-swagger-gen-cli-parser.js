"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var argparse_1 = require("argparse");
var fs_1 = require("fs");
var path_1 = require("path");
var ng_swagger_gen_cli_executor_1 = require("./ng-swagger-gen-cli-executor");
var parseJSON = function (file) { return JSON.parse(fs_1.readFileSync(file, 'utf8')); };
var createOperationParser = function (subParser, operation) {
    var parser = subParser.addParser(operation, { addHelp: true });
    parser.addArgument(['-s', '--selection'], {
        action: 'append',
        dest: 'selection',
        help: 'Selection of services, that should be operated on.',
        required: false,
    });
    parser.addArgument(['-i', '--input'], {
        action: 'store',
        dest: 'config',
        help: 'The ng-swagger-gen-cli configuration file.',
        required: true,
    });
};
exports.parse = function () {
    var pkg = parseJSON(path_1.join(__dirname, 'package.json'));
    var parser = new argparse_1.ArgumentParser({
        addHelp: true,
        description: 'Swagger API client generator CLI for Angular 2+ projects.',
        version: pkg.version,
    });
    var subParser = parser.addSubparsers({ dest: 'operation', title: 'Operation' });
    createOperationParser(subParser, 'generate');
    createOperationParser(subParser, 'update');
    createOperationParser(subParser, 'local-update');
    var args = parser.parseArgs();
    if (fs_1.existsSync(args.config)) {
        var baseOptions = parseJSON(args.config);
        ng_swagger_gen_cli_executor_1.execute({ configurations: baseOptions.configurations, operation: args.operation, selection: args.selection });
    }
    else {
        parser.parseArgs(['--help']);
    }
};
