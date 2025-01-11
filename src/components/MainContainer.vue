<template>
  <div style="height: 100%">
    <v-navigation-drawer
      v-model="drawer"
      :rail="mini"
      :permanent="mini"
      :temporary="!mini"
      app
      expand-on-hover
    >
      <v-list-item
        :prepend-avatar="auth?.user.avatarURI ?? img"
        nav
      >
        <v-list-item-title>
          <span v-if="auth === null || auth === undefined">
            Not logged in
          </span>
          <span v-else>
            {{ auth?.user?.fullName }}
          </span>
        </v-list-item-title>
        <template #append>
          <v-btn
            icon="mdi-chevron-left"
            variant="text"
            @click.stop="drawer = !drawer"
          />
        </template>
      </v-list-item>

      <v-divider />

      <v-list nav>
        <v-list-item
          v-for="item in menuItems.filter((it: MenuItem) => !it.divide)"
          :key="item.title"
          link
          @click.stop="item.to === undefined ? item.click?.call(null) : tryRouteTo(item.to)"
        >
          <template #prepend>
            <v-icon :icon="item.icon" />
          </template>

          <v-list-item>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item>
        </v-list-item>
      </v-list>

      <div
        v-if="showInstallable"
        class="primary pa-2 white--text d-flex align-center justify-center text-center flex-column"
      >
        <v-divider class="mb-2 w-100" />
        <span class="pb-4">Want to use Busket offline or without having to open your Browser?</span>
        <v-btn block class="mt-2" color="primary" variant="tonal" rounded small @click="installApp">
          Install Busket
        </v-btn>
        <a
          class="white--text opacity text-decoration-underline cursor-pointer"
          @click.prevent="dontShowBannerAgain()"
        >Don't show me this again!</a>
        <v-divider class="mt-2 w-100" />
      </div>

      <template #append>
        <v-divider />
        <v-list nav>
          <v-list-item
            v-for="item in menuItems.filter((it: MenuItem) => it.divide)"
            :key="item.title"
            link
            @click.stop="item.to == null ? clickItemAsync(item) : tryRouteTo(item.to)"
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
      :color="props.appbarColor"
      class="pl-3"
      dark
    >
      <v-app-bar-nav-icon class="mr-1" @click="drawer = true" />

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
  VAppBar,
  VAppBarNavIcon,
  VBtn,
  VDivider,
  VFadeTransition,
  VIcon,
  VList,
  VListItem,
  VListItemTitle,
  VNavigationDrawer,
  VSpacer,
  VToolbarTitle,
} from 'vuetify/components';

import { RouteLocationAsRelativeGeneric, useRoute, useRouter } from 'vue-router';
import feathersClient, { AuthObject } from '@/feathers-client';
import { inject, onMounted, Ref, ref, watch } from 'vue';
import { useToast } from 'vue-toastification';
import img from '@/assets/avatar-placeholder.png';
import { authenticationInjection } from '@/helpers/injectionKeys';
import { Route } from '@/router';

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

interface MenuItem {
  title: string,
  icon: string,
  to?:  RouteLocationAsRelativeGeneric,
  click?: () => void | Promise<void>,
  divide?: boolean,
}

const baseMenuItems: MenuItem[] = [
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
    title: 'Recipes',
    icon: 'mdi-chef-hat',
    to: { name: Route.MY_RECIPES }
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

const menuItems: MenuItem[] = [];
const drawer = ref(false);
const mini = ref(false);

const auth: Ref<AuthObject | null> = ref(inject(authenticationInjection, null) as AuthObject);
let installPrompt: BeforeInstallPromptEvent | null = null;
let showInstallable = false;
const SHOW_INSTALL_APP_BANNER_STORE_KEY = 'showInstallAppBanner';

onMounted(() => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installPrompt = e as unknown as BeforeInstallPromptEvent;
    showInstallable = getShowInstallBannerStore();
  });

  if (process.env.NODE_ENV === 'development') {
    baseMenuItems.push(
      {
        icon: 'mdi-api',
        title: 'Backend Tools',
        to: { name: Route.FEATHERS_TESTING }
      },
    );
  }

  menuItems.push(...baseMenuItems);
  menuItems.push({
    title: 'Log in',
    icon: 'mdi-login-variant',
    to: { name: 'login', query: { redirect: route.path } },
    divide: true,
  });

  if (auth.value) authChangeListener();
});

function getShowInstallBannerStore() {
  let showInstallAppBannerStr = localStorage.getItem(SHOW_INSTALL_APP_BANNER_STORE_KEY);
  if (showInstallAppBannerStr == null) {
    showInstallAppBannerStr = 'true';
    localStorage.setItem(SHOW_INSTALL_APP_BANNER_STORE_KEY, showInstallAppBannerStr);
  }

  return showInstallAppBannerStr === 'true';
}

function dontShowBannerAgain() {
  showInstallable = false;
  localStorage.setItem(SHOW_INSTALL_APP_BANNER_STORE_KEY, 'false');
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
  feathersClient.authentication.logout()
    .then(() => {
      toast('Logged out successfully.');
      window.location.reload();
    });
}

function tryRouteTo(loc: RouteLocationAsRelativeGeneric): Promise<void> | void {
  const matchedLoc = router.resolve(loc);
  if (route.name === matchedLoc.name || route.path === matchedLoc.path) return;
  router.push(loc);
}

async function clickItemAsync(item: MenuItem) {
  if (item.click) await item.click();
}

function authChangeListener() {
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
    mini.value = true;
  }

  menuItems.push({
    title: 'Preferences',
    icon: 'mdi-account-cog',
    to: { name: 'preferences' },
    divide: true,
  }, {
    title: 'Logout',
    icon: 'mdi-logout-variant',
    click: logOut,
    divide: true,
  });
}

watch(auth, authChangeListener, { deep: true });
</script>

<style lang="scss" scoped>
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
