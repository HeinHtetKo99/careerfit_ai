import { apiRequest } from './client';

export function analyzeResume(token, { file, jobTitle, jobDescription, language = 'en' }) {
  const formData = new FormData();
  formData.append('resume', file);
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

export function listMatches(userId) {
  return apiRequest(`/matches/${userId}`);
}

export function getMatch(token, matchId) {
  return apiRequest(`/matches/detail/${matchId}`, { token });
}
