<template>
  <div style="max-width: 1500px" class="mx-auto mt-2">
    <v-alert outlined type="info" class="mb-2" dismissible>
      For some settings to apply, you have to refresh the page.
    </v-alert>

    <v-card
      elevation="0"
      outlined
    >
      <v-list
        subheader
        two-line
        flat
        v-if="auth !== null"
      >
        <v-subheader>General settings</v-subheader>

        <v-list-item-group multiple v-model="settings">
          <v-list-item>
            <template v-slot:default="{ active, }">
              <v-list-item-action>
                <v-checkbox
                  :input-value="active"
                  color="primary"
                ></v-checkbox>
              </v-list-item-action>

              <v-list-item-content>
                <v-list-item-title>Dark mode</v-list-item-title>
                <v-list-item-subtitle>White burns your eyes? No more with dark mode!
                </v-list-item-subtitle>
              </v-list-item-content>
            </template>
          </v-list-item>

          <v-list-item>
            <template v-slot:default="{ active }">
              <v-list-item-action>
                <v-checkbox
                  :input-value="active"
                  color="primary"
                ></v-checkbox>
              </v-list-item-action>

              <v-list-item-content>
                <v-list-item-title>Mini sidebar drawer</v-list-item-title>
                <v-list-item-subtitle>Makes the sidebar be visible at all times
                </v-list-item-subtitle>
              </v-list-item-content>
            </template>
          </v-list-item>
        </v-list-item-group>
      </v-list>
      <div v-else class="d-flex justify-center align-center ma-4">
        <v-progress-circular color="primary" width="3" indeterminate
                             class="ma-auto"></v-progress-circular>
      </div>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import feathersClient, { AuthObject, usersService } from '@/feathers-client';

@Component
export default class Preferences extends Vue {
  private settings = [];
  private backendNames = ['prefersDarkMode', 'prefersMiniDrawer', 'preferredLanguage'];
  private auth: AuthObject | null = null;

  async mounted (): Promise<void> {
    setTimeout(async () => {
      this.auth = await feathersClient.get('authentication');

      const usr = this.auth.user;
      this.backendNames.forEach((name, i) => {
        if (usr[name]) this.settings.push(i);
      });
    }, 500);
  }

  @Watch('settings')
  settingsChanged (): void {
    if (!this.auth) {
      this.$toast.error('Request failed! Try again.');
      return;
    }

    const settings = this.settings.map((setting) => this.backendNames[setting]);

    const out: { [key: string]: boolean; } = {};
    this.backendNames.forEach((name) => {
      out[name] = settings.find((s) => s === name) !== undefined;
    });

    usersService.patch(this.auth.user.id, out);

    this.$vuetify.theme.dark = settings.includes('prefersDarkMode');
  }
}
</script>
