import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { analyzeResume } from '../api/matches';
import DropZone from '../components/DropZone';
import { Alert, Button, Card, PageHeader, Spinner, StepBadge } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const MIN_JOB_DESC = 50;

function getAnalyzeErrorMessage(err, t) {
  if (!(err instanceof ApiError)) {
    return t('analyze.errorFailed');
  }

  if (err.status === 503 || err.code?.startsWith('GEMINI')) {
    if (err.code === 'GEMINI_QUOTA') return t('analyze.errorGeminiQuota');
    if (err.code === 'GEMINI_UNAVAILABLE') return t('analyze.errorGeminiUnavailable');
    return t('analyze.errorGemini');
  }

  return t('analyze.errorFailed');
}

function AnalyzeOverlay({ file, jobTitle, loadingStep, loadingSteps, hint }) {
  return (
    <div className="analyze-overlay animate-fade-in" role="dialog" aria-modal="true" aria-busy="true">
      <Card className="animate-scale-in w-full max-w-md p-8 text-center" glow>
        <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center">
          <span className="analyze-spinner-ring" aria-hidden="true" />
          <Spinner className="relative h-12 w-12" />
        </div>

        <h2 className="text-lg font-bold text-slate-900">{loadingSteps[loadingStep]}</h2>
        <p className="mt-2 text-sm text-slate-500">{hint}</p>

        {file && (
          <p className="mt-4 truncate rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
            {file.name}
            {jobTitle?.trim() ? ` · ${jobTitle.trim()}` : ''}
          </p>
        )}

        <ul className="mt-6 space-y-2 text-left">
          {loadingSteps.map((step, i) => {
            const done = i < loadingStep;
            const active = i === loadingStep;

            return (
              <li
                key={step}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active ? 'bg-sky-50 text-sky-800' : done ? 'text-emerald-700' : 'text-slate-400'
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    done
                      ? 'bg-emerald-500 text-white'
                      : active
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {done ? '✓' : i + 1}
                </span>
                <span className={active ? 'font-semibold' : 'font-medium'}>{step}</span>
              </li>
            );
          })}
        </ul>

        <div className="mx-auto mt-6 flex max-w-xs justify-center gap-1.5">
          {loadingSteps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                i <= loadingStep ? 'bg-sky-500' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function Analyze() {
  const { token } = useAuth();
  const { locale, t } = useLanguage();
  const navigate = useNavigate();
  const errorRef = useRef(null);

  const loadingSteps = useMemo(
    () => [t('analyze.loadingStep1'), t('analyze.loadingStep2'), t('analyze.loadingStep3')],
    [t]
  );

  const [file, setFile] = useState(null);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState('');

  const step1Done = Boolean(file);
  const step2Done = jobDescription.trim().length >= MIN_JOB_DESC;
  const canAnalyze = step1Done && step2Done && !analyzing;

  useEffect(() => {
    if (!analyzing) {
      setLoadingStep(0);
      return undefined;
    }

    const timers = [
      setTimeout(() => setLoadingStep(1), 2500),
      setTimeout(() => setLoadingStep(2), 6000),
    ];

    return () => timers.forEach(clearTimeout);
  }, [analyzing]);

  useEffect(() => {
    if (!analyzing) return undefined;

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [analyzing]);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error]);

  function handleFileSelect(selected) {
    if (selected.type !== 'application/pdf' && !selected.name.toLowerCase().endsWith('.pdf')) {
      setError(t('analyze.errorPdfOnly'));
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setError(t('analyze.errorFileSize'));
      return;
    }

    setError('');
    setFile(selected);
  }

  async function handleAnalyze() {
    if (!file) {
      setError(t('analyze.errorNoFile'));
      return;
    }

    if (jobDescription.trim().length < MIN_JOB_DESC) {
      setError(t('analyze.errorMinChars', { min: MIN_JOB_DESC }));
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      const data = await analyzeResume(token, {
        file,
        jobTitle,
        jobDescription: jobDescription.trim(),
        language: locale,
      });

      navigate(`/result/${data.match.id}`, {
        state: { match: data.match },
      });
    } catch (err) {
      setError(getAnalyzeErrorMessage(err, t));
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <>
      <div className="mx-auto max-w-5xl pb-32">
        <PageHeader
          badge={t('analyze.badge')}
          title={t('analyze.title')}
          subtitle={t('analyze.subtitle')}
          className="mb-12"
        />

        <div className="animate-fade-up animate-delay-1 mb-10 flex items-center justify-center gap-3">
          <div className="flex items-center gap-2">
            <StepBadge number={1} active={!step1Done} done={step1Done} />
            <span className={`text-sm font-medium ${step1Done ? 'text-emerald-600' : 'text-slate-600'}`}>
              CV
            </span>
          </div>
          <div className={`h-0.5 w-12 rounded-full transition-colors ${step1Done ? 'bg-emerald-400' : 'bg-slate-200'}`} />
          <div className="flex items-center gap-2">
            <StepBadge number={2} active={step1Done && !step2Done} done={step2Done} />
            <span className={`text-sm font-medium ${step2Done ? 'text-emerald-600' : 'text-slate-600'}`}>
              Job
            </span>
          </div>
          <div className={`h-0.5 w-12 rounded-full transition-colors ${step2Done ? 'bg-emerald-400' : 'bg-slate-200'}`} />
          <div className="flex items-center gap-2">
            <StepBadge number={3} active={canAnalyze} done={false} />
            <span className="text-sm font-medium text-slate-600">Result</span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <Card className="animate-fade-up animate-delay-1 p-6 sm:p-7" glow>
            <div className="mb-5 flex items-start gap-3">
              <StepBadge number={1} active={!step1Done} done={step1Done} />
              <div>
                <h2 className="text-lg font-bold text-slate-900">{t('analyze.step1Title')}</h2>
                <p className="mt-0.5 text-sm text-slate-500">{t('analyze.step1Hint')}</p>
              </div>
            </div>

            <DropZone onFileSelect={handleFileSelect} disabled={analyzing} />

            {file && (
              <div className="mt-4 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-extrabold text-rose-600 shadow-sm ring-1 ring-rose-100">
                  PDF
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                  disabled={analyzing}
                >
                  {t('common.remove')}
                </Button>
              </div>
            )}
          </Card>

          <Card className="animate-fade-up animate-delay-2 p-6 sm:p-7" glow>
            <div className="mb-5 flex items-start gap-3">
              <StepBadge number={2} active={step1Done && !step2Done} done={step2Done} />
              <div>
                <h2 className="text-lg font-bold text-slate-900">{t('analyze.step2Title')}</h2>
                <p className="mt-0.5 text-sm text-slate-500">{t('analyze.step2Hint')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="job-title" className="mb-2 block text-sm font-medium text-slate-700">
                  {t('analyze.jobTitle')}{' '}
                  <span className="font-normal text-slate-400">{t('common.optional')}</span>
                </label>
                <input
                  id="job-title"
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  disabled={analyzing}
                  placeholder={t('analyze.jobTitlePlaceholder')}
                  className="input-field"
                />
              </div>

              <div>
                <label htmlFor="job-description" className="mb-2 block text-sm font-medium text-slate-700">
                  {t('analyze.jobDescription')}
                </label>
                <textarea
                  id="job-description"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  disabled={analyzing}
                  rows={8}
                  placeholder={t('analyze.jobDescriptionPlaceholder')}
                  className="input-field resize-y leading-relaxed"
                />
                <div className="mt-2 flex items-center justify-between">
                  <p
                    className={`text-xs font-medium ${
                      step2Done ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    {t('analyze.charCount', {
                      count: jobDescription.trim().length,
                      min: MIN_JOB_DESC,
                    })}
                  </p>
                  {step2Done && (
                    <span className="text-xs font-medium text-emerald-600">✓ Ready</span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {error && (
          <div ref={errorRef} className="mt-6">
            <Alert>{error}</Alert>
          </div>
        )}
      </div>

      <div className="analyze-action-bar">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">
              {canAnalyze ? t('analyze.actionReady') : t('analyze.actionIncomplete')}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className={step1Done ? 'font-medium text-emerald-600' : 'text-slate-400'}>
                {step1Done ? `✓ ${t('analyze.stepCv')}` : `○ ${t('analyze.step1Title')}`}
              </span>
              <span className={step2Done ? 'font-medium text-emerald-600' : 'text-slate-400'}>
                {step2Done ? `✓ ${t('analyze.stepJob')}` : `○ ${t('analyze.step2Title')}`}
              </span>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleAnalyze}
            disabled={!canAnalyze}
            className="shrink-0 min-w-[180px] sm:min-w-[220px]"
          >
            {analyzing ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {t('analyze.analyzing')}
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                  />
                </svg>
                {t('analyze.analyzeMatch')}
              </>
            )}
          </Button>
        </div>
      </div>

      {analyzing && (
        <AnalyzeOverlay
          file={file}
          jobTitle={jobTitle}
          loadingStep={loadingStep}
          loadingSteps={loadingSteps}
          hint={t('analyze.loadingHint')}
        />
      )}
    </>
  );
}
