// One namespace for Chrome (callbacks/promises), Firefox and Safari (promises).
export const ext = globalThis.browser ?? globalThis.chrome;

const KEY_TOKEN = 'tf_token';

export async function getToken() {
  const o = await ext.storage.local.get(KEY_TOKEN);
  return typeof o[KEY_TOKEN] === 'string' ? o[KEY_TOKEN] : null;
}
export async function setToken(token) {
  await ext.storage.local.set({ [KEY_TOKEN]: token });
}
export async function clearToken() {
  await ext.storage.local.remove(KEY_TOKEN);
}

/** Only hostnames ever leave the page context, never full URLs. */
export function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}
