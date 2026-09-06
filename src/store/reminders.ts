import { isRunningInExpoGo } from 'expo';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { isUpcoming } from '@/api/tmdb';
import { useMyList, type SavedItem } from '@/store/my-list';
import { usePreferences } from '@/store/preferences';

const TAG = 'release-reminder';
const NOTIFY_HOUR = 9;

export const REMINDERS_SUPPORTED = Platform.OS !== 'web' && !isRunningInExpoGo();

type NotificationsModule = typeof import('expo-notifications');

let modulePromise: Promise<NotificationsModule | null> | null = null;

// expo-notifications throws from a module side effect when imported in expo go on android,
// so it stays a dynamic import that is never reached unless reminders are supported
function loadNotifications(): Promise<NotificationsModule | null> {
  if (!REMINDERS_SUPPORTED) return Promise.resolve(null);

  modulePromise ??= import('expo-notifications')
    .then((notifications) => {
      notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });
      return notifications;
    })
    .catch(() => null);

  return modulePromise;
}

function notifyAt(dateString: string): Date | null {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(NOTIFY_HOUR, 0, 0, 0);
  return date > new Date() ? date : null;
}

export async function requestReminderPermission(): Promise<boolean> {
  const notifications = await loadNotifications();
  if (!notifications) return false;

  const current = await notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await notifications.requestPermissionsAsync();
  return asked.granted;
}

function pendingReleases(items: SavedItem[]): SavedItem[] {
  return items.filter((item) => item.date && isUpcoming(item.date));
}

async function syncReminders(items: SavedItem[], enabled: boolean): Promise<void> {
  const notifications = await loadNotifications();
  if (!notifications) return;

  const scheduled = await notifications.getAllScheduledNotificationsAsync().catch(() => []);
  const ours = scheduled.filter((request) => request.content.data?.tag === TAG);

  if (!enabled) {
    await Promise.all(
      ours.map((request) => notifications.cancelScheduledNotificationAsync(request.identifier)),
    );
    return;
  }

  const wanted = pendingReleases(items);
  const wantedIds = new Set(wanted.map((item) => item.id));
  const existingIds = new Set(
    ours.map((request) => request.content.data?.mediaId).filter((id): id is number => typeof id === 'number'),
  );

  await Promise.all(
    ours
      .filter((request) => !wantedIds.has(request.content.data?.mediaId as number))
      .map((request) => notifications.cancelScheduledNotificationAsync(request.identifier)),
  );

  await Promise.all(
    wanted
      .filter((item) => !existingIds.has(item.id))
      .map((item) => {
        const date = notifyAt(item.date);
        if (!date) return Promise.resolve(null);
        return notifications
          .scheduleNotificationAsync({
            content: {
              title: 'Out today',
              body: `${item.title} is released today.`,
              data: { tag: TAG, mediaId: item.id, mediaType: item.mediaType },
            },
            trigger: { type: notifications.SchedulableTriggerInputTypes.DATE, date },
          })
          .catch(() => null);
      }),
  );
}

export function useReleaseReminders(): void {
  const { items, ready: listReady } = useMyList();
  const { preferences, ready: prefsReady } = usePreferences();

  useEffect(() => {
    if (!listReady || !prefsReady) return;
    void syncReminders(items, preferences.notifications);
  }, [items, preferences.notifications, listReady, prefsReady]);
}

export function countPendingReleases(items: SavedItem[]): number {
  return pendingReleases(items).length;
}
