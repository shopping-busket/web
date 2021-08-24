<template>
  <div>
    <v-card width="500px" class="mt-16 ma-auto" outlined>
      <v-card-title>Login</v-card-title>
      <v-card-subtitle>Login using your Google or your Busket account. Don't have one?
        <router-link
          :to="{ name: 'signup', query: { redirect: $route.query.redirect || '' } }">Signup
        </router-link>
      </v-card-subtitle>
      <v-card-text>
        <v-text-field
          label="Email"
          :rules="emailRules"
          hide-details="auto"
          class="pb-3"
          type="email"
          v-model="email"
        ></v-text-field>
        <v-text-field
          ref="passwordField"
          label="Password"
          hide-details="auto"
          :rules="passwordRules"
          :append-icon="showPsw ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
          :type="showPsw ? 'text' : 'password'"
          @click:append="showPsw = !showPsw"
          @keypress.enter="submit"
          @blur="passwordBlur"
          v-model="password"
        ></v-text-field>
        <span class="pt-1" v-show="forgetHint">
      Forgot your password? Contact me at <a href="mailto:busket@bux.at">busket@bux.at</a>!
    </span>
      </v-card-text>
      <v-card-actions class="flex flex-column">
        <v-btn color="primary" outlined rounded block :loading="btnLoading" :disabled="btnDisabled"
               @click="submit">Login using Busket
        </v-btn>
        <v-btn color="blue" outlined class="mt-2 ml-0" rounded block @click="googleLogin">Login
          using Google
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import feathersClient from '@/feathers-client';

@Component
export default class LoginPage extends Vue {
  private passwordRules = [
    (value: string) => !!value || `${this.$t('auth.Required')}.`,
    (value: string) => (value && value.length >= 3) || this.$t('auth.Min x characters', { x: 3 }),
  ];
  private emailRules = [
    (value: string) => !!value || `${this.$t('auth.Required')}.`,
    (value: string) => (value && value.length >= 3) || this.$t('auth.Min x characters', { x: 3 }),
    (value: string) => /^[-!#$%&'*+/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+/0-9=?A-Z^_a-z{|}~])*@[a-zA-Z](-?[a-zA-Z0-9])*(\.[a-zA-Z](-?[a-zA-Z0-9])*)+$/.test(value) || this.$t('auth.Must be an email'),
  ];
  private tries = 0;
  private showPsw = false;
  private password = '';
  private email = '';
  private forgetHint = false;
  private btnDisabled = true;
  private btnLoading = false;

  mounted (): void {
    this.validateInfo();
  }

  @Watch('email')
  @Watch('password')
  validateInfo (): void {
    this.emailRules.some((r) => {
      const c = r(this.email) !== true;
      this.btnDisabled = c;
      return c;
    });

    this.passwordRules.some((r) => {
      const c = r(this.password) !== true;
      this.btnDisabled = c;
      return c;
    });
  }

  passwordBlur (): void {
    this.tries++;
    if (this.tries >= 3) this.forgetHint = true;
  }

  async googleLogin (): Promise<void> {
    // window.open(`${config.backend}/oauth/google`, 'Oauth', 'width=600,height=400');
    // await feathersClient.authenticate({ strategy: 'google' });
    this.$toast.warning('Currently not available.');
  }

  async submit (): Promise<void> {
    this.btnLoading = true;

    feathersClient.authentication.authenticate({
      strategy: 'local',
      email: this.email,
      password: this.password,
    }).then(() => {
      this.btnLoading = false;
      this.$toast('Logged in successfully!');
      console.log('%c[Auth]%cLogged in', 'color: green');

      if (!this.$route.query.redirect) {
        window.location.href = '/';
        return;
      }
      window.location.href = decodeURI(this.$route.query.redirect as string || '/');
    }).catch((err) => {
      if (err.code === 401) {
        this.$toast.warning('Wrong email or password!');
        this.password = '';
        return;
      }
      console.warn('[ERROR] Error while trying to authenticate/login:', err);
      this.$toast.error('Something went wrong Please try again later!');
    }).finally(() => {
      this.tries++;
      this.btnLoading = false;
    });
  }
}
</script>
