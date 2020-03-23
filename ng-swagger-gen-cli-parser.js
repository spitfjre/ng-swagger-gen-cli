'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var argparse_1 = require('argparse');
var fs_1 = require('fs');
var path_1 = require('path');
var ng_swagger_gen_cli_executor_1 = require('./ng-swagger-gen-cli-executor');
var parseJSON = function (file) {
  return JSON.parse(fs_1.readFileSync(file, 'utf8'));
};
exports.createGenerateParser = function (subParser) {
  var generateParser = subParser.addParser('generate', { addHelp: true });
  generateParser.addArgument(['-s', '--selection'], {
    action: 'append',
    dest: 'selection',
    help: 'Selection of services, that should be operated on.',
    required: false,
  });
  generateParser.addArgument(['-i', '--input'], {
    action: 'store',
    dest: 'config',
    help: 'The ng-swagger-gen-cli configuration file.',
    required: true,
  });
};
exports.createUpdateParser = function (subParser) {
  var updateParser = subParser.addParser('update', { addHelp: true });
  updateParser.addArgument(['-s', '--selection'], {
    action: 'append',
    dest: 'selection',
    help: 'Selection of services, that should be operated on.',
    required: false,
  });
  updateParser.addArgument(['-i', '--input'], {
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
  exports.createGenerateParser(subParser);
  exports.createUpdateParser(subParser);
  var args = parser.parseArgs();
  if (fs_1.existsSync(args.config)) {
    var baseOptions = parseJSON(args.config);
    var configurations = baseOptions.configurations.map(function (configuration) {
      return {
        name: configuration.name,
        swaggerGen: configuration.swaggerGen,
        url: configuration.defaultUrl,
      };
    });
    ng_swagger_gen_cli_executor_1.execute({
      configurations: configurations,
      operation: args.operation,
      selection: !!args.selection ? args.selection : undefined,
    });
  } else {
    parser.parseArgs(['--help']);
  }
};
