import { defineStore } from 'pinia';
import { EventData, LogEvent } from '@/shoppinglist/events';

export interface StoredEvents {
  [listId: string]: EventData[];
}

export const useEventsStore = defineStore('events', {
  state: (): StoredEvents => ({}),
  actions: {
    /**
     * Get all events corresponding to the list with id [listId]
     */
    getByListId(listId: string): EventData[] {
      return this.$state[listId] ?? [];
    },
    pushEvent(listId: string, eventData: EventData) {
      const state = this.$state[listId];
      if (state == undefined) {
        this.$state[listId] = [];
      }
      this.$state[listId].push(eventData);
    },
    getAsLogEvents(listId: string, sessionId: string): LogEvent[] {
      return this.getByListId(listId).map((e) => ({
        listid: listId,
        eventData: {
          ...e,
          sender: sessionId,
        },
      } as LogEvent));
    },
  },
  persist: true,
});
