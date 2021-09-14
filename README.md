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
