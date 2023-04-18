import io from 'socket.io-client';
import socketio from '@feathersjs/socketio-client';
import { feathers, FeathersService } from '@feathersjs/feathers';
import auth from '@feathersjs/authentication-client';
import config from '../config';

const socket = io(config.backend, { transports: ['websocket'] });

export type Methods = 'create' | 'find' | 'get' | 'update' | 'patch' | 'remove';

export enum Service {
  EVENT = 'api/event',
  LIST = 'api/list',
  LIBRARY = 'api/library',
  USERS = 'api/users',
  WHITELISTED_USERS = 'api/whitelisted-users',
}

type ServiceTypes = Record<Service, FeathersService> & {
  event: FeathersService,
  list: FeathersService,
  library: FeathersService,
  users: FeathersService,
  'whitelisted-users': FeathersService,
}

const feathersClient = feathers<ServiceTypes>();

feathersClient.configure(socketio(socket, { timeout: 30000 }));
feathersClient.configure(auth());

export interface DB {
  id: number;
}

export type NullableDB = Partial<DB>;

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

  verifiedEmail: boolean;
}

export interface AuthObject {
  user: User;
}

export interface FeathersError<T = Record<string, unknown>> {
  code: number,
  name: string,
  message: string,
  className: string,
  data: T[] | T,
}

export interface BadRequest {
  instancePath: string,
  schemaPath: string,
  keyword: string,
  params: Record<string, unknown>,
  message: string,
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

export async function getUser(): Promise<User | null> {
  return await feathersClient.get('authentication').user ?? null;
}

export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) throw new Error('required type is not allowed to be null. something in the authentication chain went wrong!');
  return user;
}

export async function waitForUser(cb: (user: User) => void): Promise<void> {
  const interval = setInterval(async () => {
    const user = await getUser();
    if (user !== null) {
      clearInterval(interval);
      cb(user);
    }
  }, 50);
}

export default feathersClient;
