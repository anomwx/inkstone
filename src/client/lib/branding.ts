/** Resolves and applies custom app name/icon branding across the shell and document chrome. */
import {
  APP_ICON_BINARY_MAX_BYTES,
  APP_ICON_SOURCE_FILE_MAX_BYTES,
  APP_ICON_STORED_MAX_CHARS,
  isAppIconDataUrl,
  normalizeAppDisplayName,
  normalizeAppIcon,
} from '@shared/branding'
import type { AppearanceSettings, SiteInfo, UserSettings } from '@shared/types'
import { BRANDING_STORAGE_KEY } from './runtime'
import { t } from './i18n'

export type AppIconUploadErrorCode =
  | 'unsupported'
  | 'too_large'
  | 'decode_failed'
  | 'encode_failed'
  | 'unsafe_svg'

export class AppIconUploadError extends Error {
  constructor(readonly code: AppIconUploadErrorCode) {
    super(code)
    this.name = 'AppIconUploadError'
  }
}

export interface BrandingPreference {
  appName: string
  appIcon: string
}

const DEFAULT_FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='3' y='3' width='26' height='26' rx='8' fill='%231C1917'/%3E%3Cpath d='M16 8.5c2.6 3.4 5.2 6.1 5.2 9a5.2 5.2 0 1 1-10.4 0c0-2.9 2.6-5.6 5.2-9z' fill='%23E06A4F'/%3E%3C/svg%3E"

let lastAppliedName = ''
let lastAppliedIcon = ''
let dynamicManifestUrl: string | null = null

export function defaultAppName(site?: SiteInfo | null): string {
  const fromSite = site?.name?.trim()
  if (fromSite) return fromSite
  try {
    return t('common.product_name')
  } catch {
    return 'Inkstone'
  }
}

export function resolveAppName(
  appearance: Pick<AppearanceSettings, 'appName'> | null | undefined,
  site?: SiteInfo | null,
): string {
  const custom = normalizeAppDisplayName(appearance?.appName ?? '')
  return custom || defaultAppName(site)
}

export function resolveAppIcon(
  appearance: Pick<AppearanceSettings, 'appIcon'> | null | undefined,
): string | null {
  const icon = normalizeAppIcon(appearance?.appIcon ?? '')
  return icon || null
}

export function loadLocalBranding(): BrandingPreference {
  try {
    const raw = localStorage.getItem(BRANDING_STORAGE_KEY)
    if (!raw) return { appName: '', appIcon: '' }
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { appName: '', appIcon: '' }
    }
    const record = parsed as Record<string, unknown>
    return {
      appName: normalizeAppDisplayName(record.appName),
      appIcon: normalizeAppIcon(record.appIcon),
    }
  } catch {
    return { appName: '', appIcon: '' }
  }
}

export function persistLocalBranding(preference: BrandingPreference): void {
  const next: BrandingPreference = {
    appName: normalizeAppDisplayName(preference.appName),
    appIcon: normalizeAppIcon(preference.appIcon),
  }
  try {
    if (!next.appName && !next.appIcon) {
      localStorage.removeItem(BRANDING_STORAGE_KEY)
      return
    }
    localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Quota or private mode — branding still applies for the current session.
  }
}

export function syncBrandingFromSettings(
  settings: UserSettings,
  site?: SiteInfo | null,
): void {
  const preference: BrandingPreference = {
    appName: settings.appearance.appName,
    appIcon: settings.appearance.appIcon,
  }
  persistLocalBranding(preference)
  applyBrandingToDom(resolveAppName(settings.appearance, site), resolveAppIcon(settings.appearance))
}

export function applyBrandingToDom(name: string, icon: string | null): void {
  const nextName = name.trim() || 'Inkstone'
  const nextIcon = icon && isAppIconDataUrl(icon) ? icon : null

  if (document.title !== nextName) document.title = nextName

  const appleTitle = document.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-title"]')
  if (appleTitle && appleTitle.content !== nextName) appleTitle.content = nextName

  const faviconHref = nextIcon ?? DEFAULT_FAVICON
  let favicon = document.querySelector<HTMLLinkElement>("link[rel='icon']")
  if (!favicon) {
    favicon = document.createElement('link')
    favicon.rel = 'icon'
    document.head.appendChild(favicon)
  }
  if (favicon.href !== faviconHref && favicon.getAttribute('href') !== faviconHref) {
    favicon.href = faviconHref
  }

  const appleTouch = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']")
  if (appleTouch) {
    const appleHref = nextIcon ?? '/apple-touch-icon.png'
    if (appleTouch.getAttribute('href') !== appleHref) appleTouch.href = appleHref
  }

  if (lastAppliedName !== nextName || lastAppliedIcon !== (nextIcon ?? '')) {
    updateDynamicManifest(nextName, nextIcon)
    lastAppliedName = nextName
    lastAppliedIcon = nextIcon ?? ''
  }
}

