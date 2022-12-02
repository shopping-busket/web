<template>
  <div style="max-width: 1500px" class="mx-auto mt-2">
    <v-alert outlined type="info" class="mb-2" dismissible>
      For some settings to apply, you have to refresh the page.
    </v-alert>

    <v-card
      elevation="0"
      outlined
    >
      <v-list lines="three" select-strategy="multiple">
        <v-list-subheader>General</v-list-subheader>

        <v-list-item value="prefersDarkMode">
          <template #prepend="{ isActive }">
            <v-list-item-action start>
              <v-checkbox-btn :model-value="isActive" />
            </v-list-item-action>
          </template>

          <v-list-item-title>Dark Mode</v-list-item-title>

          <v-list-item-subtitle>
            Alternate appearance for the whole web app. Use this if you often organize in the dark!
          </v-list-item-subtitle>
        </v-list-item>

        <v-list-item value="prefersMiniDrawer">
          <template #prepend="{ isActive }">
            <v-list-item-action start>
              <v-checkbox-btn :model-value="isActive" />
            </v-list-item-action>
          </template>

          <v-list-item-title>Mini navigation bar</v-list-item-title>

          <v-list-item-subtitle>
            Makes the navigation drawer on the left be visible at all times.
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>

      <!-- <v-list
        v-if="auth !== null"
        subheader
        two-line
        flat
      >
        <v-list-subheader>General settings</v-list-subheader>

                <v-item-group v-model="settings" multiple>
                  <v-list-item>
                    <template #default="{ active }">
                      <v-list-item-title>Dark mode</v-list-item-title>
                      <v-list-item-subtitle>
                        White burns your eyes? No more with dark mode!
                      </v-list-item-subtitle>

                      <v-list-item-action>
                        <v-checkbox
                          :input-value="active"
                          color="primary"
                        />
                      </v-list-item-action>
                    </template>
                  </v-list-item>

                  <v-list-item>
                    <template #default="{ active }">
                      <v-list-item-title>Mini sidebar drawer</v-list-item-title>
                      <v-list-item-subtitle>
                        Makes the sidebar be visible at all times
                      </v-list-item-subtitle>

                      <v-list-item-action>
                        <v-checkbox
                          :input-value="active"
                          color="primary"
                        />
                      </v-list-item-action>
                    </template>
                  </v-list-item>
                </v-item-group>

      </v-list>
      <div v-else class="d-flex justify-center align-center ma-4">
        <v-progress-circular
          color="primary"
          width="3"
          indeterminate
          class="ma-auto"
        />
      </div>-->
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import {
  VAlert,
  VCard,
  VList,
  VListItem,
  VListItemAction,
  VListItemTitle,
  VListItemSubtitle,
  VListSubheader,
  VCheckboxBtn,
} from 'vuetify/components';
import feathersClient, { AuthObject, usersService } from '@/feathers-client';
import { onMounted, reactive, Ref, ref, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { useTheme } from 'vuetify';

type BackendName = 'prefersDarkMode' | 'prefersMiniDrawer' | 'preferredLanguage';

const theme = useTheme();
const settings: number[] = reactive([]);
const backendNames = ['prefersDarkMode', 'prefersMiniDrawer', 'preferredLanguage'];
const auth: Ref<AuthObject | null> = ref(null);

onMounted(async () => {
  auth.value = await feathersClient.get('authentication');

  if (!auth.value) return;
  backendNames.forEach((name, i) => {
    if (auth.value?.user[name as unknown as BackendName]) settings.push(i);
  });
});

watch(settings, async () => {
  if (!auth.value) {
    useToast().error('Request failed! Try again.');
    return;
  }

  const s = settings.map((setting: number) => backendNames[setting]);

  const out: { [key: string]: boolean; } = {};
  backendNames.forEach((name) => {
    out[name] = s.find((s) => s === name) == null;
  });

  await usersService.patch(auth.value.user.id, out);

  theme.global.name.value = s.includes('prefersDarkMode') ? 'darkTheme' : 'lightTheme';
});
</script>
