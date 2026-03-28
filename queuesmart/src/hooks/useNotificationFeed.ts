import { useEffect, useMemo, useRef, useState } from "react";
import { getNotifications } from "../services/notifications";
import type { NotificationEvent, User } from "../types";

const POLL_INTERVAL_MS = 5000;

function getSeenStorageKey(user: Pick<User, "role" | "email">) {
  return `queuesmart.notifications.seen.v2.${user.role}.${user.email}`;
}

function getNotificationFingerprint(notification: NotificationEvent) {
  return `${notification.id}:${notification.createdAt}`;
}

function readSeenIds(key: string) {
  if (typeof window === "undefined") {
    return new Set<string>();
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return new Set<string>();
    }

    const ids = JSON.parse(raw) as string[];
    return new Set(ids.filter((value): value is string => typeof value === "string"));
  } catch {
    return new Set<string>();
  }
}

function writeSeenIds(key: string, ids: Set<string>) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(Array.from(ids).slice(-100)));
}

export function useNotificationFeed(user: Pick<User, "role" | "email"> | null) {
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<NotificationEvent[]>([]);
  const sinceRef = useRef<string | undefined>(undefined);
  const seenStorageKey = useMemo(() => (user ? getSeenStorageKey(user) : null), [user]);

  useEffect(() => {
    setNotifications([]);
    setRecentNotifications([]);
    sinceRef.current = undefined;
  }, [seenStorageKey]);

  useEffect(() => {
    if (!user || !seenStorageKey) {
      return;
    }

    let isCancelled = false;

    const pollNotifications = async () => {
      try {
        const nextNotifications = await getNotifications(user.role, user.email, sinceRef.current);
        if (isCancelled || nextNotifications.length === 0) {
          if (!sinceRef.current) {
            sinceRef.current = new Date().toISOString();
          }
          return;
        }

        const latestCreatedAt = nextNotifications[nextNotifications.length - 1]?.createdAt;
        if (latestCreatedAt) {
          sinceRef.current = latestCreatedAt;
        }

        setRecentNotifications((previous) => {
          const mergedById = new Map<number, NotificationEvent>();
          [...nextNotifications, ...previous].forEach((notification) => {
            mergedById.set(notification.id, notification);
          });

          return Array.from(mergedById.values())
            .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
            .slice(0, 20);
        });

        const seenIds = readSeenIds(seenStorageKey);
        const unseenNotifications = nextNotifications.filter((notification) => !seenIds.has(getNotificationFingerprint(notification)));

        if (unseenNotifications.length === 0) {
          return;
        }

        unseenNotifications.forEach((notification) => seenIds.add(getNotificationFingerprint(notification)));
        writeSeenIds(seenStorageKey, seenIds);

        setNotifications((previous) => {
          const knownIds = new Set(previous.map((notification) => notification.id));
          const deduped = unseenNotifications.filter((notification) => !knownIds.has(notification.id));
          return [...deduped.reverse(), ...previous].slice(0, 5);
        });
      } catch (error) {
        console.warn("Failed to load notifications", error);
      }
    };

    void pollNotifications();
    const timer = window.setInterval(() => {
      void pollNotifications();
    }, POLL_INTERVAL_MS);

    return () => {
      isCancelled = true;
      window.clearInterval(timer);
    };
  }, [seenStorageKey, user]);

  const dismissNotification = (id: number) => {
    setNotifications((previous) => previous.filter((notification) => notification.id !== id));
  };

  return {
    notifications,
    recentNotifications,
    dismissNotification,
  };
}
