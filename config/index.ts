interface Config {
  backend: string,
  isBeta: boolean,
  version: string,
}

const config: Config = {
  backend: 'http://192.168.4.48:3030',
  isBeta: true,
  version: '1.0',
};

export default config;
