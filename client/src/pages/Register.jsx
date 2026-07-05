import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import AuthLayout from '../components/AuthLayout';
import { Alert, Button } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  formatValidationError,
  validateConfirmPassword,
  validateEmail,
  validateName,
  validatePassword,
} from '../utils/validation';

function fieldClass(hasError) {
  return `input-field ${hasError ? 'input-field-error' : ''}`;
}

export default function Register() {
  const { register, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/analyze" replace />;
  }

  function validate() {
    const nextErrors = {
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword),
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
      await register(name, email, password);
      navigate('/analyze');
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : t('common.errorGeneric'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title={t('register.title')} subtitle={t('register.subtitle')}>
      <form onSubmit={handleSubmit} noValidate>
        {submitError && (
          <div className="mb-5">
            <Alert>{submitError}</Alert>
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">
            {t('register.fullName')}
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass(errors.name)}
            placeholder={t('register.namePlaceholder')}
          />
          {errors.name && (
            <p className="mt-1.5 text-sm text-rose-600">{formatValidationError(errors.name, t)}</p>
          )}
        </div>

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
            className={fieldClass(errors.email)}
            placeholder={t('login.emailPlaceholder')}
          />
          {errors.email && (
            <p className="mt-1.5 text-sm text-rose-600">{formatValidationError(errors.email, t)}</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
            {t('login.password')}
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass(errors.password)}
            placeholder={t('register.passwordPlaceholder')}
          />
          {errors.password && (
            <p className="mt-1.5 text-sm text-rose-600">
              {formatValidationError(errors.password, t)}
            </p>
          )}
        </div>

        <div className="mb-6">
          <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-700">
            {t('register.confirmPassword')}
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={fieldClass(errors.confirmPassword)}
            placeholder={t('register.confirmPlaceholder')}
          />
          {errors.confirmPassword && (
            <p className="mt-1.5 text-sm text-rose-600">
              {formatValidationError(errors.confirmPassword, t)}
            </p>
          )}
        </div>

        <Button type="submit" variant="primary" size="lg" disabled={loading} className="w-full">
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              {t('register.creating')}
            </>
          ) : (
            t('register.createAccount')
          )}
        </Button>

        <p className="mt-6 text-center text-sm text-slate-600">
          {t('register.hasAccount')}{' '}
          <Link
            to="/login"
            className="font-semibold text-sky-600 hover:text-sky-700"
          >
            {t('register.signIn')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
