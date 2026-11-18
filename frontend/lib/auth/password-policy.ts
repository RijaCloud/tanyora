export const PASSWORD_MIN_LENGTH = 8;

export const passwordRequirements = [
  { key: "length", label: `${PASSWORD_MIN_LENGTH} caracteres minimum`, test: (value: string) => value.length >= PASSWORD_MIN_LENGTH },
  { key: "lower", label: "Une lettre minuscule", test: (value: string) => /[a-z]/.test(value) },
  { key: "upper", label: "Une lettre majuscule", test: (value: string) => /[A-Z]/.test(value) },
  { key: "digit", label: "Un chiffre", test: (value: string) => /\d/.test(value) },
  { key: "special", label: "Un caractere special", test: (value: string) => /[^A-Za-z0-9]/.test(value) },
] as const;

export function getPasswordRequirementResults(password: string) {
  return passwordRequirements.map((requirement) => ({
    key: requirement.key,
    label: requirement.label,
    ok: requirement.test(password),
  }));
}

export function getFirstPasswordRequirementFailure(password: string) {
  return getPasswordRequirementResults(password).find((requirement) => !requirement.ok) || null;
}

export function isStrongPassword(password: string) {
  return !getFirstPasswordRequirementFailure(password);
}
