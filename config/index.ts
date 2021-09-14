import localConfig from './local';

interface Config {
  backend: string,
  isBeta: boolean,
  version: string,
  stableURI: string,
  supportFocus: boolean,
}

export default {
  ...localConfig,
  isBeta: true,
  version: 'beta-2.0',
  stableURI: 'https://busket.bux.at/',
  supportFocus: false,
} as Config;
