import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { initI18n, setLocaleAsync, translateApiError, translateServiceMessage } from './i18n'

describe('translateApiError', () => {
  beforeAll(async () => {
    await initI18n()
  })

  beforeEach(async () => {
    await setLocaleAsync('zh-CN', false)
  })

  it('does not map unknown API failures to the backup storage-service string', () => {
    const message = translateApiError('unknown', 'Request failed (502)')
    expect(message).not.toContain('存储服务')
    expect(message).toBe('Request failed (502)')
  })

  it('still maps known API codes', () => {
    const message = translateApiError('unauthenticated', 'Please sign in first')
    expect(message.length).toBeGreaterThan(0)
    expect(message).not.toContain('存储服务')
  })
})

describe('translateServiceMessage', () => {
  beforeAll(async () => {
    await initI18n()
  })

  beforeEach(async () => {
    await setLocaleAsync('zh-CN', false)
  })

  it('keeps storage-service fallback for unrecognized backup errors', () => {
    const message = translateServiceMessage('S3 exploded mysteriously')
    expect(message).toContain('存储服务')
  })
})
