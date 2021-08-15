<template>
  <div>
    <MainContainer>
      Hello
    </MainContainer>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import MainContainer from '@/components/MainContainer.vue';

@Component({
  components: {
    MainContainer,
  },
})
export default class Home extends Vue {}
</script>
