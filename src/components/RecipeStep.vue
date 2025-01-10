<template>
  <v-card :variant="model.frontend?.isEditing ? 'elevated' : 'outlined'">
    <v-img
      color="surface-variant"
      height="150"
      src="https://cdn.vuetifyjs.com/docs/images/cards/purple-flowers.jpg"
      cover
    />

    <v-card-title class="w-100">
      <div class="d-flex flex-row w-100">
        <v-text-field
          v-if="model.frontend?.isEditing"
          v-model="model.title"
          label="Title"
          class="w-100"
          variant="underlined" color="primary" density="compact"
        />
        <div v-else class="w-100">
          Step {{ props.number }}: {{ model.title }}
        </div>

        <v-btn icon="mdi-pencil" variant="text" density="compact"
               @click="toggleEditModeAndSave()"
        />
        <v-btn icon="mdi-trash-can-outline" variant="text" density="compact" class="ml-2"
               @click="deleteStep()"
        />
      </div>
    </v-card-title>

    <v-card-text v-if="model.frontend?.isEditing">
      <RichTextEditor v-model="content"/>
    </v-card-text>
    <v-card-text v-else v-html="model.content" />
  </v-card>
</template>

<script lang="ts" setup>
import { IRecipeStep } from '@/shoppinglist/recipes/types';
import feathersClient, { Service } from '@/feathers-client';
import _ from 'lodash';
import RichTextEditor from '@/components/RichTextEditor.vue';

const model = defineModel<IRecipeStep>({ required: true });
const emit = defineEmits(['deleted']);
const props = defineProps<{
  number: number;
}>();

async function toggleEditModeAndSave() {
  model.value.frontend = { isEditing: !model.value.frontend?.isEditing };
  if (!model.value.frontend.isEditing) {
    await feathersClient.service(Service.RECIPE_STEPS).patch(
      model.value.id,
      _(model.value).omitBy(_.isNull).omit('frontend').value()
    );
  }
}

async function deleteStep() {
  await feathersClient.service(Service.RECIPE_STEPS).remove(model.value.id);
  emit('deleted');
}
</script>
