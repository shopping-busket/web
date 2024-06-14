<template>
  <div class="pt-16 ma-auto" style="max-width: 500px">
    <v-card
      :style="isDarkTheme ? 'border-color: #393939' : 'border-color: #e0e0e0'"
      title="Login" variant="outlined"
    >
      <v-card-subtitle style="margin-top: -12px">
        Login using your Busket account. Don't have one?
        <router-link
          :to="{ name: 'signup', query: { redirect: $route.query.redirect || '' } }"
        >
          Signup
        </router-link>
      </v-card-subtitle>
      <v-card-text>
        <v-form ref="form" v-model="isValid" @submit.prevent="submit()">
          <v-text-field
            v-model="email"
            :rules="emailRules"
            class="pb-3"
            color="primary"
            hide-details="auto"
            label="Email"
            type="email"
            variant="underlined"
          />
          <v-text-field
            v-model="password"
            :append-inner-icon="showPsw ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
            :rules="passwordRules"
            :type="showPsw ? 'text' : 'password'"
            color="primary"
            hide-details="auto"
            label="Password"
            variant="underlined"
            @blur="passwordBlur"
            @click:append-inner="showPsw = !showPsw"
            @keypress.enter="submit"
          />
          <span v-show="forgetHint" class="pt-1">
            Forgot your password? Contact me at <a href="mailto:busket@bux.at">busket@bux.at</a>!
          </span>

          <v-btn
            :loading="btnLoading"
            block
            class="btn-with-outline mt-4"
            color="primary"
            type="submit"
            variant="tonal"
          >
            Login using Busket
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>

    <v-alert
      v-if="route.query.redirect && route.query.redirect.length > 0"
      class="mt-4"
      type="info"
      variant="tonal"
    >
      After logging in you will be redirected to {{ route.query.redirect }}
    </v-alert>
  </div>
</template>

<script lang="ts" setup>
import {
  VAlert,
  VBtn,
  VCard,
  VCardSubtitle,
  VCardText,
  VForm,
  VTextField
} from 'vuetify/components';
import feathersClient from '@/feathers-client';
import { onMounted, Ref, ref, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useTheme } from 'vuetify';
import { EMAIL_REGEX } from '@/helpers/regex';

const toast = useToast();
const route = useRoute();
const i18n = useI18n();
const theme = useTheme();
const isDarkTheme = ref(false);
const primaryColor = theme.global.current.value.colors.primary;

const passwordRules = [
  (value: string) => !!value || `${i18n.t('auth.Required')}.`,
  (value: string) => (value && value.length >= 3) || i18n.t('auth.Min x characters', { x: 3 }),
];
const emailRules = [
  (value: string) => !!value || `${i18n.t('auth.Required')}.`,
  (value: string) => (value && value.length >= 3) || i18n.t('auth.Min x characters', { x: 3 }),
  (value: string) => EMAIL_REGEX.test(value) || i18n.t('auth.Must be an email'),
];
const tries = ref(0);
const showPsw = ref(false);
const password = ref('');
const email = ref('');
const forgetHint = ref(false);
const btnLoading = ref(false);
const form: Ref<VForm | null> = ref(null);
const isValid: Ref<boolean | null> = ref(false);

onMounted(() => {
  themeWatcher();
});

watch(theme.global.name, themeWatcher);

function themeWatcher() {
  isDarkTheme.value = theme.global.name.value === 'darkTheme';
}

function passwordBlur(): void {
  tries.value++;
  if (tries.value >= 3) forgetHint.value = true;
}

async function submit(): Promise<void> {
  if (isValid.value === null) isValid.value = (await form.value?.validate())?.valid ?? false;
  if (!isValid.value) return;

  btnLoading.value = true;

  feathersClient.authentication.authenticate({
    strategy: 'local',
    email: email.value,
    password: password.value,
  })
    .then(() => {
      btnLoading.value = false;
      toast.success('Logged in successfully!');
      console.log('%c[Auth]%cLogged in', 'color: green');

      if (!route.query.redirect) {
        window.location.href = '/';
        return;
      }
      window.location.href = decodeURI(route.query.redirect as string || '/');
    })
    .catch((err) => {
      if (err.code === 401) {
        toast.warning('Wrong email or password!');
        password.value = '';
        return;
      }
      console.warn('[ERROR] Error while trying to authenticate/login:', err);
      toast.error('Something went wrong Please try again later!');
    })
    .finally(() => {
      tries.value++;
      btnLoading.value = false;
    });
}
</script>

<style lang="scss" scoped>
.btn-with-outline {
  border: 1px solid v-bind(primaryColor);
}
</style>
