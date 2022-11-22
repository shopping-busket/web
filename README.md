# busket web

## Project setup

First of, clone the project: `git clone https://github.com/shopping-busket/web.git`. Then be sure to install all the
node_modules using `npm i`. Now you just have to set up the local config file. `cd` into the directory of the project,
then go to the `config` folder, make a file called `local.ts` and paste the below code inside it:
```ts
export default {
  backend: '<backend url>', // The URL your backend is hosted on. Example: localhost:3030
};
```

### Compiles and hot-reloads for development
⚠️When running with Node 17+ you will get an error on build. You have to run `$env:NODE_OPTIONS="--openssl-legacy-provider"`(pwsl) or `export NODE_OPTIONS=--openssl-legacy-provider`(bash) (source: https://bobbyhadz.com/blog/react-error-digital-envelope-routines-unsupported)
```
npm run serve
```

### Compiles and minifies for production

```
npm run build
```

### Lints and fixes files

```
npm run lint
```
