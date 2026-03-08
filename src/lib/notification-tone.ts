/**
 * Holzen notification tone.
 * Generates via ElevenLabs on first use, then caches in localStorage.
 */

const CACHE_KEY = 'holzen_notification_tone';

async function fetchTone(): Promise<string> {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) return cached;

  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-tone`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          prompt: 'A warm, organic, calming notification chime. Like a soft wooden singing bowl being gently struck once, with a warm golden resonance that fades slowly. Not electronic, not a ping. Natural, grounding, meditative. Single tone, brief.',
          duration: 2,
        }),
      }
    );

    if (!response.ok) return '';

    const data = await response.json();
    if (data.audio) {
      localStorage.setItem(CACHE_KEY, data.audio);
      return data.audio;
    }
  } catch (e) {
    console.warn('Could not generate notification tone:', e);
  }
  return '';
}

let audioInstance: HTMLAudioElement | null = null;

export async function playNotificationTone() {
  try {
    const base64 = await fetchTone();
    if (!base64) return;

    const audioUrl = `data:audio/mpeg;base64,${base64}`;
    
    if (audioInstance) {
      audioInstance.pause();
      audioInstance.currentTime = 0;
    }
    
    audioInstance = new Audio(audioUrl);
    audioInstance.volume = 0.4;
    await audioInstance.play();
  } catch (e) {
    // Silently fail — autoplay may be blocked
    console.warn('Could not play notification tone:', e);
  }
}

/** Pre-fetch the tone so it's cached for when needed */
export function prefetchNotificationTone() {
  fetchTone().catch(() => {});
}
