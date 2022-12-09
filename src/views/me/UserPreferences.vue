<template>
  <div class="mx-auto mt-2" style="max-width: 1200px">
    <v-alert class="mb-2" dismissible type="info" variant="tonal">
      For some settings to apply, you have to refresh the page.
    </v-alert>

    <v-card
      elevation="0"
    >
      <v-list lines="three" select-strategy="multiple">
        <v-list-subheader>General</v-list-subheader>

        <v-list-item
          value="prefersDarkMode"
          @click.stop="settings.prefersDarkMode = !settings.prefersDarkMode"
        >
          <template #prepend>
            <v-list-item-action start>
              <v-checkbox-btn v-model="settings.prefersDarkMode" />
            </v-list-item-action>
          </template>

          <v-list-item-title>Dark Mode</v-list-item-title>

          <v-list-item-subtitle>
            Alternate appearance for the whole web app. Use this if you often organize in the dark!
          </v-list-item-subtitle>
        </v-list-item>

        <v-list-item
          value="prefersMiniDrawer"
          @click.stop="settings.prefersMiniDrawer = !settings.prefersMiniDrawer"
        >
          <template #prepend>
            <v-list-item-action start>
              <v-checkbox-btn v-model="settings.prefersMiniDrawer" />
            </v-list-item-action>
          </template>

          <v-list-item-title>Mini navigation bar</v-list-item-title>

          <v-list-item-subtitle>
            Makes the navigation drawer on the left be visible at all times.
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import {
  VAlert,
  VCard,
  VCheckboxBtn,
  VList,
  VListItem,
  VListItemAction,
  VListItemSubtitle,
  VListItemTitle,
  VListSubheader,
} from 'vuetify/components';
import feathersClient, { AuthObject, usersService } from '@/feathers-client';
import { onMounted, reactive, Ref, ref, watch } from 'vue';
import { useTheme } from 'vuetify';

interface SettingsObject {
  prefersDarkMode: boolean,
  prefersMiniDrawer: boolean,
  preferredLanguage: string,
}

const theme = useTheme();

const auth: Ref<AuthObject | null> = ref(null);
const settings: SettingsObject = reactive({
  prefersDarkMode: false,
  prefersMiniDrawer: false,
  preferredLanguage: 'en',
});

onMounted(async () => {
  auth.value = await feathersClient.get('authentication');

  settings.prefersDarkMode = auth.value?.user.prefersDarkMode || false;
  settings.prefersMiniDrawer = auth.value?.user.prefersMiniDrawer || false;
  settings.preferredLanguage = auth.value?.user.preferredLanguage || 'en';
});

watch(settings, async () => {
  theme.global.name.value = settings.prefersDarkMode ? 'darkTheme' : 'lightTheme';

  await usersService.patch(auth.value?.user.id || -1, {
    prefersDarkMode: settings.prefersDarkMode,
    prefersMiniDrawer: settings.prefersMiniDrawer,
    preferredLanguage: settings.preferredLanguage,
  } as SettingsObject);
});
</script>
