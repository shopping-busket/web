import { createI18n, I18n } from 'vue-i18n';
import { nextTick } from 'vue';

export async function loadLocaleMessages(i18n: I18n, locale: string) {
  const messages = await import(`./locales/${locale}.json`);
  i18n.global.setLocaleMessage(locale, messages.default);
  return nextTick();
}

const i18n = createI18n({
  locale: import.meta.env.VUE_APP_I18N_LOCALE || 'en',
  fallbackLocale: import.meta.env.VUE_APP_I18N_FALLBACK_LOCALE || 'en',
});
await loadLocaleMessages(i18n, i18n.global.locale);
export default i18n;
