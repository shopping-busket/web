import {defineStore} from 'pinia';
import {EventData, LogEvent} from '@/shoppinglist/events';
import {ref} from "vue";

export type ParanoidEventData = EventData & {
  _deleted: boolean,
}

export interface StoredEvents {
  [listId: string]: ParanoidEventData[];
}


export const useEventsStore = defineStore('events', () => {
    const eventsMap = ref<StoredEvents>({})

    /**
     * Get all events corresponding to the list with id [listId]
     */
    function getByListId(listId: string, includeDeleted: boolean = false): ReadonlyArray<ParanoidEventData> {
      const raw = eventsMap.value[listId];
      if (raw == null) return [];
      return raw.filter(e => includeDeleted || !e._deleted) as ParanoidEventData[];
    }

    function pushEvent(listId: string, eventData: EventData) {
      if (!eventsMap.value[listId]) {
        eventsMap.value[listId] = [];
      }
      eventsMap.value[listId].push({ ...eventData, _deleted: false });
    }

    function deleteEventParanoid(listId: string, eventId: string) {
      const event = getByListId(listId).find(e => e.entryId === eventId);
      console.log(`deleteEvent:`, event)
      if (event) event!._deleted = true;
    }

    function pruneDeletedParanoidEvents(listId: string) {
      const raw = eventsMap.value[listId];
      if (raw == null) return;
      eventsMap.value[listId] = raw.filter(e => !e._deleted);
    }

    function getAsLogEvents(listId: string, sessionId: string, includeDeleted: boolean = false): LogEvent[] {
      return getByListId(listId, includeDeleted).map(
        (e) =>
          ({
            listid: listId,
            eventData: {
              ...e,
              sender: sessionId,
            },
          }) as LogEvent
      );
    }

    return {
      eventsMap,
      getByListId,
      pushEvent,
      deleteEventParanoid,
      pruneDeletedParanoidEvents,
      getAsLogEvents,
    };
  },
  {
    persist: true,
  }
);
