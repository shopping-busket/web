<template>
  <div class="ma-auto mt-4" style="max-width: 70rem">
    <div v-for="item in items" :key="item.id">
      <v-card outlined ripple @click="openList(item.id)" :loading="item.loading" hover>
        <v-card-title class="denseTitle">{{ item.title }}</v-card-title>
        <v-card-subtitle v-show="item.description.trim() !== ''">{{
            item.description
          }}
        </v-card-subtitle>
      </v-card>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class MyLists extends Vue {
  private items = [
    {
      id: 'id',
      title: 'Shopping list',
      description: 'No description yet.',
      loading: false,
      details: {
        owner: 'ownerid',
        members: [
          {
            id: 'dsaasd',
            name: '',
          },
        ],
      },
    },
  ];

  openList (id: string): void {
    const item = this.items.find((i) => i.id === id) || null;
    if (!item) return;

    console.log(item);
    item.loading = true;
    this.$router.push(`/me/list/${item.id}`);
  }
}
</script>

<style lang="scss" scoped>
.denseTitle {
  line-height: 1.2rem;
}

</style>
