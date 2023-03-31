<template>
  List {{ props.id }} not found
</template>

<script lang="ts" setup>
const props = defineProps<{
  id: string,
}>();
</script>
