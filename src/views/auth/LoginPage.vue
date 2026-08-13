<template>
  <div class="pt-16 ma-auto" style="max-width: 500px">
    <v-card
      title="Login"
    >
      <v-card-subtitle style="margin-top: -12px">
        Login using your Busket account. Don't have one?
        <router-link
          :to="{ name: 'signup', query: { redirect: $route.query.redirect || '' } }"
        >
          Signup
        </router-link>
      </v-card-subtitle>
      <v-form ref="form" v-model="isValid" @submit.prevent="submit()">
        <v-card-text>
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
          />
          <span v-show="forgetHint" class="pt-1">
            Forgot your password? Contact me at <a href="mailto:busket@bux.at">busket@bux.at</a>!
          </span>
        </v-card-text>

        <v-card-actions>
          <v-btn
            :loading="btnLoading"
            block
            color="primary"
            type="submit"
            variant="flat"
          >
            Login using Busket
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>

    <v-alert
      v-if="redirectRoute!!"
      class="mt-4"
      type="info"
      variant="tonal"
    >
      After logging in you will be redirected to
      "{{ redirectRoute?.meta?.displayName ?? redirectRoute.fullPath }}"
    </v-alert>
  </div>
</template>

<script lang="ts" setup>
import {VAlert, VBtn, VCard, VCardSubtitle, VCardText, VForm, VTextField} from 'vuetify/components';
import {onMounted, Ref, ref, watch} from 'vue';
import {useToast} from 'vue-toastification';
import {RouteLocationResolved, useRoute, useRouter} from 'vue-router';
import {useI18n} from 'vue-i18n';
import {useTheme} from 'vuetify';
import {EMAIL_REGEX} from '@/helpers/regex';
import {useAuthStore} from "@/stores/auth.store";

const toast = useToast();
const route = useRoute();
const router = useRouter();
const i18n = useI18n();
const theme = useTheme();
const authStore = useAuthStore();

const isDarkTheme = ref(false);
const primaryColor = theme.global.current.value.colors.primary;

const passwordRules = [
  (value: string) => !!value || `${i18n.t('auth.Required')}.`,
  (value: string) => (value && value.length >= 3) || i18n.t('auth.Min x characters', {x: 3}),
];
const emailRules = [
  (value: string) => !!value || `${i18n.t('auth.Required')}.`,
  (value: string) => (value && value.length >= 3) || i18n.t('auth.Min x characters', {x: 3}),
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
const redirectRoute = ref<RouteLocationResolved | null>(null);

onMounted(() => {
  themeWatcher();
  if (route.query.redirect) redirectRoute.value = router.resolve(route.query.redirect as string);
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

  authStore.login({
    strategy: 'local',
    email: email.value,
    password: password.value,
  }).then(() => {
    btnLoading.value = false;
    toast.success('Logged in successfully!');
    console.log('%c[Auth]%cLogged in', 'color: green');

    if (!route.query.redirect) {
      window.location.href = '/';
      return;
    }
    window.location.href = decodeURI(route.query.redirect as string || '/');
  })
    .catch((err: { code: number; }) => {
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
