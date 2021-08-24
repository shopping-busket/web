<template>
  <div>Hello WOrld</div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class ListLogs extends Vue {
  public makeLog (): void {
    console.log('exec');
  }
}
</script>
