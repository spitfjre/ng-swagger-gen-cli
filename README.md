## ng-swagger-gen-cli: CLI for ng-swagger-gen [![npm version](https://badge.fury.io/js/ng-swagger-gen-cli.svg)](https://badge.fury.io/js/ng-swagger-gen-cli)

This project is a npm module that provides management operations of api services via [ng-swagger-gen](https://github.com/cyclosproject/ng-swagger-gen).

## How to use it

In your project, run:

```bash
cd <your_angular_app_dir>
npm install ng-swagger-gen-cli --save-dev
node_modules/.bin/ng-swagger-gen-cli OPERATION -i PATH_TO_NG_SWAGGER_CLI_JSON -s SELECTION
```

Where:

- `PATH_TO_NG_SWAGGER_CLI_JSON` is the relative path to the ng-swagger-cli JSON
  file.
- `OPERATION` is the operation that should be executed. There are three operations permitted: `generate`, `update` and `update-local`.
- `SELECTION` is an optional argument, that lets you execute operations on a selected service. If your selection contains more than one service, you have to provide the flag multiple times. For example: `-s service1 -s service2`

Please, run the `ng-swagger-gen-cli` with the `--help` argument to view all available command line arguments.

### Supported operations

These are the currently supported operations:

- **generate**: Generates the files of the local swagger descriptor via `ng-swagger-gen`.
- **update**: Updates the local swagger descriptor with the latest remote one and generates the files of the local swagger descriptor via `ng-swagger-gen`.
- **local-update**: Updates the local swagger descriptor with the latest `local` remote one and generates the files of the local swagger descriptor via `ng-swagger-gen`.

## Configuration file

The api service configuration must be passed with a configuration file. The default configuration
file name is `ng-swagger-cli-gen.json`, and should be placed on the root folder
of your NodeJS project.

An accompanying JSON schema is also available, so the configuration file can be
validated, and IDEs can autocomplete the file. If you have installed and
saved the `ng-swagger-gen-cli` module in your node project, you can use a local copy
of the JSON schema on `./node_modules/ng-swagger-gen-cli/ng-swagger-gen-cli-schema.json`.

### Configuration file reference

The supported properties in the JSON file are:

- `defaultLocalUrl`: The (default) local url endpoint of the swagger descriptor. This is needed for comparing local and remote json files and for updating the local file.
- `defaultUrl`: The (default) url endpoint of the swagger descriptor. This is needed for comparing local and remote json files and for updating the local file.
- `name`: The name of the service. This is just needed for reference and does not affect anything else.
- `swaggerGen`: The relative location of the `ng-swagger-gen` configuration file, that describes how the files should be generated for the given service.

### Configuration file example

The following is an example of a configuration file:

```json
{
  "$schema": "./node_modules/ng-swagger-gen-cli/ng-swagger-gen-cli-schema.json",
  "configurations": [
    {
      "defaultLocalUrl": "http://localhost:8080",
      "defaultUrl": "http://url/to/swagger/v2/api-docs",
      "name": "auth",
      "swaggerGen": "./path/to/ng-swagger-gen/file.json"
    }
  ]
}
```

## Setting up a node script

Regardless if your Angular project was generated or is managed by
[Angular CLI](https://cli.angular.io/), or you have started your project with
some other seed (for example, using [webpack](https://webpack.js.org/)
directly), you can set up a scripts block.

To do so, create the `ng-swagger-gen-cli.json` configuration file and add the
following `scripts` to your `package.json`:

```json
{
  "scripts": {
    "swagger:generate": "ng-swagger-gen-cli generate -i ng-swagger-gen-cli.json",
    "swagger:update": "ng-swagger-gen-cli update -i ng-swagger-gen-cli.json",
    "swagger:update:local": "ng-swagger-gen-cli local-update -i ng-swagger-gen-cli.json"
  }
}
```
