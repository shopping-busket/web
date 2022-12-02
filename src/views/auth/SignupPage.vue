<template>
  <div>
    <v-card width="500px" class="mt-16 ma-auto" variant="outlined">
      <v-card-title>Signup</v-card-title>
      <v-card-subtitle>
        Create a new Busket account. Already have one?
        <router-link to="login">
          Login
        </router-link>
      </v-card-subtitle>
      <v-card-text>
        <v-text-field
          v-model="username"
          variant="underlined"
          color="primary"
          label="Name"
          :rules="usernameRules"
          hide-details="auto"
          class="pb-3"
          type="text"
        />
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
          ref="passwordField"
          v-model="password"
          variant="underlined"
          color="primary"
          label="Password"
          hide-details="auto"
          :rules="passwordRules"
          :append-inner-icon="showPsw ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
          :type="showPsw ? 'text' : 'password'"
          @click:append-inner="showPsw = !showPsw"
          @keypress.enter="submit"
          @blur="passwordBlur"
        />
        <span v-show="forgetHint" class="pt-1">
          Forgot your password? Contact me at <a href="mailto:busket@bux.at">busket@bux.at</a>!
        </span>
      </v-card-text>
      <v-card-actions class="flex flex-column">
        <v-btn color="primary" variant="outlined" rounded block @click="submit">
          Signup
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
import { v4 as uuidv4 } from 'uuid';
import feathersClient from '@/feathers-client';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import { useRoute } from 'vue-router';
import { onMounted, ref, watch } from 'vue';

const i18n = useI18n();
const toast = useToast();
const route = useRoute();

const passwordRules = [
  (value: string) => !!value || `${i18n.t('auth.Required')}.`,
  (value: string) => (value && value.length >= 3) || i18n.t('auth.Min x characters', { x: 3 }),
];
const emailRules = [
  (value: string) => !!value || `${i18n.t('auth.Required')}.`,
  (value: string) => (value && value.length >= 3) || i18n.t('auth.Min x characters', { x: 3 }),
  (value: string) => /^[-!#$%&'*+/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+/0-9=?A-Z^_a-z{|}~])*@[a-zA-Z](-?[a-zA-Z0-9])*(\.[a-zA-Z](-?[a-zA-Z0-9])*)+$/.test(value) || i18n.t('auth.Must be an email'),
];
const usernameRules = [
  (value: string) => !!value || `${i18n.t('auth.Required')}.`,
  (value: string) => /^(\w)+ *([\w\s .]*)+$/.test(value) || i18n.t('auth.Username can only contain'),
  (value: string) => value.length <= 16 || i18n.t('auth.Max x characters', { x: 16 }),
  (value: string) => value.length >= 3 || i18n.t('auth.Min x characters', { x: 3 }),
];

const tries = ref(0);
const showPsw = ref(false);
const username = ref('');
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

  await feathersClient.service('users').create({
    uuid: uuidv4(),
    email: email.value,
    password: password.value,
    fullName: username.value,
    avatarURL: null,

    prefersMiniDrawer: false,
    prefersDarkMode: false,
    preferredLanguage: 'en',
  }).then(() => {
    btnLoading.value = false;
    toast.info('Created account \'{username}\'. Logging you in...');
    login();
  }).catch((err: Error) => {
    console.warn('[ERROR] Error while trying to signup:', err);
    toast.error('Something went wrong!');
  });
}

async function login(): Promise<void> {
  feathersClient.authentication.authenticate({
    strategy: 'local',
    email: email.value,
    password: password.value,
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
    console.warn('[ERROR] Error while trying to authenticate/login:', err);
    toast.error('Something went wrong trying to log you in.\nPlease try again later!');
  });
}
</script>
