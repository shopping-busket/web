import io from 'socket.io-client';
import socketio from '@feathersjs/socketio-client';
import feathers, { Service } from '@feathersjs/feathers';
import auth from '@feathersjs/authentication-client';
import config from '../config';

const socket = io(config.backend, { transports: ['websocket'] });

const feathersClient = feathers();

feathersClient.configure(socketio(socket, { timeout: 30000 }));
feathersClient.configure(auth());

export interface User {
  createdAt: string;
  updatedAt: string;
  id: number;
  uuid: string;
  email: string;
  fullName: string;
  avatarURI: string | null;
  githubId: number | null;
  googleId: number | null;
}

export interface AuthObject {
  user: User;
}

export async function isLoggedIn (): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    if (!feathersClient.authentication.authenticated) {
      feathersClient.authenticate().then(() => resolve(true)).catch(() => resolve(false));
    }
  });
}

export const eventService: Service<unknown> = feathersClient.service('event');
export const listService: Service<unknown> = feathersClient.service('list');

export default feathersClient;
