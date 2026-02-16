import type { Queue, QueueEntry } from "../types";
import { MOCK_ENTRIES, MOCK_QUEUES } from "./mockData";

const QUEUES_KEY = "queuesmart.queues";
const ENTRIES_KEY = "queuesmart.entries";
const STORE_EVENT = "queuesmart:store-updated";

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const hasWindow = () => typeof window !== "undefined";

const parseStored = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) {
    return clone(fallback);
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return clone(fallback);
  }
};

const seedStore = () => {
  if (!hasWindow()) {
    return;
  }

  if (!window.localStorage.getItem(QUEUES_KEY)) {
    window.localStorage.setItem(QUEUES_KEY, JSON.stringify(clone(MOCK_QUEUES)));
  }

  if (!window.localStorage.getItem(ENTRIES_KEY)) {
    window.localStorage.setItem(ENTRIES_KEY, JSON.stringify(clone(MOCK_ENTRIES)));
  }
};

const notifyStoreUpdate = () => {
  if (!hasWindow()) {
    return;
  }

  window.dispatchEvent(new CustomEvent(STORE_EVENT));
};

export const readQueues = (): Queue[] => {
  if (!hasWindow()) {
    return clone(MOCK_QUEUES);
  }

  seedStore();
  return parseStored(window.localStorage.getItem(QUEUES_KEY), MOCK_QUEUES);
};

export const writeQueues = (queues: Queue[]) => {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.setItem(QUEUES_KEY, JSON.stringify(queues));
  notifyStoreUpdate();
};

export const readQueueEntries = (): QueueEntry[] => {
  if (!hasWindow()) {
    return clone(MOCK_ENTRIES);
  }

  seedStore();
  return parseStored(window.localStorage.getItem(ENTRIES_KEY), MOCK_ENTRIES);
};

export const writeQueueEntries = (entries: QueueEntry[]) => {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  notifyStoreUpdate();
};

export const subscribeQueueStore = (listener: () => void) => {
  if (!hasWindow()) {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === QUEUES_KEY || event.key === ENTRIES_KEY) {
      listener();
    }
  };

  const handleStoreEvent = () => listener();

  window.addEventListener("storage", handleStorage);
  window.addEventListener(STORE_EVENT, handleStoreEvent);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(STORE_EVENT, handleStoreEvent);
  };
};
