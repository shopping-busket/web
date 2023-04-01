import localConfig from './local';

export interface GlobalConfig {
  isBeta: boolean,
  version: string,
  stableURI: string,
  supportFocus: boolean,
  httpProtocol: string,
}

export interface LocalConfig {
  backend: string,
  uri: string,
  ssl: boolean,
}

export type Config = GlobalConfig & LocalConfig;

export default {
  ...localConfig,
  isBeta: true,
  version: 'beta-2.0',
  stableURI: 'https://busket.bux.at/',
  supportFocus: false,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  httpProtocol: this?.ssl ? 'https' : 'http'
} as Config;
