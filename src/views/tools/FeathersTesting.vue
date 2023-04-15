<template>
  <v-card
    title="Busket Backend tester" :subtitle="`You are logged in as ${user?.fullName}`"
    class="mt-16 ma-auto" max-width="800px" variant="outlined" :style="jseThemeCSS"
  >
    <v-card-text>
      <v-form v-model="isValid" @submit.prevent="send">
        <v-autocomplete
          v-model="selectedService" required density="compact" variant="underlined"
          label="Service" :items="services" :rules="requiredRules"
        />
        <v-autocomplete
          v-model="selectedMethod" required density="compact" variant="underlined"
          label="Method" :items="methods" :rules="requiredRules"
        />

        <v-text-field
          v-if="selectedMethod === 'get'"
          v-model.number="id"
          :rules="idRules"
          type="number"
          label="ID"
          variant="underlined"
          density="compact"
        />

        <div v-if="selectedMethod === 'create'">
          Data
          <json-editor-vue
            v-model="data" class="jse-border-rounded" mode="text" :status-bar="false"
            style="height: 17rem"
          />
        </div>

        Params
        <json-editor-vue
          v-model="params" class="jse-border-rounded" mode="text" :status-bar="false"
          style="height: 17rem"
        />

        <v-btn type="submit" color="primary" block variant="tonal" class="my-4">
          Send
        </v-btn>

        Response
        <json-editor-vue
          v-model="response" class="jse-border-rounded" mode="tree"
          style="height: 40rem" read-only
          :flatten-columns="true"
        />
      </v-form>
    </v-card-text>
  </v-card>

  <v-dialog v-model="showResponseDialog" fullscreen :style="jseThemeCSS">
    <json-editor-vue
      v-model="response" mode="tree" style="height: 100%" read-only
      :flatten-columns="true"
    />
  </v-dialog>
</template>

<script lang="ts" setup>
import {
  VAutocomplete,
  VBtn,
  VCard,
  VCardText,
  VDialog,
  VForm,
  VTextField
} from 'vuetify/components';
import { computed, inject, Ref, ref } from 'vue';
import { userInjection } from '@/helpers/injectionKeys';
import feathersClient, { Methods, Service } from '@/feathers-client';
import { useToast } from 'vue-toastification';
import JsonEditorVue from 'json-editor-vue';
import { useTheme } from 'vuetify';

const user = inject(userInjection);
const toast = useToast();
const theme = useTheme();

type Rules = ((value: string) => boolean | string)[];

const services = ref(Object.values(Service));
const methods = ref([
  'create',
  'find',
  'get',
  'update',
  'patch',
  'remove',
]);
const requiredRules = [
  value => value ? true : 'This is a required field!',
] as Rules;
const idRules = [
  value => selectedMethod.value === 'get' && value ? true : 'get requests have to have an id!',
] as Rules;
const isValid = ref(false);

const selectedService = ref('');
const selectedMethod: Ref<Methods> = ref('find');

const data: Ref<string> = ref('');
const id: Ref<string> = ref('');
const params: Ref<Record<string, unknown>> = ref({});

const response: Ref<unknown> = ref('Waiting for response');
const showResponseDialog = ref(false);

const jseThemeCSS = computed(() => {
  return {
    '--jse-theme-color': theme.current.value.colors.primary,
    '--jse-theme-color-highlight': theme.current.value.colors.secondary,
    '--jse-button-primary-background': theme.current.value.colors.primary
  };
});

window.addEventListener('keydown', (e) => {
  const isJsonInput = document.activeElement?.classList.contains('svelte-1wlxti1') || document.activeElement?.attributes.getNamedItem('role')?.nodeValue === 'textbox';
  const isInput = document.activeElement?.nodeName.toLowerCase() === 'input';
  if (isInput || isJsonInput) return false;

  if (e.key === 'f') showResponseDialog.value = !showResponseDialog.value;
});

async function send() {
  if (!isValid.value) return;
  const service = feathersClient.service(selectedService.value as Service);

  const parsedId = id.value.length > 0 ? parseInt(id.value) : null;
  if (Number.isNaN(parsedId)) return toast.warning('Cannot convert id to int!');

  let parsedData: Record<string, unknown> | null = null;
  if (data.value.length > 0) {
    try {
      parsedData = JSON.parse(data.value) as Record<string, unknown>;
    } catch {
      return toast.error('unable to parse data!');
    }
  }

  const logResponse = (data: unknown, logMethod: 'log' | 'error' | 'warn' | 'table' = 'log') => {
    console[logMethod](`${selectedService.value}.${selectedMethod.value}${id.value.length > 0 ? '{' + id.value + '}' : ''}: `, data);
  };

  let promise: Promise<unknown> | null = null;
  switch (selectedMethod.value) {
    case 'create':
      if (!parsedData) return toast.error('Cannot create without data!');
      promise = service.create(parsedData, params.value);
      break;

    case 'find':
      if (!params.value) return toast.error('No Params passed! Required!');
      promise = service.find(params.value);
      break;

    case 'get':
      if (!parsedId) return toast.error(('Cannot call .get without id!'));
      promise = service.get(parsedId, params.value);
      break;

    default:
      console.log('should not be possible!');
      break;
  }

  if (!promise) return;
  await promise.then((d) => {
    logResponse(d);
    response.value = d;
  }).catch((e) => {
    logResponse(JSON.stringify(e, null, 2));
    logResponse(e, 'error');
  });
}
</script>

<style lang="scss">
.jse-border-rounded > .jse-main > div > .jse-menu {
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
}

button.jse-button:nth-child(1) {
  border-top-left-radius: 5px;
  border-bottom-left-radius: 5px;
}

.jse-menu {
  > button:nth-child(1) {
    border-top-left-radius: 5px !important;
    border-bottom-left-radius: 5px !important;
  }

  > button:nth-child(3) {
    border-top-right-radius: 5px !important;
    border-bottom-right-radius: 5px !important;
  }
}
</style>
