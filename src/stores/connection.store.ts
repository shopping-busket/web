import {defineStore} from 'pinia';
import {ref} from 'vue';
import feathersClient from "@/feathers-client";

export const useConnectionStore = defineStore('connection', () => {
  const isConnected = ref<boolean>(feathersClient.io.connected);

  feathersClient.io.on('connect', () => {
    console.log('[connectionStore] connected!');
    setConnected(true);
  });
  feathersClient.io.on('disconnect', () => {
    console.log('[connectionStore] disconnected!');
    setConnected(false);
  });

  function setConnected(status: boolean) {
    isConnected.value = status;
  }

  return {isConnected, setConnected};
});
