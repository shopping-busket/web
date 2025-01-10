<template>
<div class="d-flex">
  <v-btn-toggle
    background-color="primary"
    density="compact"
    multiple
    variant="tonal"
    color="primary"
  >
    <v-btn>
      <v-icon>mdi-format-bold</v-icon>
    </v-btn>

    <v-btn>
      <v-icon>mdi-format-italic</v-icon>
    </v-btn>

    <v-btn>
      <v-icon>mdi-format-underline</v-icon>
    </v-btn>

    <v-btn>
      <v-icon>mdi-format-strikethrough</v-icon>
    </v-btn>
  </v-btn-toggle>

  <v-spacer/>
  <v-btn variant="tonal" color="primary">
    <v-icon>mdi-timer</v-icon>
  </v-btn>
</div>

</template>

<script lang="ts" setup>
const model = defineModel<string>();
</script>
