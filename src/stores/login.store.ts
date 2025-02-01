import { defineStore } from 'pinia';
import { User } from '@/feathers-client';

export type LoginStore = {
  loggedIn: false,
  user: null;
} | {
  loggedIn: true,
  user: User;
}

export const useLoginStore = defineStore('loginStore', {
  state: (): LoginStore => ({
    loggedIn: false,
    user: null,
  }),
});
