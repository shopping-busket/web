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

        <template v-if="props.editable">
          <v-btn v-if="!model.frontend?.isEditing"
            icon="mdi-pencil" variant="text" density="compact"
                 @click="toggleEditModeAndSave()"
          />
          <v-btn icon="mdi-trash-can-outline" variant="text" density="compact" class="ml-2"
                 @click="deleteStepDialog = true"
          />
        </template>
      </div>
    </v-card-title>

    <v-card-text v-if="model.frontend?.isEditing">
      <RichTextEditor v-model="model.content" />

      <v-btn block color="primary" variant="tonal" class="mt-2" @click="toggleEditModeAndSave">
        Save
      </v-btn>
    </v-card-text>
    <v-card-text v-else class="tiptap ml-2" style="margin-top: -0.5rem">
      <div v-html="model.content" />
    </v-card-text>
  </v-card>

  <v-dialog v-model="deleteStepDialog" max-width="500px">
    <v-card
      :title="`Are you sure?`"
      subtitle="You cannot undo the deletion of a step!"
    >
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" color="primary" @click="deleteStepDialog = false">
          Cancel
        </v-btn>

        <v-btn
          color="primary"
          variant="outlined"
          @click="deleteStep(); deleteStepDialog = false"
        >
          Yes, I am sure
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { IRecipeStep } from '@/shoppinglist/recipes/types';
import feathersClient, { Service } from '@/feathers-client';
import _ from 'lodash';
import RichTextEditor from '@/components/RichTextEditor.vue';
import { ref } from 'vue';
import { VBtn, VCard, VDialog, VSpacer } from 'vuetify/components';

const model = defineModel<IRecipeStep>({ required: true });
const emit = defineEmits(['deleted']);
const props = defineProps<{
  number: number;
  editable: boolean;
}>();

const deleteStepDialog = ref(false);

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
