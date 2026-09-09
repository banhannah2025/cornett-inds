"use client";

import { useEffect } from "react";

/**
 * Code AI's shared workspace currently creates completion notifications with
 * `new Notification(...)`. In a service-worker execution context that
 * constructor is unavailable; route those requests through the active service
 * worker instead while preserving the existing permission controls.
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
        void navigator.serviceWorker.ready
          .then((registration) => registration.showNotification(title, options))
          .catch(() => undefined);
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
