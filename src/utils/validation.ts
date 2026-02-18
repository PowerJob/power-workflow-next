import { useLocale } from '../hooks/useLocale';

export type ValidationResult = string | true | null;

export type ValidatorFn = (value: unknown) => ValidationResult;

export const required = (value: unknown): ValidationResult => {
  if (value === null || value === undefined || value === '') {
    return 'workflow.validation.required';
  }
  return true;
};

export const minLength = (min: number): ValidatorFn => {
  return (value: unknown): ValidationResult => {
    if (typeof value !== 'string') return true;
    if (value.length < min) {
      return `workflow.validation.minLength`;
    }
    return true;
  };
};

export const maxLength = (max: number): ValidatorFn => {
  return (value: unknown): ValidationResult => {
    if (typeof value !== 'string') return true;
    if (value.length > max) {
      return `workflow.validation.maxLength`;
    }
    return true;
  };
};

export const range = (min: number, max: number): ValidatorFn => {
  return (value: unknown): ValidationResult => {
    const num = Number(value);
    if (isNaN(num)) return true;
    if (num < min || num > max) {
      return 'workflow.validation.range';
    }
    return true;
  };
};

export const pattern = (regex: RegExp, messageKey = 'workflow.validation.pattern'): ValidatorFn => {
  return (value: unknown): ValidationResult => {
    if (typeof value !== 'string' || !value) return true;
    if (!regex.test(value)) {
      return messageKey;
    }
    return true;
  };
};

export const json = (value: unknown): ValidationResult => {
  if (!value || typeof value !== 'string' || !value.trim()) return true;
  try {
    JSON.parse(value);
    return true;
  } catch {
    return 'workflow.validation.json';
  }
};

const CONDITION_PATTERN = /\$\{[^}]+\}\s*(==|!=|>=|<=|>|<|contains|startsWith|endsWith)/i;

export const condition = (value: unknown): ValidationResult => {
  if (!value || typeof value !== 'string') return true;
  if (!CONDITION_PATTERN.test(value)) {
    return 'workflow.validation.condition';
  }
  return true;
};

export const positiveInteger = (value: unknown): ValidationResult => {
  if (value === null || value === undefined || value === '') return true;
  const num = Number(value);
  if (isNaN(num) || num < 1 || !Number.isInteger(num)) {
    return 'workflow.validation.positiveInteger';
  }
  return true;
};

export const nodeName = (value: unknown): ValidationResult => {
  if (!value || typeof value !== 'string') return required(value);
  const namePattern = /^[\u4e00-\u9fa5a-zA-Z0-9_-]+$/;
  if (!namePattern.test(value)) {
    return 'workflow.validation.nodeName';
  }
  if (value.length < 1 || value.length > 50) {
    return 'workflow.validation.nodeNameLength';
  }
  return true;
};

export type Severity = 'error' | 'warning';

export interface FieldValidation {
  value: unknown;
  errors: string[];
  warnings: string[];
  touched: boolean;
}

export interface ValidationRule {
  validator: ValidatorFn;
  severity?: Severity;
}

export const createFieldValidation = (initialValue: unknown): FieldValidation => ({
  value: initialValue,
  errors: [],
  warnings: [],
  touched: false,
});

export const validateField = (
  value: unknown,
  rules: ValidationRule[],
  t: (key: string) => string,
): { errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const rule of rules) {
    const result = rule.validator(value);
    if (result !== true && result !== null) {
      const message = t(result);
      if (rule.severity === 'warning') {
        warnings.push(message);
      } else {
        errors.push(message);
      }
    }
  }

  return { errors, warnings };
};

export const composeValidators = (...validators: ValidatorFn[]): ValidatorFn => {
  return (value: unknown): ValidationResult => {
    for (const validator of validators) {
      const result = validator(value);
      if (result !== true && result !== null) {
        return result;
      }
    }
    return true;
  };
};

export const useValidators = () => {
  const { t } = useLocale();
  return {
    required,
    minLength,
    maxLength,
    range,
    pattern,
    json,
    condition,
    positiveInteger,
    nodeName,
    validateField: (value: unknown, rules: ValidationRule[]) => validateField(value, rules, t),
    composeValidators,
  };
};
