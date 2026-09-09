"use client";

import { useEffect } from "react";

type CompletionNotification = {
  title: string;
  options?: NotificationOptions;
};

/**
 * Shows a browser notification through the active Service Worker registration.
 * Service workers do not support constructing notifications with
 * `new Notification(...)`; they must use registration.showNotification(...).
 */
export async function showServiceWorkerNotification({ title, options }: CompletionNotification): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, options);
  } catch {
    // Notifications are optional UI feedback. Do not interrupt the workspace
    // when a service worker is unavailable or its registration fails.
  }
}

/**
 * Compatibility bridge for the existing shared workspace notification call.
 * It preserves Notification.permission and requestPermission(), but routes
 * completed-task notifications through ServiceWorkerRegistration.showNotification().
 */
export function ServiceWorkerNotifications() {
  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

    const NativeNotification = window.Notification;

    class ServiceWorkerNotification {
      static get permission() {
        return NativeNotification.permission;
      }

      static requestPermission() {
        return NativeNotification.requestPermission();
      }

      constructor(title: string, options?: NotificationOptions) {
        void showServiceWorkerNotification({ title, options });
      }
    }

    window.Notification = ServiceWorkerNotification as unknown as typeof Notification;

    return () => {
      if (window.Notification === ServiceWorkerNotification) {
        window.Notification = NativeNotification;
      }
    };
  }, []);

  return null;
}
