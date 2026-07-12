import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Logo({ to = '/', size = 'md' }) {
  const { t } = useLanguage();

  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-12 w-12',
  };

  return (
    <Link to={to} className="group flex items-center gap-2.5">
      <img
        src="/logo.png"
        alt={t('common.appName')}
        className={`${sizes[size]} shrink-0 object-contain transition-transform duration-200 group-hover:scale-105`}
      />
      <span className="text-lg font-bold tracking-tight text-slate-900">{t('common.appName')}</span>
    </Link>
  );
}
