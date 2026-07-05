const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email) {
  if (!email.trim()) return 'validation.emailRequired';
  if (!EMAIL_REGEX.test(email.trim())) return 'validation.emailInvalid';
  return '';
}

export function validatePassword(password, { minLength = 8 } = {}) {
  if (!password) return 'validation.passwordRequired';
  if (password.length < minLength) return `validation.passwordMin:${minLength}`;
  return '';
}

export function validateName(name) {
  if (!name.trim()) return 'validation.nameRequired';
  if (name.trim().length < 2) return 'validation.nameMin';
  return '';
}

export function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword) return 'validation.confirmRequired';
  if (password !== confirmPassword) return 'validation.passwordsMismatch';
  return '';
}

export function formatValidationError(key, t) {
  if (!key) return '';
  const [path, min] = key.split(':');
  if (path === 'validation.passwordMin' && min) {
    return t(path, { min });
  }
  return t(path);
}