function updateDynamicManifest(name: string, icon: string | null): void {
  const manifestLink = document.querySelector<HTMLLinkElement>("link[rel='manifest']")
  if (!manifestLink) return

  const shortName = name.length > 12 ? `${name.slice(0, 11)}…` : name
  const icons = icon
    ? [
        { src: icon, sizes: 'any', type: iconMime(icon), purpose: 'any' },
        { src: icon, sizes: 'any', type: iconMime(icon), purpose: 'maskable' },
      ]
    : [
        { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        {
          src: '/pwa-maskable-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ]

  const manifest = {
    id: '/',
    name,
    short_name: shortName,
    description: t('app.meta_description'),
    lang: document.documentElement.lang || 'en-US',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#faf9f7',
    theme_color: '#faf9f7',
    categories: ['productivity', 'utilities'],
    icons,
  }

  if (dynamicManifestUrl) URL.revokeObjectURL(dynamicManifestUrl)
  const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' })
  dynamicManifestUrl = URL.createObjectURL(blob)
  manifestLink.href = dynamicManifestUrl
}

function iconMime(dataUrl: string): string {
  if (dataUrl.startsWith('data:image/png')) return 'image/png'
  if (dataUrl.startsWith('data:image/webp')) return 'image/webp'
  if (dataUrl.startsWith('data:image/jpeg')) return 'image/jpeg'
  if (dataUrl.startsWith('data:image/svg+xml')) return 'image/svg+xml'
  return 'image/png'
}

export async function prepareAppIconUpload(file: File): Promise<string> {
  if (file.type === 'image/svg+xml' || /\.svg$/i.test(file.name)) {
    return prepareSvgIcon(file)
  }
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    throw new AppIconUploadError('unsupported')
  }
  if (!file.size || file.size > APP_ICON_SOURCE_FILE_MAX_BYTES) {
    throw new AppIconUploadError('too_large')
  }

  const image = await loadImage(file)
  if (
    image.naturalWidth > 16_384 ||
    image.naturalHeight > 16_384 ||
    image.naturalWidth * image.naturalHeight > 64 * 1024 * 1024
  ) {
    throw new AppIconUploadError('too_large')
  }

  const attempts: Array<{ size: number; mime: 'image/webp' | 'image/png' | 'image/jpeg'; quality: number }> = [
    { size: 128, mime: 'image/webp', quality: 0.82 },
    { size: 96, mime: 'image/webp', quality: 0.76 },
    { size: 96, mime: 'image/png', quality: 1 },
    { size: 64, mime: 'image/jpeg', quality: 0.8 },
  ]

  for (const attempt of attempts) {
    const blob = await renderSquare(image, attempt.size, attempt.mime, attempt.quality)
    if (blob && blob.size > 0 && blob.size <= APP_ICON_BINARY_MAX_BYTES) {
      const dataUrl = await blobToDataUrl(blob)
      if (dataUrl.length <= APP_ICON_STORED_MAX_CHARS) return dataUrl
    }
  }
  throw new AppIconUploadError('encode_failed')
}

async function prepareSvgIcon(file: File): Promise<string> {
  if (!file.size || file.size > 8 * 1024) throw new AppIconUploadError('too_large')
  const text = await file.text()
  if (/<script[\s>]/i.test(text) || /on\w+\s*=/i.test(text) || /javascript:/i.test(text)) {
    throw new AppIconUploadError('unsafe_svg')
  }
  const encoded = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(text.trim())}`
  if (encoded.length > APP_ICON_STORED_MAX_CHARS) throw new AppIconUploadError('too_large')
  if (!isAppIconDataUrl(encoded)) throw new AppIconUploadError('encode_failed')
  return encoded
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      if (!image.naturalWidth || !image.naturalHeight) reject(new AppIconUploadError('decode_failed'))
      else resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new AppIconUploadError('decode_failed'))
    }
    image.src = objectUrl
  })
}

function renderSquare(
  image: HTMLImageElement,
  size: number,
  mime: 'image/webp' | 'image/png' | 'image/jpeg',
  quality: number,
): Promise<Blob | null> {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) throw new AppIconUploadError('encode_failed')

  if (mime === 'image/jpeg') {
    context.fillStyle = '#f4f1eb'
    context.fillRect(0, 0, size, size)
  }
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight)
  const sourceX = (image.naturalWidth - sourceSize) / 2
  const sourceY = (image.naturalHeight - sourceSize) / 2
  context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size)
  return new Promise((resolve) => canvas.toBlob(resolve, mime, quality))
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new AppIconUploadError('encode_failed'))
    }
    reader.onerror = () => reject(new AppIconUploadError('encode_failed'))
    reader.readAsDataURL(blob)
  })
}
