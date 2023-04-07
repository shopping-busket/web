<template>
  <div class="d-flex justify-center align-center h-100 flex-column">
    <span class="mb-3" style="opacity: 60%">Joining...</span>
    <v-progress-circular indeterminate color="primary" size="40" />
  </div>
</template>

<script setup lang="ts">
import { VProgressCircular } from 'vuetify/components';
import { onMounted } from 'vue';
import feathersClient, { Service } from '@/feathers-client';
import { UserWhitelist } from '@/components/ShareDialog.vue';
import { Route } from '@/router';
import { useRouter } from 'vue-router';

const props = defineProps<{
  secret: string,
  whitelistId: string,
  id: string,
}>();

const router = useRouter();

onMounted(async () => {
  const res = await feathersClient.service(Service.WHITELISTED_USERS).patch(props.whitelistId, {
    inviteSecret: props.secret,
  } as Partial<UserWhitelist>) as UserWhitelist;

  console.log(res);
  console.log('Joined list!');

  await router.push({ name: Route.DISPLAY_LIST, params: { id: props.id } });
});
</script>
