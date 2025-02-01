import mitt from 'mitt';
import { AuthObject } from '@/feathers-client';

type MittEvents = {
  navGuardLoading: boolean,
  authenticationChanged: AuthObject | null,
}

const emitter = mitt<MittEvents>();

export default emitter;
