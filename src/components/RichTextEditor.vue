<template>
  <div class="d-flex">
    <v-btn-toggle
      background-color="primary"
      density="compact"
      multiple
      variant="tonal"
      color="primary"
    >
      <v-btn @click="editor?.chain().focus().toggleBold().run()">
        <v-icon>mdi-format-bold</v-icon>
      </v-btn>

      <v-btn @click="editor?.chain().focus().toggleItalic().run()">
        <v-icon>mdi-format-italic</v-icon>
      </v-btn>

      <v-btn @click="editor?.chain().focus().toggleUnderline().run()">
        <v-icon>mdi-format-underline</v-icon>
      </v-btn>

      <v-btn @click="editor?.chain().focus().toggleStrike().run()">
        <v-icon>mdi-format-strikethrough</v-icon>
      </v-btn>
    </v-btn-toggle>

    <v-btn-toggle
      class="ml-2"
      background-color="primary"
      density="compact"
      multiple
      variant="tonal"
      color="primary"
    >
      <v-btn @click="editor?.chain().focus().toggleBulletList().run()">
        <v-icon>mdi-format-list-bulleted</v-icon>
      </v-btn>

      <v-btn @click="editor?.chain().focus().toggleOrderedList().run()">
        <v-icon>mdi-format-list-numbered</v-icon>
      </v-btn>
    </v-btn-toggle>

    <v-btn-toggle
      class="ml-2"
      background-color="primary"
      density="compact"
      multiple
      variant="tonal"
      color="primary"
    >
      <v-btn @click="editor?.chain().focus().toggleBlockquote().run()">
        <v-icon>mdi-format-quote-close</v-icon>
      </v-btn>
    </v-btn-toggle>

    <v-spacer />
    <v-btn variant="tonal" color="primary">
      <v-icon>mdi-timer</v-icon>
    </v-btn>
  </div>

  <editor-content v-if="editor" class="w-100 border rounded mt-2" :editor="editor" />
</template>

<script lang="ts" setup>
import { EditorContent, useEditor } from '@tiptap/vue-3';
import { onMounted, onUnmounted, watch } from 'vue';
import StarterKit from '@tiptap/starter-kit';

const props = defineProps<{
  modelValue: string
}>();
const emit = defineEmits<{
  'update:modelValue': [v: string];
}>();

watch([props.modelValue], () => {
  editor.value?.commands.setContent(props.modelValue, false);
});

const editor = useEditor({
  extensions: [StarterKit],
  onUpdate: () => {
    emit('update:modelValue', editor.value?.getHTML() ?? '');
  }
});

onMounted(() => {
  editor.value?.commands.setContent(props.modelValue, false);
});

onUnmounted(() => {
  editor.value?.destroy();
});
</script>
