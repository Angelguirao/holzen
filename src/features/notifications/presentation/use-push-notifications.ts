import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/public";
import {
  getRegisterPushVapidKey,
  registerPushSubscribe,
  registerPushUnsubscribe,
} from "../public-rpc";
import {
  getPushSubscriptionQueryOptions,
  pushSubscriptionQueryKey,
} from "../infrastructure/queries/push-subscription-query";

export { pushSubscriptionQueryKey } from "../infrastructure/queries/push-subscription-query";

export function usePushNotifications() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const isSupported = useMemo(
    () => typeof navigator !== "undefined" && "serviceWorker" in navigator && "PushManager" in window,
    [],
  );

  const subQueryEnabled = isSupported && Boolean(user);

  const pushSubQuery = useQuery(
    getPushSubscriptionQueryOptions({ userId: user?.id, enabled: subQueryEnabled }),
  );

  const isSubscribed = pushSubQuery.data ?? false;
  const pushRegistrationChecked = subQueryEnabled && pushSubQuery.isSuccess;

  const subscribe = useCallback(async () => {
    if (!user || !isSupported) return;
    setLoading(true);
    try {
      const { data: keyData, error: keyError } = await getRegisterPushVapidKey();
      if (keyError || !keyData?.publicKey) throw new Error("Failed to get VAPID key");

      const reg = await navigator.serviceWorker.ready;

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.publicKey) as BufferSource,
      });

      const subJson = subscription.toJSON();

      const { error } = await registerPushSubscribe({
        endpoint: subJson.endpoint,
        keys: subJson.keys,
      });
      if (error) throw error;

      queryClient.setQueryData(pushSubscriptionQueryKey(user.id), true);
    } catch (e) {
      console.error("Push subscribe error:", e);
      toast.error(t("settings.pushSubscribeFailed"));
    } finally {
      setLoading(false);
    }
  }, [user, isSupported, t, queryClient]);

  const unsubscribe = useCallback(async () => {
    if (!user || !isSupported) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        const subJson = subscription.toJSON();

        const { error: unsubErr } = await registerPushUnsubscribe({
          endpoint: subJson.endpoint,
        });
        if (unsubErr) throw unsubErr;

        await subscription.unsubscribe();
      }
      queryClient.setQueryData(pushSubscriptionQueryKey(user.id), false);
    } catch (e) {
      console.error("Push unsubscribe error:", e);
      toast.error(t("settings.pushUnsubscribeFailed"));
    } finally {
      setLoading(false);
    }
  }, [user, isSupported, t, queryClient]);

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
