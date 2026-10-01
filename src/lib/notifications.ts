import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { LocalNotifications } from "@capacitor/local-notifications";

const isNative = Capacitor.isNativePlatform();

let audioCtx: AudioContext | null = null;
const ctx = () => {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  return audioCtx;
};

/** Plays a sequence of [frequency, durationSec] tones. */
function playTones(tones: [number, number][], volume = 0.3, type: OscillatorType = "sine") {
  try {
    const ac = ctx();
    let t = ac.currentTime;
    for (const [freq, dur] of tones) {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(volume, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + dur);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(t);
      osc.stop(t + dur);
      t += dur;
    }
  } catch {
    /* audio not supported */
  }
}

export type SoundKind = "newRide" | "accepted" | "arrived" | "message" | "complete" | "sos";

export function playSound(kind: SoundKind) {
  switch (kind) {
    case "newRide":
      return playTones([[880, 0.15], [1100, 0.15], [880, 0.15], [1320, 0.3]], 0.4, "square");
    case "accepted":
      return playTones([[660, 0.12], [880, 0.25]]);
    case "arrived":
      return playTones([[880, 0.15], [880, 0.15], [1100, 0.35]], 0.35);
    case "message":
      return playTones([[1200, 0.08], [1500, 0.12]], 0.2);
    case "complete":
      return playTones([[523, 0.12], [659, 0.12], [784, 0.3]]);
    case "sos":
      return playTones([[1000, 0.2], [700, 0.2], [1000, 0.2], [700, 0.2]], 0.5, "sawtooth");
  }
}

export function playNotificationSound() {
  playSound("newRide");
}

/** Rings repeatedly until the returned stop() is called (or maxMs elapses). */
let ringTimer: ReturnType<typeof setInterval> | null = null;
export function startRinging(maxMs = 15000) {
  stopRinging();
  playSound("newRide");
  vibrate();
  ringTimer = setInterval(() => {
    playSound("newRide");
    vibrate();
  }, 1500);
  setTimeout(stopRinging, maxMs);
}
export function stopRinging() {
  if (ringTimer) clearInterval(ringTimer);
  ringTimer = null;
}

export async function vibrate(pattern: number[] = [200, 100, 200]) {
  try {
    if (isNative) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } else if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch {
    /* not supported */
  }
}

export async function showLocalNotification(title: string, body: string, data?: Record<string, string>) {
  if (!isNative) return;
  try {
    const perm = await LocalNotifications.requestPermissions();
    if (perm.display !== "granted") return;
    await LocalNotifications.schedule({
      notifications: [
        { id: Date.now() % 2147483647, title, body, extra: data, sound: "default", smallIcon: "ic_notification", largeIcon: "ic_launcher" },
      ],
    });
  } catch (e) {
    console.error("Local notification error:", e);
  }
}

export async function notifyNewRide(origin?: string, destination?: string) {
  startRinging();
  if (isNative && origin && destination) {
    await showLocalNotification("🏍️ Nova corrida disponível!", `${origin} → ${destination}`);
  }
}
