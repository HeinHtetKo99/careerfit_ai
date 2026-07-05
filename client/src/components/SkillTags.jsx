import { useLanguage } from '../context/LanguageContext';

export default function SkillTags({ skills, variant = 'default' }) {
  const { t } = useLanguage();

  if (!skills?.length) {
    return <p className="text-sm text-slate-400">{t('common.none')}</p>;
  }

  const styles =
    variant === 'missing'
      ? 'bg-rose-50 text-rose-700 border-rose-100'
      : variant === 'matched'
        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
        : 'bg-sky-50 text-sky-700 border-sky-100';

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <span
          key={skill}
          className={`inline-flex items-center rounded-md border px-2.5 py-1 text-sm font-medium ${styles}`}
        >
          {skill}
        </span>
      ))}
    </div>
  );
}
