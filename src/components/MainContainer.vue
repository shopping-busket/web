<template>
  <div style="height: 100vh">
    <v-navigation-drawer
      app
      v-model="drawer"
      :temporary="!permDrawer"
      :permanent="permDrawer"
      :mini-variant.sync="mini"
    >
      <v-list-item class="px-2">
        <v-list-item-avatar>
          <v-img :src="auth.user.avatarURI" v-if="!!auth && auth.user.avatarURI !== null"></v-img>
          <v-img src="@/assets/avatar-placeholder.png" v-else></v-img>
        </v-list-item-avatar>

        <v-list-item-title>
          <div v-if="!!auth">
            {{ auth.user.fullName }}
            <v-icon color="red" @click="logOut" title="Logout" small>mdi-logout-variant</v-icon>
          </div>
          <div class="skeleton" title="Loading..." aria-placeholder="Loading..." v-else></div>
        </v-list-item-title>

        <v-btn
          icon
          @click.stop="drawer = !drawer"
          v-if="!permDrawer"
        >
          <v-icon>mdi-chevron-left</v-icon>
        </v-btn>
        <v-btn
          icon
          @click.stop="mini = !mini"
          v-else
        >
          <v-icon>mdi-chevron-left</v-icon>
        </v-btn>
      </v-list-item>

      <v-divider></v-divider>

      <v-list nav>
        <v-list-item
          v-for="item in items.filter((it) => !it.divide)"
          :key="item.title"
          link
          @click="item.to === undefined ? item.click() : tryRouteTo(item.to)"
        >
          <v-list-item-icon>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>

      <div class="primary pa-2 white--text" v-show="showInstallable">
        <span class="pb-4">You want to use Busket when you are offline without having to open your Browser?</span>
        <v-btn outlined color="white" small rounded block @click="installApp" class="mt-2">Sure!</v-btn>
        <span class="white--text opacity text-decoration-underline cursor-pointer" @click="showInstallable = false">Don't show me this again!</span>
      </div>

      <template v-slot:append>
        <v-divider/>
        <v-list nav>
          <v-list-item
            v-for="item in items.filter((it) => it.divide)"
            :key="item.title"
            link
            @click="item.to === undefined ? item.click() : tryRouteTo(item.to)"
          >
            <v-list-item-icon>
              <v-icon>{{ item.icon }}</v-icon>
            </v-list-item-icon>

            <v-list-item-content>
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </template>
    </v-navigation-drawer>

    <v-app-bar
      :color="appbarColor"
      dark
    >
      <div v-if="permDrawer">
        <v-icon @click="mini = false" class="mr-2" v-if="mini">mdi-chevron-right</v-icon>
        <v-icon @click="mini = true" class="mr-2" v-else>mdi-chevron-left</v-icon>
      </div>
      <div v-else>
        <v-app-bar-nav-icon @click="drawer = true" class="mr-1"></v-app-bar-nav-icon>
      </div>

      <v-toolbar-title>Busket</v-toolbar-title>
    </v-app-bar>

    <slot></slot>
  </div>
</template>

<script lang="ts">
import {
  Component,
  Prop,
  Vue,
  Watch,
} from 'vue-property-decorator';
import { RawLocation } from 'vue-router';
import feathersClient, { AuthObject } from '@/feathers-client';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;

  prompt (): Promise<void>;
}

export interface Item {
  title: string,
  icon: string,
  to?: RawLocation,
  click?: () => void,
  divide?: boolean,
}

@Component({})
export default class MainContainer extends Vue {
  @Prop({ required: false, default: 'primary' }) private appbarColor: undefined | string;
  protected items: Item[] = [
    { title: 'Home', icon: 'mdi-home-city', to: { name: 'home' } },
    { title: 'My lists', icon: 'mdi-clipboard-list-outline', to: { name: 'my lists' } },
    { title: 'About', icon: 'mdi-information-outline', to: { name: 'about' } },
    { title: 'Github', icon: 'mdi-github', to: { name: 'github' } },
  ];
  private drawer = false;
  private permDrawer = false;
  private mini = false;
  private auth: AuthObject | null = null;
  private installPrompt: BeforeInstallPromptEvent | null = null;
  private showInstallable = false;

  async mounted (): Promise<void> {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPrompt = e as unknown as BeforeInstallPromptEvent;
      this.showInstallable = true;
    });

    setTimeout(async () => {
      this.auth = await feathersClient.get('authentication');
    }, 500);
  }

  async installApp (): Promise<void> {
    if (!this.installPrompt) return;

    await this.installPrompt.prompt();
    const { outcome } = await this.installPrompt.userChoice;

    this.installPrompt = null;
    this.showInstallable = false;

    console.log('User choice: ', outcome);
    if (outcome) {
      this.$toast('Thanks for installing Busket!');
    }
  }

  @Watch('auth')
  authWatcher (): void {
    console.log('watch', this.auth, !this.auth, !!this.auth);
    if (!this.auth) {
      this.items.push({
        title: 'Log in',
        icon: 'mdi-login-variant',
        to: { name: 'login' },
        divide: true,
      });
      return;
    }
    if (this.auth.user.prefersMiniDrawer) {
      this.permDrawer = true;
      this.mini = true;
    }

    this.items.push({
      title: 'Preferences',
      icon: 'mdi-account-cog',
      to: { name: 'preferences' },
      divide: true,
    });
  }

  @Watch('permDrawer')
  watchPermDrawer (): void {
    if (!this.permDrawer) this.mini = false;
  }

  async logOut (): Promise<void> {
    if (await feathersClient.get('authentication') === null) {
      this.$toast('Can\'t log out. Not logged in.');
      return;
    }
    feathersClient.authentication.logout().then(() => {
      this.$toast('Logged out successfully.');
      window.location.reload();
    });
  }

  tryRouteTo (loc: RawLocation): Promise<void> | void {
    const matchedLoc = this.$router.match(loc);
    if (this.$route.name === matchedLoc.name || this.$route.path === matchedLoc.path) return;
    this.$router.push(loc);
  }
}
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
</style>
