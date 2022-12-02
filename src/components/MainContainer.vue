<template>
  <div style="height: 100%">
    <v-navigation-drawer
      v-model="drawer"
      v-model:mini-variant="mini"
      app
      :temporary="!permDrawer"
      :permanent="permDrawer"
    >
      <v-list-item
        :prepend-avatar="auth != null ? gravatar(auth.user.email) : img"
        :title="auth == null ? 'Not logged in' : auth?.user?.fullName"
        nav
      >
        <template #append>
          <v-btn
            v-if="permDrawer"
            icon
            @click.stop="mini = !mini"
          >
            <v-icon icon="mdi-chevron-left" />
          </v-btn>
          <v-btn
            v-else
            variant="text"
            icon="mdi-chevron-left"
            @click.stop="drawer = !drawer"
          />
        </template>
      </v-list-item>

      <v-divider />

      <v-list nav>
        <v-list-item
          v-for="item in menuItems.filter((it) => !it.divide)"
          :key="item.title"
          link
          @click.stop="item.to === undefined ? item.click() : tryRouteTo(item.to)"
        >
          <template #prepend>
            <v-icon :icon="item.icon" />
          </template>

          <v-list-item>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item>
        </v-list-item>
      </v-list>

      <div v-show="showInstallable" class="primary pa-2 white--text">
        <span class="pb-4">You want to use Busket when you are offline without having to open your Browser?</span>
        <v-btn outlined color="white" small rounded block class="mt-2" @click="installApp">
          Sure!
        </v-btn>
        <span
          class="white--text opacity text-decoration-underline cursor-pointer"
          @click="showInstallable = false"
        >Don't show me this again!</span>
      </div>

      <template #append>
        <v-divider />
        <v-list nav>
          <v-list-item
            v-for="item in menuItems.filter((it) => it.divide)"
            :key="item.title"
            link
            @click.stop="item.to === undefined ? item.click() : tryRouteTo(item.to)"
          >
            <template #prepend>
              <v-icon :icon="item.icon" />
            </template>

            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </template>
    </v-navigation-drawer>

    <v-app-bar
      class="pl-3"
      :color="props.appbarColor"
      dark
    >
      <div v-if="permDrawer">
        <v-icon v-if="mini" icon="mdi-chevron-right" class="mr-2" @click="mini = false" />
        <v-icon v-else icon="mdi-chevron-left" class="mr-2" @click="mini = true" />
      </div>
      <div v-else>
        <v-app-bar-nav-icon class="mr-1" @click="drawer = true" />
      </div>

      <v-toolbar-title>Busket</v-toolbar-title>
      <v-spacer />
      <v-fade-transition>
        <div v-show="!feathersClient.io.connected" class="mr-3">
          <div class="fake-btn">
            Offline
          </div>
        </div>
      </v-fade-transition>
    </v-app-bar>

    <slot />
  </div>
</template>

<script lang="ts" setup>
import {
  VNavigationDrawer,
  VAppBar,
  VListItem,
  VDivider,
  VList,
  VListItemTitle,
  VBtn,
  VIcon,
  VToolbarTitle,
  VSpacer,
  VFadeTransition,
  VAppBarNavIcon,
} from 'vuetify/components';

import { LocationQueryRaw, useRoute, useRouter } from 'vue-router';
import { Md5 } from 'ts-md5';
import feathersClient, { AuthObject } from '@/feathers-client';
import { onMounted, Ref, ref, watch } from 'vue';
import { useToast } from 'vue-toastification';
import img from '@/assets/avatar-placeholder.png';

const props = withDefaults(defineProps<{
  appbarColor?: string
}>(), {
  appbarColor: 'primary',
});

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;

  prompt(): Promise<void>;
}

export interface Item {
  title: string,
  icon: string,
  to?: LocationQueryRaw,
  click?: () => void,
  divide?: boolean,
}

const baseMenuItems = [
  {
    title: 'Home',
    icon: 'mdi-home-city',
    to: { name: 'home' }
  },
  {
    title: 'My lists',
    icon: 'mdi-clipboard-list-outline',
    to: { name: 'my lists' }
  },
  {
    title: 'Github',
    icon: 'mdi-github',
    to: { name: 'github' }
  },
];

const route = useRoute();
const router = useRouter();
const toast = useToast();

const menuItems: Item[] = [];
const drawer = ref(false);
const permDrawer = ref(false);
const mini = ref(false);

const auth: Ref<AuthObject | null> = ref(null);
let installPrompt: BeforeInstallPromptEvent | null = null;
let showInstallable = false;

onMounted(() => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installPrompt = e as unknown as BeforeInstallPromptEvent;
    showInstallable = true;
  });

  setTimeout(async () => {
    auth.value = await feathersClient.get('authentication');
  }, 500);

  menuItems.push(...baseMenuItems);
  menuItems.push({
    title: 'Log in',
    icon: 'mdi-login-variant',
    to: { name: 'login' },
    divide: true,
  });
});

function gravatar(email: string): string {
  const defaultImg = window.location.origin.includes('localhost') ? 'identicon' : encodeURIComponent(`${window.location.origin}/avatar-placeholder.png`);
  return `https://www.gravatar.com/avatar/${Md5.hashStr(email.toLowerCase().trim())}?d=${defaultImg}`;
}

async function installApp(): Promise<void> {
  if (!installPrompt) return;

  await installPrompt.prompt();
  const { outcome } = await installPrompt.userChoice;

  installPrompt = null;
  showInstallable = false;

  if (outcome) toast('Thanks for installing Busket!');
}

async function logOut(): Promise<void> {
  if (await feathersClient.get('authentication') === null) {
    toast('Can\'t log out. Not logged in.');
    return;
  }
  feathersClient.authentication.logout().then(() => {
    toast('Logged out successfully.');
    window.location.reload();
  });
}

function tryRouteTo(loc: LocationQueryRaw): Promise<void> | void {
  const matchedLoc = router.resolve(loc);
  if (route.name === matchedLoc.name || route.path === matchedLoc.path) return;
  router.push(loc);
}

watch(auth, () => {
  console.log('watch', auth, !auth.value, !!auth.value);

  menuItems.length = 0;
  menuItems.push(...baseMenuItems);

  if (auth.value == null) {
    menuItems.push({
      title: 'Log in',
      icon: 'mdi-login-variant',
      to: { name: 'login' },
      divide: true,
    });
    return;
  }
  if (auth.value.user.prefersMiniDrawer) {
    permDrawer.value = true;
    mini.value = true;
  }

  menuItems.push({
    title: 'Preferences',
    icon: 'mdi-account-cog',
    to: { name: 'preferences' },
    divide: true,
  });
});

watch(permDrawer, () => {
  if (!permDrawer.value) mini.value = false;
});
</script>

<style scoped lang="scss">
$dark: #cccccc;
$white: #e8e8e8;

.skeleton {
  cursor: progress;
  height: 20px;
  width: 120px;
  border-radius: 4px;
  background: $dark;
  animation: blink infinite 2s cubic-bezier(0.65, 0, 0.35, 1);
  transition: all 1s cubic-bezier(0.65, 0, 0.35, 1);
}

@keyframes blink {
  from {
    background: $dark;
  }

  50% {
    background: $white;
  }

  to {
    background: $dark;
  }
}

.cursor-pointer {
  cursor: pointer;
}

.opacity {
  opacity: 60%;
}

.fake-btn {
  font-weight: 500;
  letter-spacing: 0.0892857143em;
  text-indent: 0.0892857143em;
  text-transform: uppercase;
  white-space: nowrap;
  opacity: 45%;
  user-select: none;
}
</style>
