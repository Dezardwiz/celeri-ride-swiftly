import { useState, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const VAPID_PUBLIC_KEY = "BPHBYjPl_lpeH6XWXCgVhGom_2u_MOME843nDTGxEVu_RdVnwUdXVjkfMYiKu87YixaCyTO8RaXwuf5GIQIjbKE";

const isNative = Capacitor.isNativePlatform();

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (isNative) {
      setIsSupported(true);
    } else {
      setIsSupported("serviceWorker" in navigator && "PushManager" in window);
    }
  }, []);

  // Native push listeners
  useEffect(() => {
    if (!isNative || !user) return;

    // Listen for registration success
    const regListener = PushNotifications.addListener("registration", async (token) => {
      console.log("Native push token:", token.value);
      // Store the FCM/APNs token in push_subscriptions table
      await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: `native://${Capacitor.getPlatform()}`,
          p256dh: token.value, // Store native token in p256dh field
          auth: Capacitor.getPlatform(), // Store platform type
        },
        { onConflict: "user_id,endpoint" }
      );
      setIsSubscribed(true);
    });

    // Listen for registration errors
    const errListener = PushNotifications.addListener("registrationError", (err) => {
      console.error("Native push registration error:", err);
    });

    // Listen for received notifications (foreground)
    const receivedListener = PushNotifications.addListener(
      "pushNotificationReceived",
      (notification) => {
        console.log("Push received:", notification);
      }
    );

    // Listen for notification taps
    const actionListener = PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (action) => {
        console.log("Push action:", action);
        // Navigate to ride if ride_id is in the data
        const rideId = action.notification.data?.ride_id;
        if (rideId) {
          window.location.href = `/driver`;
        }
      }
    );

    // Check if already registered
    PushNotifications.checkPermissions().then(({ receive }) => {
      if (receive === "granted") {
        setIsSubscribed(true);
      }
    });

    return () => {
      regListener.then((l) => l.remove());
      errListener.then((l) => l.remove());
      receivedListener.then((l) => l.remove());
      actionListener.then((l) => l.remove());
    };
  }, [user]);

  // Web push: check existing subscription
  useEffect(() => {
    if (isNative || !isSupported || !user) return;
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setIsSubscribed(!!sub);
      });
    });
  }, [isSupported, user]);

  const subscribe = useCallback(async () => {
    if (!isSupported || !user) return false;

    // ===== NATIVE =====
    if (isNative) {
      try {
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === "prompt") {
          permStatus = await PushNotifications.requestPermissions();
        }
        if (permStatus.receive !== "granted") return false;

        await PushNotifications.register();
        return true;
      } catch (e) {
        console.error("Native push subscribe failed:", e);
        return false;
      }
    }

    // ===== WEB =====
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") return false;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subJson = subscription.toJSON();

      await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: subJson.endpoint!,
          p256dh: subJson.keys!.p256dh,
          auth: subJson.keys!.auth,
        },
        { onConflict: "user_id,endpoint" }
      );

      setIsSubscribed(true);
      return true;
    } catch (e) {
      console.error("Push subscription failed:", e);
      return false;
    }
  }, [isSupported, user]);

  return { isSupported, isSubscribed, subscribe };
}
