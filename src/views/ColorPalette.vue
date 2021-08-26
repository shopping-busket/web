<template>
  <div>
    <div class="d-flex flex-row">
      <div v-for="color of palettes[curIdx]" :key="color">
        <v-hover v-slot="{ hover }">
          <v-sheet
            width="381.1px"
            height="calc(100vh - 64px)"
            elevation="0"
            class="text-center justify-center align-center d-flex"
            :class="{ 'on-hover': hover }"
            :color="color"
          >
            <div :class="{'show-btns': hover}">
              <v-btn dark elevation="0" class="mr-2" rounded @click="setPrimary(color)">
                <v-icon class="mr-1">mdi-palette</v-icon>
                Set primary
              </v-btn>
            </div>
          </v-sheet>
        </v-hover>
      </div>
    </div>

    <div class="ma-4">
      <v-btn color="primary" dark>Hello World</v-btn>
      <v-btn color="primary" dark outlined>Hello World</v-btn>
      <v-btn color="primary" dark depressed>Hello World</v-btn>
      <v-btn color="primary" dark plain>Hello World</v-btn>
      <v-btn color="primary" dark text>Hello World</v-btn>
      <v-checkbox color="primary" label="Checkbox">Hello World</v-checkbox>
      <v-text-field color="primary" label="Busket">Hello World</v-text-field>
      <v-text-field color="primary" label="Busket" outlined>Hello World</v-text-field>
      <v-textarea color="primary" outlined>Hello World</v-textarea>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import MainContainer from '@/components/MainContainer.vue';

@Component({
  components: { MainContainer },
})
export default class About extends Vue {
  private palettes = [
    [
      '#20A879',
      '#01916D',
      '#09967D',
      '#11A697',
      '#418F91',
    ],
    [
      '#06476E',
      '#096F8F',
      '#3298A9',
      '#65C2BD',
      '#9FEBCF',
    ],
    [
      '#FBCF5D',
      '#F9AC41',
      '#F68730',
      '#F05D2C',
      '#E62431',
    ],
  ];
  private curIdx = 0;

  mounted (): void {
    window.addEventListener('keyup', (e) => {
      console.log(e);
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
        this.nextPaletteIndex();
      }
    });
  }

  setPrimary (color: string): void {
    this.$vuetify.theme.themes.light.primary = color;
  }

  nextPaletteIndex (): void {
    if (this.curIdx === this.palettes.length - 1) {
      this.curIdx = 0;
      return;
    }

    this.curIdx++;
  }
}
</script>

<style scoped>
v-sheet {
  color: transparent !important;
  cursor: pointer;
  transition: all .35s;
}

.v-sheet > div {
  display: none;
  transition: all .25s;
}

.show-btns {
  display: block !important;
  transition: all .25s;
}
</style>
