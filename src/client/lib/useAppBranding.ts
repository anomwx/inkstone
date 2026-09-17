import { useMemo } from 'react'
import { useSession } from '../store/session'
import { loadLocalBranding, resolveAppIcon, resolveAppName } from './branding'

/** Reactive app display name + icon for shell chrome. */
export function useAppBranding(): { name: string; icon: string | null } {
  const status = useSession((state) => state.status)
  const appearance = useSession((state) => state.settings.appearance)
  const site = useSession((state) => state.site)

  return useMemo(() => {
    if (status === 'authed') {
      return {
        name: resolveAppName(appearance, site),
        icon: resolveAppIcon(appearance),
      }
    }
    const local = loadLocalBranding()
    return {
      name: resolveAppName(
        { appName: local.appName || appearance.appName },
        site,
      ),
      icon: resolveAppIcon({ appIcon: local.appIcon || appearance.appIcon }),
    }
  }, [appearance.appIcon, appearance.appName, site, status])
}
