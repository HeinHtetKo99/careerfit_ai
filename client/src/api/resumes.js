import { apiRequest } from './client';

export function getPrimaryResume(token) {
  return apiRequest('/resumes/primary', { token });
}
