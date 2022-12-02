<template>
  <div>
    <v-card width="500px" class="mt-16 ma-auto" variant="outlined">
      <v-card-title>Login</v-card-title>
      <v-card-subtitle>
        Login using your Busket account. Don't have one?
        <router-link
          :to="{ name: 'signup', query: { redirect: $route.query.redirect || '' } }"
        >
          Signup
        </router-link>
      </v-card-subtitle>
      <v-card-text>
        <v-text-field
          v-model="email"
          variant="underlined"
          color="primary"
          label="Email"
          :rules="emailRules"
          hide-details="auto"
          class="pb-3"
          type="email"
        />
        <v-text-field
          v-model="password"
          variant="underlined"
          color="primary"
          label="Password"
          hide-details="auto"
          :rules="passwordRules"
          :append-icon="showPsw ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
          :type="showPsw ? 'text' : 'password'"
          @click:append="showPsw = !showPsw"
          @keypress.enter="submit"
          @blur="passwordBlur"
        />
        <span v-show="forgetHint" class="pt-1">
          Forgot your password? Contact me at <a href="mailto:busket@bux.at">busket@bux.at</a>!
        </span>
      </v-card-text>
      <v-card-actions class="flex flex-column">
        <v-btn
          color="primary" variant="outlined" rounded block :loading="btnLoading"
          :disabled="btnDisabled"
          @click="submit"
        >
          Login using Busket
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import {
  VCard,
  VCardTitle,
  VCardSubtitle,
  VCardText,
  VTextField,
  VCardActions,
  VBtn
} from 'vuetify/components';
import feathersClient from '@/feathers-client';
import { onMounted, ref, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';

const toast = useToast();
const route = useRoute();
const i18n = useI18n();

const passwordRules = [
  (value: string) => !!value || `${i18n.t('auth.Required')}.`,
  (value: string) => (value && value.length >= 3) || i18n.t('auth.Min x characters', { x: 3 }),
];
const emailRules = [
  (value: string) => !!value || `${i18n.t('auth.Required')}.`,
  (value: string) => (value && value.length >= 3) || i18n.t('auth.Min x characters', { x: 3 }),
  (value: string) => /^[-!#$%&'*+/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+/0-9=?A-Z^_a-z{|}~])*@[a-zA-Z](-?[a-zA-Z0-9])*(\.[a-zA-Z](-?[a-zA-Z0-9])*)+$/.test(value) || i18n.t('auth.Must be an email'),
];
const tries = ref(0);
const showPsw = ref(false);
const password = ref('');
const email = ref('');
const forgetHint = ref(false);
const btnDisabled = ref(true);
const btnLoading = ref(false);

onMounted(() => {
  validateInfo();
});
watch([email, password], validateInfo);

function validateInfo(): void {
  emailRules.some((r) => {
    const c = r(email.value) !== true;
    btnDisabled.value = c;
    return c;
  });

  passwordRules.some((r) => {
    const c = r(password.value) !== true;
    btnDisabled.value = c;
    return c;
  });
}

function passwordBlur(): void {
  tries.value++;
  if (tries.value >= 3) forgetHint.value = true;
}

async function submit(): Promise<void> {
  btnLoading.value = true;

  feathersClient.authentication.authenticate({
    strategy: 'local',
    email: email,
    password: password,
  }).then(() => {
    btnLoading.value = false;
    toast('Logged in successfully!');
    console.log('%c[Auth]%cLogged in', 'color: green');

    if (!route.query.redirect) {
      window.location.href = '/';
      return;
    }
    window.location.href = decodeURI(route.query.redirect as string || '/');
  }).catch((err) => {
    if (err.code === 401) {
      toast.warning('Wrong email or password!');
      password.value = '';
      return;
    }
    console.warn('[ERROR] Error while trying to authenticate/login:', err);
    toast.error('Something went wrong Please try again later!');
  }).finally(() => {
    tries.value++;
    btnLoading.value = false;
  });
}
</script>
