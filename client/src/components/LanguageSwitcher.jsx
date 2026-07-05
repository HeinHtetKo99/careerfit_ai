import { useLanguage } from '../context/LanguageContext';

export default function LanguageSwitcher({ className = '' }) {
  const { locale, setLocale, t } = useLanguage();

  return (
    <div
      className={`inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-semibold ${className}`}
      role="group"
      aria-label={t('language.label')}
    >
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`rounded-md px-3 py-1.5 transition-colors ${
          locale === 'en'
            ? 'bg-sky-600 text-white'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        {t('language.en')}
      </button>
      <button
        type="button"
        onClick={() => setLocale('my')}
        className={`rounded-md px-3 py-1.5 transition-colors ${
          locale === 'my'
            ? 'bg-sky-600 text-white'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        {t('language.my')}
      </button>
    </div>
  );
}
