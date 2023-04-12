<template>
  <div class="d-flex justify-center align-center h-100 flex-column">
    <span class="mb-3" style="opacity: 60%">
      <span v-if="invalidSecret">
        Invalid or expired share link.
      </span>
      <span v-else-if="error">
        An unknown error occurred!
      </span>
      <span>
        Joining...
      </span>
    </span>
    <v-progress-circular v-if="!(invalidSecret || error)" indeterminate color="primary" size="40" />
  </div>
</template>

<script setup lang="ts">
import { VProgressCircular } from 'vuetify/components';
import { onMounted, ref } from 'vue';
import feathersClient, { FeathersError, Service } from '@/feathers-client';
import { UserWhitelist } from '@/components/ShareDialog.vue';
import { Route } from '@/router';
import { useRouter } from 'vue-router';

const props = defineProps<{
  secret: string,
  whitelistId: string,
  id: string,
}>();

const router = useRouter();
const invalidSecret = ref(false);
const error = ref(false);

onMounted(async () => {
  try {
    await feathersClient.service(Service.WHITELISTED_USERS).patch(props.whitelistId, {
      inviteSecret: props.secret,
    } as Partial<UserWhitelist>);

    await router.push({
      name: Route.DISPLAY_LIST,
      params: { id: props.id }
    });
  } catch (e) {
    if ((e as FeathersError).code === 403) {
      console.log('inviteSecret invalid!');
      invalidSecret.value = true;
    }
    error.value = true;
  }
});
</script>
