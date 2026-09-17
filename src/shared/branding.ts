export const APP_DISPLAY_NAME_MAX_LENGTH = 64
export const APP_ICON_SOURCE_FILE_MAX_BYTES = 8 * 1024 * 1024
/** Max size of the stored data-URL string in settings (keeps settings JSON within body limits). */
export const APP_ICON_STORED_MAX_CHARS = 14_000
export const APP_ICON_BINARY_MAX_BYTES = 10 * 1024

const BITMAP_DATA_URL =
  /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=\s]+$/i
const SVG_DATA_URL = /^data:image\/svg\+xml(?:;charset=utf-8)?;base64,[A-Za-z0-9+/=\s]+$/i
const SVG_DATA_URL_UTF8 =
  /^data:image\/svg\+xml(?:;charset=utf-8)?,(?:[\w%!.\-*_~'()+,;=:@/?#\[\]$&]|%[0-9A-Fa-f]{2})+$/i

export function normalizeAppDisplayName(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim().slice(0, APP_DISPLAY_NAME_MAX_LENGTH)
  return trimmed
}

export function isAppIconDataUrl(value: string | null | undefined): boolean {
  if (!value || value.length > APP_ICON_STORED_MAX_CHARS) return false
  return BITMAP_DATA_URL.test(value) || SVG_DATA_URL.test(value) || SVG_DATA_URL_UTF8.test(value)
}

export function normalizeAppIcon(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  if (!trimmed) return ''
  return isAppIconDataUrl(trimmed) ? trimmed : fallback
}
