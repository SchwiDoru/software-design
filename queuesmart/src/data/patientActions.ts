import { writeQueueEntries, readQueueEntries } from "./queueStore";
import type { QueueEntry } from "../types"; 

export const adminOverride = (userId: string, action: 'TOP' | 'EMERGENCY' | 'CANCEL') => {
  const entries = readQueueEntries();
  const target = entries.find(e => e.userId === userId);
  if (!target) return;

  let nextEntries: QueueEntry[] = [];

  if (action === 'TOP') {
    nextEntries = entries.map(e => {
      if (e.queueId === target.queueId && e.userId !== userId && e.status === "Waiting") {
        return { ...e, position: (e.position ?? 0) + 1 };
      }
      if (e.userId === userId) return { ...e, position: 1, status: "Waiting" };
      return e;
    });
  } else if (action === 'EMERGENCY') {
    nextEntries = entries.map(e => 
      e.userId === userId ? { ...e, status: "InProgress", position: 0 } : e
    );
  } else if (action === 'CANCEL') {
    nextEntries = entries.filter(e => e.userId !== userId);
  }

  writeQueueEntries(nextEntries);
};
