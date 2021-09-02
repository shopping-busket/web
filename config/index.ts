interface Config {
  backend: string,
  isBeta: boolean,
  version: string,
  stableURI: string,
  supportFocus: boolean,
}

const config: Config = {
  backend: process.env.BACKEND_URL,
  isBeta: true,
  version: 'beta-2.0',
  stableURI: 'https://busket.bux.at/',
  supportFocus: false,
};

export default config;
