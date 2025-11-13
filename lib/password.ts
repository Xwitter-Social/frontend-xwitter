export interface PasswordRequirement {
  id: string;
  text: string;
  regex: RegExp;
}

export interface PasswordValidationItem extends PasswordRequirement {
  isValid: boolean;
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { id: 'length', text: 'Pelo menos 8 caracteres', regex: /.{8,}/ },
  { id: 'uppercase', text: 'Uma letra maiúscula', regex: /[A-Z]/ },
  { id: 'lowercase', text: 'Uma letra minúscula', regex: /[a-z]/ },
  { id: 'number', text: 'Um número', regex: /\d/ },
  { id: 'symbol', text: 'Um símbolo', regex: /[!@#$%^&*(),.?":{}|<>]/ },
];

export function getPasswordValidation(
  password: string,
): PasswordValidationItem[] {
  return PASSWORD_REQUIREMENTS.map((requirement) => ({
    ...requirement,
    isValid: requirement.regex.test(password),
  }));
}

export function isPasswordCompliant(password: string): boolean {
  if (!password) {
    return false;
  }

  return PASSWORD_REQUIREMENTS.every((requirement) =>
    requirement.regex.test(password),
  );
}
