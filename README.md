# busket web

## Project setup

First of, clone the project: ``. Then be sure to install all the
node_modules using `yarn i`. Now you just have to set up the local config file. `cd` into the directory of the project,
then go to the `config` folder, create a file called `local.ts` and copy-paste the content of the `local.example.ts`
file into it. Then adjust it to your needs.

* Clone the project using `git clone https://github.com/shopping-busket/web.git`
* Clone the submodule using `git submodule update --init --recursive` from the projects' directory (web)
* Install the dependencies using `yarn`
* Optionally, set yarn to v2 using `yarn set version berry`
* Then run `cp config/example.local.ts config/local.ts` from the projects' directory (web)
* Open `config/local.ts` in your favourite text editor or IDE and edit it to your needs.
* Start VueJS using `yarn serve` or for development mode: `yarn dev`

### Compiles and hot-reloads for development

⚠️When running with Node 17+ you will get an error on build. You have to
run `$env:NODE_OPTIONS="--openssl-legacy-provider"`(pwsl) or `export NODE_OPTIONS=--openssl-legacy-provider`(bash) (
source: https://bobbyhadz.com/blog/react-error-digital-envelope-routines-unsupported)

```
yarn dev
```

### Compiles and minifies for production

```
yarn build
```

### Preview the latest build

```
yarn serve
```

### Lints and fixes files

```
yarn lint
```
