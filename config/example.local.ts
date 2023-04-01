import { LocalConfig } from './index';

export default {
  backend: 'localhost:3030', // The URL your backend is hosted on. Example: localhost:3030
  uri: 'localhost:5173', // The URL the site is hosted on
  ssl: false, // If the site is hosted with HTTPS
} as LocalConfig;
