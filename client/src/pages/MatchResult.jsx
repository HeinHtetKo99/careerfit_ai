import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { getMatch } from '../api/matches';
import ScoreCircle from '../components/ScoreCircle';
import SkillTags from '../components/SkillTags';
import ImprovementRoadmap from '../components/ImprovementRoadmap';
import { Button, Card, Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { resolveMatchContent, hasContentBlock, secondaryLocaleFor } from '../utils/matchContent';

export default function MatchResult() {
  const { matchId } = useParams();
  const location = useLocation();
  const { token } = useAuth();
  const { t, locale } = useLanguage();

  const [match, setMatch] = useState(location.state?.match ?? null);
  const [loading, setLoading] = useState(!location.state?.match);
  const [error, setError] = useState('');
  const [translationPending, setTranslationPending] = useState(false);

  const secondaryLang = match ? secondaryLocaleFor(match.language) : 'en';
  const secondaryReady = match ? hasContentBlock(match.content_i18n?.[secondaryLang]) : true;
  const viewingSecondary = locale === secondaryLang;

  const content = useMemo(
    () => (match ? resolveMatchContent(match, locale) : null),
    [match, locale]
  );

  function scoreLabel(score) {
    if (score >= 75)
      return {
        text: t('result.strongMatch'),
        className: 'bg-emerald-500/10 text-emerald-700 ring-emerald-200',
      };
    if (score >= 50)
      return {
        text: t('result.moderateMatch'),
        className: 'bg-amber-500/10 text-amber-700 ring-amber-200',
      };
    return {
      text: t('result.needsWork'),
      className: 'bg-rose-500/10 text-rose-700 ring-rose-200',
    };
  }

  useEffect(() => {
    if (match || !matchId) return;

    let cancelled = false;

    async function load() {
      try {
        const data = await getMatch(token, matchId);
        if (!cancelled) setMatch(data.match);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : t('result.loadError'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [match, matchId, token, t]);

  useEffect(() => {
    if (!match?.id || !matchId || !token || secondaryReady) {
      setTranslationPending(false);
      return;
    }

    let cancelled = false;
    let attempts = 0;
    setTranslationPending(true);

    async function poll() {
      while (!cancelled && attempts < 20) {
        attempts += 1;
        await new Promise((resolve) => setTimeout(resolve, 2000));
        if (cancelled) return;

        try {
          const data = await getMatch(token, matchId);
          if (cancelled) return;
          setMatch(data.match);
          if (hasContentBlock(data.match.content_i18n?.[secondaryLang])) {
            setTranslationPending(false);
            return;
          }
        } catch {
          // Keep polling until attempts exhausted.
        }
      }

      if (!cancelled) setTranslationPending(false);
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [match?.id, matchId, secondaryLang, secondaryReady, token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Spinner className="h-10 w-10" />
        <p className="text-sm text-slate-500">{t('common.loading')}</p>
      </div>
    );
  }

  if (error || !match || !content) {
    return (
      <div className="mx-auto max-w-lg animate-fade-up text-center">
        <Card className="p-10">
          <p className="text-slate-600">{error || t('result.notFound')}</p>
          <Link to="/analyze" className="mt-6 inline-block">
            <Button variant="primary">{t('result.startNew')}</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const score = match.match_score ?? 0;
  const label = scoreLabel(score);
  const title = match.job_title?.trim() || t('result.jobAnalysis');
  const barColor =
    score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-rose-500';
  const profileSkills = match.resume_profile?.parsed_skills ?? [];
  const yearsExperience = match.resume_profile?.parsed_experience?.years_experience ?? 0;
  const hasProfile =
    yearsExperience > 0 ||
    content.education ||
    content.summary ||
    profileSkills.length > 0;

  return (
    <div className="mx-auto max-w-3xl animate-fade-up">
      <Link
        to="/analyze"
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
      >
        {t('result.analyzeAnother')}
      </Link>

      {viewingSecondary && !secondaryReady && translationPending && (
        <div className="mb-4 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          {t('result.translationLoading')}
        </div>
      )}

      <Card className="overflow-hidden" glow>
        <div className="border-b border-slate-100 bg-sky-50/50 px-6 py-7 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-600">
            {t('result.matchResult')}
          </p>
          <h1 className="mt-1.5 text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
          <span
            className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${label.className}`}
          >
            {label.text}
          </span>
        </div>

        <div className="flex flex-col items-center gap-8 px-6 py-10 sm:flex-row sm:items-start sm:px-8">
          <ScoreCircle score={score} />

          <div className="w-full flex-1 space-y-6">
            <div>
              <div className="mb-2.5 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700">{t('result.overallScore')}</span>
                <span className="text-lg font-bold text-slate-900">{Math.round(score)}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
                  style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-white p-4">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t('result.skillsMatch')}
              </h2>
              <SkillTags skills={match.matched_skills} variant="matched" />
            </div>

            <div className="rounded-xl border border-slate-100 bg-white p-4">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t('result.skillsImprove')}
              </h2>
              <SkillTags skills={match.missing_skills} variant="missing" />
            </div>
          </div>
        </div>

        {hasProfile && (
          <div className="border-t border-slate-100 px-6 py-7 sm:px-8">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">{t('result.cvSnapshot')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {t('result.yearsExperience')}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {yearsExperience > 0
                    ? t('result.yearsValue', { count: yearsExperience })
                    : t('common.none')}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {t('result.education')}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {content.education?.trim() || t('common.none')}
                </p>
              </div>
            </div>
            {content.summary?.trim() && (
              <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {t('result.professionalSummary')}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{content.summary}</p>
              </div>
            )}
            {profileSkills.length > 0 && (
              <div className="mt-4 rounded-xl border border-slate-100 bg-white p-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {t('result.keySkills')}
                </h3>
                <SkillTags skills={profileSkills} variant="matched" />
              </div>
            )}
          </div>
        )}

        {content.improvements?.length > 0 && (
          <div className="border-t border-slate-100 px-6 py-7 sm:px-8">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">{t('result.whatToImprove')}</h2>
            <ul className="space-y-2.5">
              {content.improvements.map((item, i) => (
                <li
                  key={`${item}-${i}`}
                  className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-600 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <ImprovementRoadmap roadmap={content.roadmap} t={t} />

        {content.feedback && (
          <div className="border-t border-slate-100 px-6 py-6 sm:px-8">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-100 text-[10px] font-bold text-sky-700">
                {t('result.aiCoach')}
              </span>
              {t('result.aiFeedback')}
            </h2>
            <p className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
              {content.feedback}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-3 border-t border-slate-100 px-6 py-5 sm:px-8">
          <Link to="/dashboard">
            <Button variant="primary">{t('result.viewHistory')}</Button>
          </Link>
          <Link to="/analyze">
            <Button variant="secondary">{t('result.analyzeAnotherJob')}</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
