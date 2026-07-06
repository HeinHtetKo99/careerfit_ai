const MAX_GOAL_LEN = 200;
const MAX_PHASES = 3;
const MAX_TASKS_PER_PHASE = 4;
const MAX_TASK_LEN = 300;
const MAX_TITLE_LEN = 80;
const MAX_DURATION_LEN = 50;

function normalizePhase(phase) {
  if (!phase || typeof phase !== 'object') return null;

  const title =
    typeof phase.title === 'string' ? phase.title.trim().slice(0, MAX_TITLE_LEN) : '';
  const duration =
    typeof phase.duration === 'string' ? phase.duration.trim().slice(0, MAX_DURATION_LEN) : '';
  const tasks = Array.isArray(phase.tasks)
    ? phase.tasks
        .filter((task) => typeof task === 'string' && task.trim())
        .slice(0, MAX_TASKS_PER_PHASE)
        .map((task) => task.trim().slice(0, MAX_TASK_LEN))
    : [];

  if (!title && tasks.length === 0) return null;

  return {
    title: title || 'Phase',
    duration,
    tasks,
  };
}

function normalizeRoadmap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { goal: '', phases: [] };
  }

  const goal =
    typeof value.goal === 'string' ? value.goal.trim().slice(0, MAX_GOAL_LEN) : '';

  const phases = Array.isArray(value.phases)
    ? value.phases
        .slice(0, MAX_PHASES)
        .map(normalizePhase)
        .filter(Boolean)
    : [];

  return { goal, phases };
}

function hasRoadmapContent(roadmap) {
  const normalized = normalizeRoadmap(roadmap);
  return Boolean(normalized.goal || normalized.phases.length > 0);
}

module.exports = { normalizeRoadmap, hasRoadmapContent };
