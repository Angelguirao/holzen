import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { invokeEdge } from "@/lib/invoke-edge";
import { useAuth } from "@/hooks/use-auth";

export function usePushNotifications() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [loading, setLoading] = useState(false);
  /** False until first `getSubscription` completes for the signed-in user (avoids banner flash). */
  const [pushRegistrationChecked, setPushRegistrationChecked] = useState(false);

  useEffect(() => {
    setIsSupported("serviceWorker" in navigator && "PushManager" in window);
  }, []);

  // Check existing subscription on mount / user change
  useEffect(() => {
    if (!isSupported || !user) {
      setIsSubscribed(false);
      setPushRegistrationChecked(false);
      return;
    }
    let cancelled = false;
    setPushRegistrationChecked(false);
    void navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => {
        if (!cancelled) {
          setIsSubscribed(!!sub);
          setPushRegistrationChecked(true);
        }
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [isSupported, user]);

  // Re-check when returning to the tab (e.g. user cleared site data elsewhere)
  useEffect(() => {
    if (!isSupported || !user) return;
    const recheck = () => {
      void navigator.serviceWorker.ready.then((reg) =>
        reg.pushManager.getSubscription().then((sub) => setIsSubscribed(!!sub)),
      );
    };
    window.addEventListener("focus", recheck);
    return () => window.removeEventListener("focus", recheck);
  }, [isSupported, user]);

  const subscribe = useCallback(async () => {
    if (!user || !isSupported) return;
    setLoading(true);
    try {
      // Get VAPID public key from edge function
      const { data: keyData, error: keyError } = await invokeEdge<{ publicKey?: string }>(
        "register-push",
        { body: { action: "get-vapid-key" } },
      );
      if (keyError || !keyData?.publicKey) throw new Error("Failed to get VAPID key");

      // Use the main PWA service worker (already registered by vite-plugin-pwa)
      const reg = await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.publicKey) as BufferSource,
      });

      const subJson = subscription.toJSON();

      // Save to backend
      const { error } = await invokeEdge("register-push", {
        body: {
          action: "subscribe",
          subscription: {
            endpoint: subJson.endpoint,
            keys: subJson.keys,
          },
        },
      });
      if (error) throw error;

      setIsSubscribed(true);
    } catch (e) {
      console.error("Push subscribe error:", e);
      toast.error(t("settings.pushSubscribeFailed"));
    } finally {
      setLoading(false);
    }
  }, [user, isSupported, t]);

  const unsubscribe = useCallback(async () => {
    if (!user || !isSupported) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        const subJson = subscription.toJSON();

        const { error: unsubErr } = await invokeEdge("register-push", {
          body: {
            action: "unsubscribe",
            subscription: { endpoint: subJson.endpoint },
          },
        });
        if (unsubErr) throw unsubErr;

        await subscription.unsubscribe();
      }
      setIsSubscribed(false);
    } catch (e) {
      console.error("Push unsubscribe error:", e);
      toast.error(t("settings.pushUnsubscribeFailed"));
    } finally {
      setLoading(false);
    }
  }, [user, isSupported, t]);

  const permissionGrantedNotSubscribed = useMemo(() => {
    if (typeof window === "undefined" || typeof Notification === "undefined") return false;
    return (
      pushRegistrationChecked &&
      isSupported &&
      Notification.permission === "granted" &&
      !isSubscribed
    );
  }, [pushRegistrationChecked, isSupported, isSubscribed]);

  return {
    isSupported,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
    /** Browser already allows notifications, but this device has no push subscription in-app yet. */
    permissionGrantedNotSubscribed,
  };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
