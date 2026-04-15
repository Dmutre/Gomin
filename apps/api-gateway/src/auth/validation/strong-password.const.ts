export const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,128}$/;

export const STRONG_PASSWORD_MESSAGE =
  'Password must be 12–128 characters and include uppercase, lowercase, number, and special character';
