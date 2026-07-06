import { apiRequest } from './client';

export function analyzeResume(token, { file, jobTitle, jobDescription, language = 'en', useSavedResume = false }) {
  const formData = new FormData();

  if (file) {
    formData.append('resume', file);
  } else if (useSavedResume) {
    formData.append('use_saved_resume', 'true');
  }

  formData.append('job_description', jobDescription);
  if (jobTitle?.trim()) {
    formData.append('job_title', jobTitle.trim());
  }
  if (language) {
    formData.append('language', language);
  }

  return apiRequest('/analyze', {
    method: 'POST',
    token,
    formData,
  });
}

export function listMatches(userId, token) {
  return apiRequest(`/matches/${userId}`, { token });
}

export function getMatch(token, matchId) {
  return apiRequest(`/matches/detail/${matchId}`, { token });
}

export function deleteAllMatches(userId, token) {
  return apiRequest(`/matches/${userId}`, { method: 'DELETE', token });
}
