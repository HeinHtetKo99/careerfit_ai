import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import AuthLayout from '../components/AuthLayout';
import { Alert, Button } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { formatValidationError, validateEmail, validatePassword } from '../utils/validation';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/analyze" replace />;
  }

  function validate() {
    const nextErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');

    if (!validate()) return;

    setLoading(true);
    try {
      await login(email, password);
      navigate('/analyze');
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : t('common.errorGeneric'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title={t('login.title')} subtitle={t('login.subtitle')}>
      <form onSubmit={handleSubmit} noValidate>
        {submitError && (
          <div className="mb-5">
            <Alert>{submitError}</Alert>
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
            {t('login.email')}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`input-field ${errors.email ? 'input-field-error' : ''}`}
            placeholder={t('login.emailPlaceholder')}
          />
          {errors.email && (
            <p className="mt-1.5 text-sm text-rose-600">{formatValidationError(errors.email, t)}</p>
          )}
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
            {t('login.password')}
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`input-field ${errors.password ? 'input-field-error' : ''}`}
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="mt-1.5 text-sm text-rose-600">
              {formatValidationError(errors.password, t)}
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              {t('login.signingIn')}
            </>
          ) : (
            t('login.signIn')
          )}
        </Button>

        <p className="mt-6 text-center text-sm text-slate-600">
          {t('login.noAccount')}{' '}
          <Link
            to="/register"
            className="font-semibold text-sky-600 hover:text-sky-700"
          >
            {t('login.createOne')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
