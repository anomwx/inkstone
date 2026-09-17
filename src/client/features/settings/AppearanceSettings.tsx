import { useRef, useState } from 'react'
import { APP_DISPLAY_NAME_MAX_LENGTH } from '@shared/branding'
import type { AccentName, AppLocale, BackgroundName, ProseFont, ProseWidth, ThemePref, UiDensity } from '@shared/types'
import { Check, Monitor, Moon, RotateCcw, Sun, Upload } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Input, Segmented, SettingRow, Slider } from '../../components/form'
import { Button, Logo } from '../../components/primitives'
import { Tooltip } from '../../components/overlay'
import { useSession } from '../../store/session'
import { switchThemeWithTransition } from '../../store/ui'
import { t, type MessageKey } from '../../lib/i18n'
import {
  AppIconUploadError,
  defaultAppName,
  prepareAppIconUpload,
} from '../../lib/branding'

const ACCENT_MESSAGE_KEYS: Record<AccentName, MessageKey> = {
  cinnabar: 'settings.accent.cinnabar',
  indigo: 'settings.accent.indigo',
  celadon: 'settings.accent.celadon',
  amber: 'settings.accent.amber',
  terracotta: 'settings.accent.terracotta',
  wisteria: 'settings.accent.wisteria',
  graphite: 'settings.accent.graphite',
}

export function AppearanceSettings({
  accents,
}: {
  accents: { name: AccentName; swatch: string; foreground: string }[]
}) {
  const settings = useSession((s) => s.settings)
  const update = useSession((s) => s.updateSettings)
  const appearance = settings.appearance

  return (
    <div>
      <section>
        <h3 className="mb-1 text-[11px] font-semibold tracking-[0.06em] text-[var(--text-quaternary)]">
          {t("settings.branding")}
        </h3>
        <BrandingSettings />
      </section>

      <section>
        <SettingRow title={t("settings.interface_language")}>
          <Segmented<AppLocale>
            label={t("settings.interface_language")}
            value={appearance.language}
            onChange={(language) => void update({ appearance: { language } })}
            options={[
              { value: 'zh-CN', label: t("settings.simplified_chinese") },
              { value: 'en-US', label: t("settings.english") },
            ]}
          />
        </SettingRow>

        <SettingRow title={t("settings.theme")}>
          <Segmented<ThemePref>
            label={t("settings.theme")}
            value={appearance.theme}
            onChange={(theme) => {
              switchThemeWithTransition(theme, undefined, () => update({ appearance: { theme } }))
            }}
            options={[
              { value: 'light', label: <Sun size={12.5} />, title: t("settings.light") },
              { value: 'dark', label: <Moon size={12.5} />, title: t("settings.dark") },
              { value: 'system', label: <Monitor size={12.5} />, title: t("settings.system") },
            ]}
          />
        </SettingRow>

        <SettingRow title={t("settings.accent_color")}>
          <div role="group" aria-label={t("settings.accent_color")} className="flex items-center gap-1.5">
            {accents.map((accent) => (
              <Tooltip key={accent.name} label={t(ACCENT_MESSAGE_KEYS[accent.name])}>
                <button
                  type="button"
                  onClick={() => void update({ appearance: { accent: accent.name } })}
                  aria-label={t(ACCENT_MESSAGE_KEYS[accent.name])}
                  aria-pressed={appearance.accent === accent.name}
                  className={cn(
                    'relative flex size-6 items-center justify-center rounded-full transition-transform duration-[var(--dur-fast)] ease-[var(--ease-spring)]',
                    'hover:scale-110 active:scale-95',
                    appearance.accent === accent.name && 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg-overlay)]',
                  )}
                  style={{ background: accent.swatch, color: accent.foreground }}
                >
                  {appearance.accent === accent.name && (
                    <Check size={12} strokeWidth={3} className="drop-shadow-sm" />
                  )}
                </button>
              </Tooltip>
            ))}
          </div>
        </SettingRow>

        <SettingRow title={t("settings.background_color")}>
          <div role="group" aria-label={t("settings.background_color")} className="flex items-center gap-2">
            {([
              { name: 'paper', label: t("settings.background_paper"), swatch: '#f7f5f1' },
              { name: 'white', label: t("settings.background_white"), swatch: '#ffffff' },
            ] satisfies { name: BackgroundName; label: string; swatch: string }[]).map((background) => (
              <button
                key={background.name}
                type="button"
                onClick={() => void update({ appearance: { background: background.name } })}
                aria-pressed={appearance.background === background.name}
                className={cn(
                  'flex h-8 min-w-[84px] items-center gap-2 rounded-[var(--r-md)] border px-2.5 text-[11.5px] transition-[border-color,background-color,box-shadow] duration-[var(--dur-fast)]',
                  appearance.background === background.name
                    ? 'border-[var(--accent)] bg-[var(--accent-softer)] shadow-[0_0_0_2px_var(--accent-ring)]'
                    : 'border-[var(--border-default)] bg-[var(--bg-base)] hover:bg-[var(--bg-hover)]',
                )}
              >
                <span
                  aria-hidden="true"
                  className="size-4 rounded-full border border-black/10 shadow-sm"
                  style={{ background: background.swatch }}
                />
                <span>{background.label}</span>
                {appearance.background === background.name && <Check size={11} className="ml-auto text-[var(--accent)]" />}
              </button>
            ))}
          </div>
        </SettingRow>

        <SettingRow title={t("settings.interface_density")}>
          <Segmented<UiDensity>
            label={t("settings.interface_density")}
            value={appearance.density}
            onChange={(density) => void update({ appearance: { density } })}
            options={[
              { value: 'comfortable', label: t("settings.comfortable") },
              { value: 'compact', label: t("settings.compact") },
            ]}
          />
        </SettingRow>
      </section>

      <section>
        <h3 className="mb-1 text-[11px] font-semibold tracking-[0.06em] text-[var(--text-quaternary)]">
          {t("settings.preview_typography")}
        </h3>

        <SettingRow title={t("settings.body_font")}>
          <Segmented<ProseFont>
            label={t("settings.body_font")}
            value={appearance.proseFont}
            onChange={(proseFont) => void update({ appearance: { proseFont } })}
            options={[
              { value: 'sans', label: t("common.sans_serif") },
              { value: 'serif', label: t("settings.serif") },
            ]}
          />
        </SettingRow>

        <SettingRow title={t("settings.body_text_size")}>
          <Slider
            label={t("settings.body_text_size")}
            className="w-[200px]"
            value={appearance.proseSize}
            min={13}
            max={22}
            onChange={(proseSize) => void update({ appearance: { proseSize } })}
            suffix="px"
          />
        </SettingRow>

        <SettingRow title={t("settings.line_height")}>
          <Slider
            label={t("settings.line_height")}
            className="w-[200px]"
            value={appearance.proseLineHeight}
            min={1.4}
            max={2.2}
            step={0.05}
            onChange={(proseLineHeight) => void update({ appearance: { proseLineHeight } })}
          />
        </SettingRow>

        <SettingRow title={t("settings.content_width")}>
          <Segmented<ProseWidth>
            label={t("settings.content_width")}
            value={appearance.proseWidth}
            onChange={(proseWidth) => void update({ appearance: { proseWidth } })}
            options={[
              { value: 'narrow', label: t("settings.narrow") },
              { value: 'normal', label: t("settings.standard") },
              { value: 'wide', label: t("settings.wide") },
              { value: 'full', label: t("settings.full") },
            ]}
          />
        </SettingRow>
      </section>

      <PreviewSample />
    </div>
  )
}


