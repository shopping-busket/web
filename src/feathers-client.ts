import io from 'socket.io-client';
import socketio from '@feathersjs/socketio-client';
import { feathers, FeathersService, Params } from '@feathersjs/feathers';
import auth from '@feathersjs/authentication-client';
import config from '../config';

const socket = io(config.backend, { transports: ['websocket'] });

type ShareLinkData = {
  shareLink: string,
  user: string,
};

type ServiceTypes = {
  'share-link': FeathersService,
  event: FeathersService,
  list: FeathersService,
  users: FeathersService,
}

const feathersClient = feathers<ServiceTypes>();

feathersClient.configure(socketio(socket, { timeout: 30000 }));
feathersClient.configure(auth());

export interface User {
  createdAt: string;
  updatedAt: string;
  id: number;
  uuid: string;
  email: string;
  fullName: string;

  prefersDarkMode: boolean;
  prefersMiniDrawer: boolean;
  preferredLanguage: string;

  avatarURI: string | null;
  githubId: number | null;
  googleId: number | null;
}

export interface AuthObject {
  user: User;
}

export interface FeathersError {
  code: number,
  data: Record<string, unknown>,
}

export enum Service {
  EVENT = 'event',
  LIST = 'list',
  USERS = 'users',
  SHARE_LINK = 'share-link',
}

export async function isLoggedIn(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    if (!feathersClient.authentication.authenticated) {
      feathersClient.authenticate()
        .then(() => resolve(true))
        .catch(() => resolve(false));
    }
  });
}

export default feathersClient;
