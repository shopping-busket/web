<template>
  <div class="mx-auto pt-4" style="max-width: 1200px">
    <v-alert class="mb-2" dismissible type="info" variant="tonal">
      For some settings to apply, you have to refresh the page.
    </v-alert>

    <v-card
      elevation="0"
      variant="outlined"
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

    <v-btn block class="mt-4" color="red" variant="tonal" @click="deleteUserDialog = true">
      Delete my Busket account
    </v-btn>
  </div>

  <v-dialog v-model="deleteUserDialog" max-width="500px">
    <v-card
      subtitle="This action cannot be undone!" text="Are you sure that you want to delete your Busket account? All lists and other associated information will be deleted with it!"
      title="Are you sure?"
    >
      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" variant="text" @click="deleteUserDialog = false">
          Cancel
        </v-btn>
        <v-btn color="primary" variant="outlined" @click="deleteUser">
          Yes, I am sure
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import {
  VAlert,
  VBtn,
  VCard,
  VCardActions,
  VCheckboxBtn,
  VDialog,
  VList,
  VListItem,
  VListItemAction,
  VListItemSubtitle,
  VListItemTitle,
  VListSubheader,
  VSpacer,
} from 'vuetify/components';
import feathersClient, { AuthObject, Service } from '@/feathers-client';
import { inject, onMounted, reactive, Ref, ref, watch } from 'vue';
import { useTheme } from 'vuetify';
import { userInjection } from '@/helpers/injectionKeys';

interface SettingsObject {
  prefersDarkMode: boolean,
  prefersMiniDrawer: boolean,
  preferredLanguage: string,
}

const theme = useTheme();
const user = inject(userInjection);

const auth: Ref<AuthObject | null> = ref(null);
const settings: SettingsObject = reactive({
  prefersDarkMode: false,
  prefersMiniDrawer: false,
  preferredLanguage: 'en',
});
const deleteUserDialog = ref(false);

onMounted(async () => {
  auth.value = await feathersClient.get('authentication');

  settings.prefersDarkMode = auth.value?.user.prefersDarkMode || false;
  settings.prefersMiniDrawer = auth.value?.user.prefersMiniDrawer || false;
  settings.preferredLanguage = auth.value?.user.preferredLanguage || 'en';
});

watch(settings, async () => {
  theme.global.name.value = settings.prefersDarkMode ? 'darkTheme' : 'lightTheme';

  await feathersClient.service(Service.USERS).patch(auth.value?.user.id || -1, {
    prefersDarkMode: settings.prefersDarkMode,
    prefersMiniDrawer: settings.prefersMiniDrawer,
    preferredLanguage: settings.preferredLanguage,
  } as SettingsObject);
});

async function deleteUser() {
  if (!user?.id) return;
  await feathersClient.service(Service.USERS).remove(user.id);
  window.location.reload();
}
</script>
