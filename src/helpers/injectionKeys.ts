import { InjectionKey } from 'vue';
import { AuthObject, User } from '@/feathers-client';

export const authenticationInjection = Symbol() as InjectionKey<AuthObject>;
export const userInjection = Symbol() as InjectionKey<User>;
