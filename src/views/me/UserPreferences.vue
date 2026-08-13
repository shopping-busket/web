<template>
  <div class="mx-auto pt-4" style="max-width: 1200px">
    <v-alert class="mb-2" dismissible type="info" variant="tonal">
      For some settings to apply, you have to refresh the page.
    </v-alert>

    <v-card>
      <v-list lines="three" select-strategy="leaf">
        <v-list-subheader>General</v-list-subheader>

        <v-list-item
          value="prefersDarkMode"
          @click.stop="settings.prefersDarkMode = !settings.prefersDarkMode"
        >
          <template #prepend>
            <v-list-item-action start>
              <v-checkbox-btn v-model="settings.prefersDarkMode"/>
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
              <v-checkbox-btn v-model="settings.prefersMiniDrawer"/>
            </v-list-item-action>
          </template>

          <v-list-item-title>Mini navigation bar</v-list-item-title>

          <v-list-item-subtitle>
            Makes the navigation drawer on the left be visible at all times.
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-card>

    <v-btn variant="text" color="error" class="mt-4" block @click="deleteUserDialog = true">
      Delete my Busket account
    </v-btn>
  </div>

  <ConfirmationDialog v-model="deleteUserDialog" @confirm="deleteUser"
                      title="Are you sure?" subtitle="This action cannot be undone!"
                      text="Are you sure that you want to delete your Busket account? All lists and other associated information will be deleted with it!"/>
</template>

<script lang="ts" setup>
import {
  VAlert,
  VBtn,
  VCard,
  VCheckboxBtn,
  VList,
  VListItem,
  VListItemAction,
  VListItemSubtitle,
  VListItemTitle,
  VListSubheader,
} from 'vuetify/components';
import feathersClient, {AuthObject, Service} from '@/feathers-client';
import {onMounted, reactive, Ref, ref, watch} from 'vue';
import {useTheme} from 'vuetify';
import {useAuthStore} from '@/stores/auth.store';
import ConfirmationDialog from "@/components/ConfirmationDialog.vue";

interface SettingsObject {
  prefersDarkMode: boolean,
  prefersMiniDrawer: boolean,
  preferredLanguage: string,
}

const theme = useTheme();
const authStore = useAuthStore();

const settings: SettingsObject = reactive({
  prefersDarkMode: false,
  prefersMiniDrawer: false,
  preferredLanguage: 'en',
});
const deleteUserDialog = ref(false);

onMounted(async () => {
  authStore.$subscribe(() => updateLocalPrefs())
});

watch(settings, async () => {
  await theme.change(settings.prefersDarkMode ? 'darkTheme' : 'lightTheme');

  await feathersClient.service(Service.USERS).patch(authStore.user?.id || -1, {
    prefersDarkMode: settings.prefersDarkMode,
    prefersMiniDrawer: settings.prefersMiniDrawer,
    preferredLanguage: settings.preferredLanguage,
  } as SettingsObject);
});

async function updateLocalPrefs() {
  settings.prefersDarkMode = authStore.user?.prefersDarkMode || false;
  settings.prefersMiniDrawer = authStore.user?.prefersMiniDrawer || false;
  settings.preferredLanguage = authStore.user?.preferredLanguage || 'en';
}

async function deleteUser() {
  if (!authStore.user?.id) return;
  await feathersClient.service(Service.USERS).remove(authStore.user.id);
  window.location.reload();
}
</script>
