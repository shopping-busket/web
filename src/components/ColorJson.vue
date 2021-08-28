<template>
  <span ref="content"></span>
</template>

<script lang="ts">

import {
  Component,
  Prop,
  Vue,
} from 'vue-property-decorator';

@Component
export default class ColorJson extends Vue {
  @Prop({ required: true, type: String }) private input: string | undefined;

  mounted (): void {
    if (!this.input) return;
    (this.$refs.content as HTMLSpanElement).innerHTML = this.syntaxHighlight(this.input);
  }

  syntaxHighlight (inp: string): string {
    const json = inp.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, (match) => {
      let stl = '#cc9865';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          stl = 'rgb(170,177,190)'; // bool
        } else {
          stl = '#97c278'; // string
        }
      } else if (/true|false/.test(match)) {
        stl = '#c577dc'; // bool
      } else if (/null/.test(match)) {
        stl = '#c577dc'; // null
      }
      return `<span style="color: ${stl} !important;">${match}</span>`;
    });
  }
}
</script>
