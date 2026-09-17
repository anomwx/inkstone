import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/inter.css'
import './styles/app.css'
import { BRANDING_STORAGE_KEY, LOCALE_STORAGE_KEY, UI_STORAGE_KEY } from './lib/runtime'
import { installViewportSizing } from './lib/viewport'

installViewportSizing()

async function start(): Promise<void> {
  if (import.meta.env.MODE === 'demo') {
    localStorage.removeItem(UI_STORAGE_KEY)
    localStorage.removeItem(LOCALE_STORAGE_KEY)
    localStorage.removeItem(BRANDING_STORAGE_KEY)
    const { installDemoRuntime } = await import('./demo/runtime')
    await installDemoRuntime()
  }

  const [{ App }, i18n, branding] = await Promise.all([
    import('./App'),
    import('./lib/i18n'),
    import('./lib/branding'),
  ])
  await i18n.initI18n()
  const localBranding = branding.loadLocalBranding()
  branding.applyBrandingToDom(
    branding.resolveAppName({ appName: localBranding.appName }),
    branding.resolveAppIcon({ appIcon: localBranding.appIcon }),
  )
  const container = document.getElementById('root')
  if (!container) throw new Error(i18n.t("app.missing_root_mount_point"))
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void start()
