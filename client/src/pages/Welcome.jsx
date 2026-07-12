import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import LanguageSwitcher from '../components/LanguageSwitcher';
import Logo from '../components/Logo';
import { Alert, Button } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Welcome() {
  const { loginDemo, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/analyze" replace />;
  }

  const features = [
    { icon: '◎', text: t('auth.feature1') },
    { icon: '✦', text: t('auth.feature2') },
    { icon: '◈', text: t('auth.feature3') },
  ];

  async function handleDemoLogin() {
    setError('');
    setLoading(true);
    try {
      await loginDemo();
      navigate('/analyze');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.errorGeneric'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-panel relative flex h-dvh flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-56 w-56 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute -right-16 bottom-10 h-64 w-64 rounded-full bg-teal-100/50 blur-3xl" />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-6xl shrink-0 items-center justify-between px-4 py-3 sm:px-8">
        <Logo to="/" />
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            to="/login"
            className="hidden text-sm font-semibold text-slate-600 transition-colors hover:text-sky-700 sm:inline"
          >
            {t('welcome.signIn')}
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 text-center sm:px-8">
        <div className="animate-fade-up">
          <img
            src="/logo.png"
            alt={t('common.appName')}
            className="mx-auto mb-3 h-14 w-14 object-contain sm:h-16 sm:w-16"
          />
          <span className="badge-gradient">{t('auth.badge')}</span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            {t('common.appName')}
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-600 sm:text-base">
            {t('auth.heroSubtitle')}
          </p>
        </div>

        <div className="mt-6 w-full max-w-md animate-fade-up animate-delay-1">
          {error && (
            <div className="mb-3 text-left">
              <Alert>{error}</Alert>
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            <Button
              type="button"
              variant="primary"
              size="lg"
              disabled={loading}
              className="w-full"
              onClick={handleDemoLogin}
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {t('welcome.startingDemo')}
                </>
              ) : (
                t('welcome.tryDemo')
              )}
            </Button>

            <div className="flex gap-2.5">
              <Link to="/login" className="flex-1">
                <Button type="button" variant="secondary" size="md" className="w-full">
                  {t('welcome.signIn')}
                </Button>
              </Link>
              <Link to="/register" className="flex-1">
                <Button type="button" variant="secondary" size="md" className="w-full">
                  {t('welcome.createAccount')}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 hidden w-full max-w-3xl gap-2.5 animate-fade-up animate-delay-2 sm:grid sm:grid-cols-3">
          {features.map(({ icon, text }) => (
            <div key={text} className="feature-item !px-3 !py-2.5 justify-start">
              <span className="feature-icon !h-7 !w-7 text-xs">{icon}</span>
              <span className="text-xs font-medium text-slate-700 sm:text-sm">{text}</span>
            </div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 shrink-0 py-3 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} {t('common.appName')}
      </footer>
    </div>
  );
}
