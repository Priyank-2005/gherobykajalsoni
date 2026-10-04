/** Cloudinary serves a frame of any video as an image when the extension is swapped to .jpg. */
export function videoPoster(url: string) {
  return url.includes("res.cloudinary.com/") && url.includes("/video/upload/") ? url.replace(/\.[a-z0-9]+$/i, ".jpg") : undefined;
}

/**
 * Only one video on the page plays with sound. A video that turns its sound on announces
 * itself; every other video listening mutes.
 */
const SOUND_EVENT = "ghero:video-sound";

export function announceSound(id: string) {
  window.dispatchEvent(new CustomEvent(SOUND_EVENT, { detail: id }));
}

export function onOtherSound(id: string, mute: () => void) {
  const handler = (e: Event) => {
    if ((e as CustomEvent<string>).detail !== id) mute();
  };
  window.addEventListener(SOUND_EVENT, handler);
  return () => window.removeEventListener(SOUND_EVENT, handler);
}
