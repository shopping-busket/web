<template>
  <div class="pt-16">
    <v-card
      :style="isDarkTheme ? 'border-color: #393939' : 'border-color: #e0e0e0'"
      class="ma-auto"
      title="Signup"
      variant="outlined"
      width="500px"
    >
      <v-card-subtitle style="margin-top: -12px">
        Create a new Busket account. Already have one?
        <router-link to="login">
          Login
        </router-link>
      </v-card-subtitle>

      <v-card-text>
        <v-form ref="form" v-model="isValid" @submit.prevent="submit()">
          <v-text-field
            v-model.trim="username"
            :rules="usernameRules"
            class="pb-3"
            color="primary"
            hide-details="auto"
            label="Name"
            type="text"
            variant="underlined"
          />
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
            ref="passwordField"
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
            variant="tonal"
            type="submit"
          >
            Create Account
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import { VBtn, VCard, VCardSubtitle, VCardText, VForm, VTextField } from 'vuetify/components';
import feathersClient, { BadRequest, FeathersError } from '@/feathers-client';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import { useRoute } from 'vue-router';
import { onMounted, Ref, ref, watch } from 'vue';
import { useTheme } from 'vuetify';
import { EMAIL_REGEX } from '@/helpers/regex';

const i18n = useI18n();
const toast = useToast();
const route = useRoute();
const theme = useTheme();
const primaryColor = theme.global.current.value.colors.primary;
const isDarkTheme = ref(false);

const passwordRules = [
  (value: string) => !!value || `${i18n.t('auth.Required')}.`,
  (value: string) => (value && value.length >= 3) || i18n.t('auth.Min x characters', { x: 3 }),
];
const emailRules = [
  (value: string) => !!value || `${i18n.t('auth.Required')}.`,
  (value: string) => EMAIL_REGEX.test(value) || i18n.t('auth.Must be an email'), // Regex rfc: https://www.rfc-editor.org/rfc/rfc5322
];
const usernameRules = [
  (value: string) => !!value || `${i18n.t('auth.Required')}.`,
  (value: string) => value.length >= 1 || i18n.t('auth.Min x characters', { x: 1 }),
];

const tries = ref(0);
const showPsw = ref(false);
const username = ref('');
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

  await feathersClient.service('users')
    .create({
      email: email.value,
      password: password.value,
      fullName: username.value,
    })
    .then(async (d) => {
      console.log(d);
      btnLoading.value = false;
      toast.success(`Created account '${username.value}'. Logging you in...`);
      await login();
    })
    .catch((err: FeathersError<BadRequest>) => {
      console.warn('[ERROR] Error while trying to signup:', JSON.stringify(err));
      if (err.code === 400) {
        toast.warning('User with this email already exists!');
        form.value?.reset();
        btnLoading.value = false;
        return;
      }
      toast.error('Something went wrong!');
    });
}

async function login(): Promise<void> {
  await feathersClient.authentication.authenticate({
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
      console.warn('[ERROR] Error while trying to authenticate/login:', err);
      toast.error('Something went wrong trying to log you in.\nPlease try again later!');
    });
}
</script>

<style lang="scss" scoped>
.btn-with-outline {
  border: 1px solid v-bind(primaryColor);
}
</style>
