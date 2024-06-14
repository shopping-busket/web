import mitt from 'mitt';

type MittEvents = {
  navGuardLoading: boolean
}

const emitter = mitt<MittEvents>();

export default emitter;