function BrandingSettings() {
  const settings = useSession((s) => s.settings)
  const site = useSession((s) => s.site)
  const update = useSession((s) => s.updateSettings)
  const appearance = settings.appearance
  const inputRef = useRef<HTMLInputElement>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fallbackName = defaultAppName(site)

  const onNameChange = (value: string) => {
    void update({ appearance: { appName: value.slice(0, APP_DISPLAY_NAME_MAX_LENGTH) } })
  }

  const chooseFile = async (file: File | undefined) => {
    if (!file || processing) return
    setProcessing(true)
    setError(null)
    try {
      const dataUrl = await prepareAppIconUpload(file)
      void update({ appearance: { appIcon: dataUrl } })
    } catch (caught) {
      setError(appIconUploadError(caught))
    } finally {
      setProcessing(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <>
      <SettingRow title={t("settings.display_app_name")} description={t("settings.display_app_name_hint")}>
        <Input
          className="w-[220px]"
          value={appearance.appName}
          placeholder={fallbackName}
          maxLength={APP_DISPLAY_NAME_MAX_LENGTH}
          onChange={(event) => onNameChange(event.target.value)}
          aria-label={t("settings.display_app_name")}
        />
      </SettingRow>

      <SettingRow title={t("settings.app_icon")} description={t("settings.app_icon_hint")}>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center overflow-hidden rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-base)] text-[var(--accent)]">
              <Logo size={22} src={appearance.appIcon || null} />
            </span>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml,.svg"
              className="hidden"
              onChange={(event) => void chooseFile(event.target.files?.[0])}
            />
            <Button
              variant="secondary"
              size="sm"
              icon={<Upload size={13} />}
              loading={processing}
              onClick={() => inputRef.current?.click()}
            >
              {t("settings.upload_app_icon")}
            </Button>
            {appearance.appIcon ? (
              <Button
                variant="ghost"
                size="sm"
                icon={<RotateCcw size={13} />}
                disabled={processing}
                onClick={() => void update({ appearance: { appIcon: '' } })}
              >
                {t("settings.reset_app_icon")}
              </Button>
            ) : null}
          </div>
          {error ? <p className="max-w-[280px] text-right text-[11px] text-[var(--danger)]">{error}</p> : null}
        </div>
      </SettingRow>
    </>
  )
}

function appIconUploadError(caught: unknown): string {
  if (caught instanceof AppIconUploadError) {
    switch (caught.code) {
      case 'unsupported':
        return t('settings.app_icon_unsupported')
      case 'too_large':
        return t('settings.app_icon_too_large')
      case 'unsafe_svg':
        return t('settings.app_icon_unsafe_svg')
      case 'decode_failed':
        return t('settings.app_icon_decode_failed')
      case 'encode_failed':
        return t('settings.app_icon_encode_failed')
    }
  }
  return t('settings.action_failed_try_again')
}


function PreviewSample() {
  const appearance = useSession((s) => s.settings.appearance)
  return (
    <section>
      <h3 className="mb-2 text-[11px] font-semibold tracking-[0.06em] text-[var(--text-quaternary)]">
        {t("settings.preview")}
      </h3>
      <div className="rounded-[var(--r-lg)] border border-[var(--border-subtle)] bg-[var(--bg-base)] px-4 py-3">
        <div
          className="ink-prose"
          data-font={appearance.proseFont}
          style={{ maxWidth: 'none', paddingBlock: 0 }}
        >
          <h3 style={{ marginTop: 0 }}>{t("settings.q_a_in_the_mountains")}</h3>
          <p>
            {t("settings.asked_why_i_wanted_to_live_in_the_green_mountains_i_smiled_without_answe")}{' '}
            {t("settings.chinese_english_and")} <code>{t("common.inline_code")}</code> {t("settings.look_at_home_together")}
          </p>
        </div>
      </div>
    </section>
  )
}
