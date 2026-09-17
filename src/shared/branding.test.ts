import { describe, expect, it } from 'vitest'
import {
  isAppIconDataUrl,
  normalizeAppDisplayName,
  normalizeAppIcon,
} from './branding'

describe('branding helpers', () => {
  it('trims and caps the display name', () => {
    expect(normalizeAppDisplayName('  Notebook  ')).toBe('Notebook')
    expect(normalizeAppDisplayName('x'.repeat(80)).length).toBe(64)
    expect(normalizeAppDisplayName(null)).toBe('')
  })

  it('accepts bitmap and svg data URLs', () => {
    const png = 'data:image/png;base64,iVBORw0KGgo='
    const svg = 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3C%2Fsvg%3E'
    expect(isAppIconDataUrl(png)).toBe(true)
    expect(isAppIconDataUrl(svg)).toBe(true)
    expect(normalizeAppIcon(png)).toBe(png)
    expect(normalizeAppIcon('https://example.com/x.png')).toBe('')
  })
})
