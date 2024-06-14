<template>
  <div class="d-flex justify-center align-center h-100 flex-column">
    <span class="pb-3" style="opacity: 60%">
      <span v-if="invalidSecret">
        Invalid, expired or used share link.
      </span>
      <span v-else-if="error">
        An unknown error occurred!
      </span>
      <span v-else>
        Joining...
      </span>
    </span>
    <v-progress-circular v-if="!(invalidSecret || error)" color="primary" indeterminate size="40" />
  </div>
</template>

<script lang="ts" setup>
import { VProgressCircular } from 'vuetify/components';
import { inject, onMounted, ref } from 'vue';
import feathersClient, { FeathersError, Service } from '@/feathers-client';
import { UserWhitelist } from '@/components/ShareDialog.vue';
import { Route } from '@/router';
import { useRouter } from 'vue-router';
import { userInjection } from '@/helpers/injectionKeys';

const props = defineProps<{
  secret: string,
  whitelistId: string,
  id: string,
}>();

const router = useRouter();
const invalidSecret = ref(false);
const error = ref(false);
const user = inject(userInjection);

onMounted(async () => {
  try {
    await feathersClient.service(Service.WHITELISTED_USERS).patch(props.whitelistId, {
      inviteSecret: props.secret,
    } as Partial<UserWhitelist>);
    await routeToList();
  } catch (e) {
    if ((e as FeathersError).code === 400) {
      const whitelisted = await feathersClient.service(Service.WHITELISTED_USERS).find({
        query: {
          listId: props.id,
        },
      }) as UserWhitelist[];

      if (whitelisted.map(w => w.user).includes(user?.uuid)) {
        await routeToList();
        return;
      }

      console.log('inviteSecret invalid!');
      invalidSecret.value = true;
    }
    error.value = true;
  }
});

async function routeToList() {
  await router.push({
    name: Route.DISPLAY_LIST,
    params: { id: props.id }
  });
}
</script>
