import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../api/client';
import { listMatches } from '../api/matches';
import { Alert, Button, Card, Spinner, StatCard } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

function formatDate(value, locale) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(locale === 'my' ? 'my-MM' : undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function scoreStyle(score) {
  if (score >= 75) return 'text-emerald-700 bg-emerald-50 ring-emerald-200/80';
  if (score >= 50) return 'text-amber-700 bg-amber-50 ring-amber-200/80';
  return 'text-rose-700 bg-rose-50 ring-rose-200/80';
}

function truncate(text, max = 80) {
  if (!text) return '—';
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { locale, t } = useLanguage();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await listMatches(user.id);
        if (!cancelled) setMatches(data.matches ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : t('dashboard.loadError'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user.id, t]);

  const stats = useMemo(() => {
    if (!matches.length) return { total: 0, avg: 0, best: 0 };
    const scores = matches.map((m) => m.match_score ?? 0);
    return {
      total: matches.length,
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      best: Math.round(Math.max(...scores)),
    };
  }, [matches]);

  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => {
      const diff =
        sortField === 'date'
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : (a.match_score ?? 0) - (b.match_score ?? 0);
      return sortDir === 'asc' ? diff : -diff;
    });
  }, [matches, sortField, sortDir]);

  function toggleDateSort() {
    setSortField('date');
    setSortDir((prev) => (sortField === 'date' ? (prev === 'desc' ? 'asc' : 'desc') : 'desc'));
  }

  function toggleScoreSort() {
    setSortField('score');
    setSortDir((prev) => (sortField === 'score' ? (prev === 'desc' ? 'asc' : 'desc') : 'desc'));
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Spinner className="h-10 w-10" />
        <p className="text-sm text-slate-500">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t('dashboard.title')}</h1>
          <p className="mt-2 text-slate-600">{t('dashboard.welcome', { name: user.name })}</p>
        </div>
        <Link to="/analyze">
          <Button variant="primary" size="md">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {t('dashboard.newAnalysis')}
          </Button>
        </Link>
      </div>

      {matches.length > 0 && (
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <StatCard label={t('dashboard.statTotal')} value={stats.total} accent="indigo" />
          <StatCard label={t('dashboard.statAvg')} value={`${stats.avg}%`} accent="amber" />
          <StatCard label={t('dashboard.statBest')} value={`${stats.best}%`} accent="emerald" />
        </div>
      )}

      {error && (
        <div className="mb-6">
          <Alert>{error}</Alert>
        </div>
      )}

      <Card className="overflow-hidden" glow>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {t('dashboard.colRole')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <button
                    type="button"
                    onClick={toggleScoreSort}
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-sky-600"
                  >
                    {t('dashboard.colScore')}
                    {sortField === 'score' && (
                      <span className="text-sky-600">{sortDir === 'desc' ? '↓' : '↑'}</span>
                    )}
                  </button>
                </th>
                <th className="hidden px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 md:table-cell">
                  {t('dashboard.colGaps')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <button
                    type="button"
                    onClick={toggleDateSort}
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-sky-600"
                  >
                    {t('dashboard.colDate')}
                    {sortField === 'date' && (
                      <span className="text-sky-600">{sortDir === 'desc' ? '↓' : '↑'}</span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {t('dashboard.colView')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedMatches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="mx-auto max-w-sm">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-2xl">
                        📋
                      </div>
                      <p className="text-slate-500">{t('dashboard.empty')}</p>
                      <Link
                        to="/analyze"
                        className="mt-3 inline-block font-semibold text-sky-600 hover:text-sky-700"
                      >
                        {t('dashboard.emptyLink')} →
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedMatches.map((match) => (
                  <tr key={match.id} className="table-row-hover">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">
                        {match.job_title?.trim() || t('common.untitled')}
                      </p>
                      <p className="mt-0.5 max-w-xs truncate text-xs text-slate-500">
                        {truncate(match.job_description, 100)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-lg px-2.5 py-1 text-sm font-bold ring-1 ring-inset ${scoreStyle(match.match_score)}`}
                      >
                        {Math.round(match.match_score)}%
                      </span>
                    </td>
                    <td className="hidden px-6 py-4 md:table-cell">
                      <p className="max-w-xs truncate text-sm text-slate-600">
                        {match.missing_skills?.length
                          ? match.missing_skills.join(', ')
                          : t('common.none')}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDate(match.created_at, locale)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/result/${match.id}`}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700"
                      >
                        {t('dashboard.details')}
                        <span aria-hidden>→</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
