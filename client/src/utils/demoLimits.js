const DEMO_DONE_KEY = 'careerfit_demo_analysis_done';

export function markDemoAnalysisDone() {
  try {
    sessionStorage.setItem(DEMO_DONE_KEY, '1');
  } catch {
    // Ignore storage failures (private mode, etc.).
  }
}

export function hasDemoAnalysisDone() {
  try {
    return sessionStorage.getItem(DEMO_DONE_KEY) === '1';
  } catch {
    return false;
  }
}
