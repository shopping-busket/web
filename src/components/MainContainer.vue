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
          <v-img :src="profile.avatar"></v-img>
        </v-list-item-avatar>

        <v-list-item-title>{{ profile.fullName }}</v-list-item-title>

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
          @click="$router.push(item.to)"
        >
          <v-list-item-icon>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>

      <template v-slot:append>
        <v-divider/>
        <v-list nav>
          <v-list-item
            v-for="item in items.filter((it) => it.divide)"
            :key="item.title"
            link
            @click="$router.push(item.to)"
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
import { Location } from 'vue-router';

export interface Item {
  title: string,
  icon: string,
  to: string | Location
  divide?: boolean
}

@Component({})
export default class MainContainer extends Vue {
  @Prop({ required: false, default: 'primary' }) private appbarColor: undefined | string;
  private items: Item[] = [
    { title: 'Home', icon: 'mdi-home-city', to: { name: 'home' } },
    { title: 'My lists', icon: 'mdi-clipboard-list-outline', to: { name: 'my lists' } },
    { title: 'About', icon: 'mdi-information-outline', to: { name: 'about' } },
    { title: 'Github', icon: 'mdi-github', to: { name: 'github' } },
    {
      title: 'Preferences',
      icon: 'mdi-account-cog',
      to: { name: 'preferences' },
      divide: true,
    },
  ];
  private profile = {
    displayName: 'justmedev',
    fullName: 'Ilja Busch',
    avatar: 'https://randomuser.me/api/portraits/men/49.jpg',
  } // TODO: Fetch profile from backend user db
  private drawer = false;
  private permDrawer = false;
  private mini = false;

  @Watch('permDrawer')
  watchPermDrawer (): void {
    if (!this.permDrawer) this.mini = false;
  }
}
</script>

<style scoped>

</style>
