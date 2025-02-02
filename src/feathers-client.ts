import io from 'socket.io-client';
import socketio from '@feathersjs/socketio-client';
import { feathers, FeathersService } from '@feathersjs/feathers';
import auth from '@feathersjs/authentication-client';
import config from '../config';
import router, { Route, RouteMeta } from '@/router';
import emitter from '@/helpers/mitt';
import { useLoginStore } from '@/stores/login.store';

const socket = io(config.backend, { transports: ['websocket'] });

export type Methods = 'create' | 'find' | 'get' | 'update' | 'patch' | 'remove';

export enum Service {
  EVENT = 'event',
  LIST = 'list',
  LIBRARY = 'library',
  USERS = 'users',
  WHITELISTED_USERS = 'whitelisted-users',
  RECIPE = 'recipe',
  RECIPE_STEPS = 'recipe-steps',
  INGREDIENTS = 'ingredients',
  FILE_UPLOAD = 'file-upload',
}

type ServiceTypes = Record<Service, FeathersService> & Record<string, FeathersService>

// Services in this list will not redirect to the login page when jwt auth fails!
const loginServiceExceptions: Service[] = [Service.RECIPE, Service.RECIPE_STEPS, Service.INGREDIENTS];
const feathersClient = feathers<ServiceTypes>();

feathersClient.hooks({
  before: {
    all: [
      async (ctx) => {
        if (ctx.path == 'authentication') return;
        if (feathersClient.authentication.authenticated) return;

        try {
          const auth = await feathersClient.authenticate() as AuthObject;
          emitter.emit('authenticationChanged', auth);
          useLoginStore().$patch({
            loggedIn: true,
            user: auth.user,
          });

          if (!auth.user.verifiedEmail && !(router.currentRoute.value.meta as RouteMeta).allowUnverified) {
            await router.replace({ name: Route.EMAIL_VERIFY });
          }
        } catch (e) {
          const err = e as FeathersError;
          if (err.code === 408) {
            console.log('[Auth] Timeout while trying to authenticate. You are offline!');
            return;
          }

          console.log(`[Auth] Not authenticated.`);
          if (!Array.isArray(err.data) && !err.data?.reason) {
            console.log('[Auth] check loginServiceExceptions', loginServiceExceptions, ctx.path);
            if ((loginServiceExceptions as string[]).includes(ctx.path)) return;
            await router.replace({ name: Route.LOGIN });
          }
        }
      }
    ]
  }
});

feathersClient.configure(socketio(socket, { timeout: 5_000 }));
feathersClient.configure(auth({ storage: process.env.NODE_ENV !== 'development' ? localStorage : sessionStorage }));

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

export default feathersClient;
