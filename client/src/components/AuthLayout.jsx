import LanguageSwitcher from './LanguageSwitcher';
import Logo from './Logo';
import { useLanguage } from '../context/LanguageContext';

export default function AuthLayout({ children, title, subtitle }) {
  const { t } = useLanguage();

  const features = [
    { icon: '◎', text: t('auth.feature1') },
    { icon: '✦', text: t('auth.feature2') },
    { icon: '◈', text: t('auth.feature3') },
  ];

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      <div className="auth-panel relative hidden flex-col justify-between p-10 lg:flex">
        <div className="flex items-center justify-between">
          <Logo />
          <LanguageSwitcher />
        </div>

        <div className="max-w-md animate-fade-up">
          <img
            src="/logo.png"
            alt={t('common.appName')}
            className="mb-6 h-20 w-20 object-contain"
          />
          <span className="badge-gradient">{t('auth.badge')}</span>
          <h2 className="mt-5 text-3xl font-bold leading-snug tracking-tight text-slate-900 xl:text-4xl">
            {t('auth.heroTitle')}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600">{t('auth.heroSubtitle')}</p>

          <div className="mt-8 space-y-3">
            {features.map(({ icon, text }) => (
              <div key={text} className="feature-item">
                <span className="feature-icon">{icon}</span>
                <span className="text-sm font-medium text-slate-700">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-slate-400">
          © {new Date().getFullYear()} {t('common.appName')}
        </p>
      </div>

      <div className="flex min-h-screen flex-col justify-center bg-white px-4 py-10 sm:px-8">
        <div className="absolute right-4 top-4 lg:hidden">
          <LanguageSwitcher />
        </div>

        <div className="mx-auto w-full max-w-md animate-fade-up">
          <div className="mb-8 text-center lg:hidden">
            <div className="mb-5 flex justify-center">
              <img src="/logo.png" alt={t('common.appName')} className="h-14 w-14 object-contain" />
            </div>
          </div>

          <div className="mb-6 text-center lg:text-left">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
            <p className="mt-2 text-slate-500">{subtitle}</p>
          </div>

          <div className="card-surface p-7 sm:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
