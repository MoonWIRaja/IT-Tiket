const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const bytes = (b64) => Uint8Array.from(atob(b64.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

// Android rejects `new Notification`; the service worker works on every platform.
export async function showAlert(title, options) {
  if (window.Notification?.permission !== 'granted') return;
  const sw = await navigator.serviceWorker?.getRegistration();
  if (sw) sw.showNotification(title, options);
  else new Notification(title, options);
}

export async function enablePush(supabase, userId) {
  if (!VAPID || window.Notification?.permission !== 'granted' || !('PushManager' in window)) return;
  const sw = await navigator.serviceWorker.ready;
  const sub = await sw.pushManager.getSubscription()
    ?? await sw.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes(VAPID) });
  const { endpoint, keys } = sub.toJSON();
  await supabase.from('push_subscriptions').upsert({ endpoint, user_id: userId, p256dh: keys.p256dh, auth: keys.auth });
}

// Delivery is best effort: a push failure must not fail the message or call.
export const notify = (supabase, type, id) =>
  supabase.functions.invoke('notify', { body: { type, id } }).catch(() => {});

// Two-tone ring. Browsers unlock audio after the person's first tap on the page.
let audio;
export const unlockAudio = () => { audio ??= new AudioContext(); audio.resume(); };
const tone = (freq, length, volume = 0.12) => {
  if (audio?.state !== 'running') return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  gain.gain.value = volume;
  osc.frequency.value = freq;
  osc.connect(gain).connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + length);
};
// What the caller hears while it rings on the other side.
export function startRingback() {
  tone(425, 1);
  const timer = setInterval(() => tone(425, 1), 3000);
  return () => clearInterval(timer);
}
export const endTone = () => tone(480, 0.25);

export function startRing() {
  const beep = () => {
    if (!audio || audio.state !== 'running') return;
    [[440, 0], [480, 0.5]].forEach(([freq, at]) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      gain.gain.value = 0.15;
      osc.frequency.value = freq;
      osc.connect(gain).connect(audio.destination);
      osc.start(audio.currentTime + at);
      osc.stop(audio.currentTime + at + 0.45);
    });
  };
  beep();
  const timer = setInterval(beep, 2500);
  return () => clearInterval(timer);
}
