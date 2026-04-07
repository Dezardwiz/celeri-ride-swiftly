import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { LocalNotifications } from "@capacitor/local-notifications";

const isNative = Capacitor.isNativePlatform();

// Simple notification sound using Web Audio API (web fallback)
let audioCtx: AudioContext | null = null;

export function playNotificationSound() {
  try {
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    oscillator.frequency.setValueAtTime(1100, audioCtx.currentTime + 0.15);
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.5);
  } catch {
    // Audio not supported
  }
}

export async function vibrate() {
  try {
    if (isNative) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } else if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  } catch {
    // Vibration/haptics not supported
  }
}

export async function showLocalNotification(title: string, body: string, data?: Record<string, string>) {
  if (!isNative) return;
  try {
    const perm = await LocalNotifications.requestPermissions();
    if (perm.display !== "granted") return;

    await LocalNotifications.schedule({
      notifications: [
        {
          id: Date.now(),
          title,
          body,
          extra: data,
          sound: "default",
          smallIcon: "ic_notification",
          largeIcon: "ic_launcher",
        },
      ],
    });
  } catch (e) {
    console.error("Local notification error:", e);
  }
}

export async function notifyNewRide(origin?: string, destination?: string) {
  playNotificationSound();
  await vibrate();

  if (isNative && origin && destination) {
    await showLocalNotification(
      "🏍️ Nova corrida disponível!",
      `${origin} → ${destination}`
    );
  }
}
