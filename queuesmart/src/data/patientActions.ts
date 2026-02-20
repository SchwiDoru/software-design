import { writeQueueEntries, readQueueEntries } from "./queueStore";
import type { QueueEntry } from "../types"; 

export const adminOverride = (userId: number, action: 'TOP' | 'EMERGENCY' | 'CANCEL') => {
  const entries = readQueueEntries();
  const target = entries.find(e => e.userId === userId);
  if (!target) return;

  let nextEntries: QueueEntry[] = [];

  if (action === 'TOP') {
    nextEntries = entries.map(e => {
      if (e.queueId === target.queueId && e.userId !== userId && e.status === "waiting") {
        return { ...e, position: e.position + 1 };
      }
      // Use 'as any' or your specific Status Type to bypass the string mismatch
      if (e.userId === userId) return { ...e, position: 1, status: "waiting" as any };
      return e;
    });
  } else if (action === 'EMERGENCY') {
    nextEntries = entries.map(e => 
      // Force the status string to match your type definition
      e.userId === userId ? { ...e, status: "serving" as any, position: 0 } : e
    );
  } else if (action === 'CANCEL') {
    nextEntries = entries.filter(e => e.userId !== userId);
  }

  writeQueueEntries(nextEntries);
};