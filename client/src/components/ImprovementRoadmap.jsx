const PHASE_STYLES = [
  {
    border: 'border-sky-200',
    bg: 'bg-sky-50/60',
    badge: 'bg-sky-600 text-white',
    dot: 'bg-sky-500',
  },
  {
    border: 'border-amber-200',
    bg: 'bg-amber-50/60',
    badge: 'bg-amber-600 text-white',
    dot: 'bg-amber-500',
  },
  {
    border: 'border-emerald-200',
    bg: 'bg-emerald-50/60',
    badge: 'bg-emerald-600 text-white',
    dot: 'bg-emerald-500',
  },
];

export default function ImprovementRoadmap({ roadmap, t }) {
  if (!roadmap?.phases?.length) return null;

  return (
    <div className="border-t border-slate-100 px-6 py-7 sm:px-8">
      <h2 className="mb-1 text-sm font-semibold text-slate-900">{t('result.roadmapTitle')}</h2>
      <p className="mb-5 text-xs text-slate-500">{t('result.roadmapSubtitle')}</p>

      {roadmap.goal?.trim() && (
        <div className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            {t('result.roadmapGoal')}
          </p>
          <p className="mt-1 text-sm font-medium leading-relaxed text-slate-800">{roadmap.goal}</p>
        </div>
      )}

      <div className="space-y-4">
        {roadmap.phases.map((phase, index) => {
          const style = PHASE_STYLES[index % PHASE_STYLES.length];

          return (
            <div
              key={`${phase.title}-${index}`}
              className={`rounded-xl border ${style.border} ${style.bg} p-4 sm:p-5`}
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${style.badge}`}
                >
                  {index + 1}
                </span>
                <h3 className="text-sm font-bold text-slate-900">{phase.title}</h3>
                {phase.duration?.trim() && (
                  <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200/80">
                    {phase.duration}
                  </span>
                )}
              </div>

              {phase.tasks?.length > 0 && (
                <ul className="space-y-2">
                  {phase.tasks.map((task) => (
                    <li key={task} className="flex gap-2.5 text-sm text-slate-700">
                      <span
                        className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`}
                        aria-hidden
                      />
                      <span className="leading-relaxed">{task}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-5 text-xs text-slate-500">{t('result.roadmapReanalyze')}</p>
    </div>
  );
}
