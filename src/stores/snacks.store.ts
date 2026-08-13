import {defineStore} from 'pinia';
import {ref} from 'vue';

export interface QueuedSnack {
  text: string;
  color?: 'success' | 'error' | 'warning' | 'info' | string;
  timeout?: number;
}

export interface SnackOptions {
  timeout?: number;
  color?: string;
}

export const useSnacksStore = defineStore('snacks', () => {
  const snacks = ref<QueuedSnack[]>([]);

  function addToQueue(text: string, color: 'success' | 'error' | 'warning' | 'info' | string = 'default', options?: SnackOptions) {
    snacks.value.push({
      text,
      color: options?.color ?? color,
      timeout: options?.timeout ?? 3000,
    });
  }

  function success(text: string, options?: SnackOptions) {
    addToQueue(text, 'success', options);
  }

  function error(text: string, options?: SnackOptions) {
    addToQueue(text, 'error', options);
  }

  function warning(text: string, options?: SnackOptions) {
    addToQueue(text, 'warning', options);
  }

  function info(text: string, options?: SnackOptions) {
    addToQueue(text, 'info', options);
  }

  return {snacks, success, error, warning, info};
});
