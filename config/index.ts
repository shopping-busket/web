interface Config {
  backend: string,
  isBeta: boolean,
  version: string,
  stableURI: string,
  supportFocus: boolean,
}

const config: Config = {
  backend: 'http://192.168.4.48:3030',
  isBeta: true,
  version: 'beta-2.0',
  stableURI: 'https://busket.bux.at/',
  supportFocus: false,
};

export default config;
