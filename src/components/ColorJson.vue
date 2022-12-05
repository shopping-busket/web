<template>
  <span ref="content" />
</template>

<script lang="ts" setup>
import { onMounted, Ref, ref } from 'vue';

enum TokenColors {
  BOOLEAN = 'rgb(170,177,190)',
  STRING = '#97c278',
  NULL = '#c577dc',
  DEFAULT = '#cc9865',
}

const props = defineProps<{
  input: string;
}>();

const content: Ref<HTMLSpanElement | null> = ref(null);

onMounted(() => {
  if (!content.value) return;
  content.value.innerHTML = syntaxHighlight(props.input);
});

function syntaxHighlight(inp: string) {
  const json = inp.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, (match) => {
    let stl = TokenColors.DEFAULT;
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        stl = TokenColors.BOOLEAN;
      } else {
        stl = TokenColors.STRING;
      }
    } else if (/true|false/.test(match)) {
      stl = TokenColors.BOOLEAN;
    } else if (/null/.test(match)) {
      stl = TokenColors.NULL;
    }
    return `<span style="color: ${stl} !important;">${match}</span>`;
  });
}
</script>
