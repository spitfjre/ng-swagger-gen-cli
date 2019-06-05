## ng-swagger-gen-cli: CLI for ng-swagger-gen

This project is a npm module that provides management operations of api services via [ng-swagger-gen](https://github.com/cyclosproject/ng-swagger-gen).

## How to use it

In your project, run:

```bash
cd <your_angular_app_dir>
npm install ng-swagger-gen-cli --save-dev
node_modules/.bin/ng-swagger-gen-cli -i <path_to_ng_swagger_cli_json> -o operation -s selection -b branchName
```

Where:

- `path_to_ng_swagger_cli_json` is the relative path to the ng-swagger-cli JSON
  file.
- `operation` is the operation that should be executed. There are three operations permitted: `compare`, `generate` and `update`.
- `selection` is an optional argument, that lets you execute operations on a selected service. If your selection contains more than one service, you have to provide the flag multiple times. For example: `-s service1 -s service2`
- `branchName` is an optional argument, that lets you execute operations against services of a given branch.

Please, run the `ng-swagger-gen-cli` with the `--help` argument to view all available command line arguments.

### Supported operations

These are the currently supported operations:

- **compare**: Compares the local swagger descriptor with latest remote one and reports which services are out of sync. This is done via configuration subsets.
- **generate**: Generates the files of the local swagger descriptor via `ng-swagger-gen`.
- **update**: Updates the local swagger descriptor with latest remote one and generates the files of the local swagger descriptor via `ng-swagger-gen`.

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
- `provide` & `replace`: The `branchNameMappings` allow to map angular repository branch names to given remote swagger deployment targets.
- `defaultUrl`: The (default) url endpoint of the swagger descriptor. This is needed for comparing local and remote json files and for updating the local file.
- `name`: The name of the service. This is just needed for reference and does not affect anything else.
- `swaggerGen`: The relative location of the `ng-swagger-gen` configuration file, that describes how the files should be generated for the given service.
- `urlBranchBase`: The (optional) base url endpoint for build branches of the swagger descriptor. This needs to contain the `$BRANCH_NAME` replacement token.

### Configuration file example

The following is an example of a configuration file:

```json
{
  "$schema": "./node_modules/ng-swagger-gen-cli/ng-swagger-gen-cli-schema.json",
  "branchNameMappings": [
    {
      "provide": "master",
      "replace": "staging"
    }
  ],
  "configurations": [
    {
      "defaultUrl": "http://url/to/swagger/v2/api-docs",
      "name": "auth",
      "swaggerGen": "./path/to/ng-swagger-gen/file.json",
      "urlBranchBase": "http://url/to/swagger-$BRANCH_NAME/v2/api-docs"
    }
  ]
}
```

## Setting up a node script

Regardless If your Angular project was generated or is managed by
[Angular CLI](https://cli.angular.io/), or you have started your project with
some other seed (for example, using [webpack](https://webpack.js.org/)
directly), you can setup a scripts.

To do so, create the `ng-swagger-gen-cli.json` configuration file and add the
following `scripts` to your `package.json`:

```json
{
  "scripts": {
    "swagger:compare": "ng-swagger-gen-cli -i ng-swagger-gen-cli.json -o compare",
    "swagger:generate": "ng-swagger-gen-cli -i ng-swagger-gen-cli.json -o generate",
    "swagger:update": "ng-swagger-gen-cli -i ng-swagger-gen-cli.json -o update"
  }
}
```
