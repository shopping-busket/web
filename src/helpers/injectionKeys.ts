import { InjectionKey } from 'vue';
import { User } from '@/feathers-client';

export const userInjection = Symbol() as InjectionKey<User>;
