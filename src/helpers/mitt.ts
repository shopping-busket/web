import mitt from 'mitt';

type MittEvents = {
  navGuardLoading: boolean,
  connected: void,
  disconnected: void,
}

const emitter = mitt<MittEvents>();

export default emitter;
