import { defineStore } from 'pinia';
import feathersClient, {AuthObject, User} from '@/feathers-client';
import {computed, ref} from "vue";
import { AuthenticationRequest } from "@feathersjs/authentication";

export const useAuthStore = defineStore('authStore', () => {
  const user = ref<User | null>(null);
  const isLoggedIn = computed(() => user.value !== null);

  async function login(params?: AuthenticationRequest) {
    console.log('login', params)
    const auth = await feathersClient.authentication.authenticate(params) as AuthObject;
    user.value = auth.user
  }

  async function logout() {
    await feathersClient.authentication.logout()
    user.value = null
  }

  return { user, isLoggedIn, login, logout }
});
