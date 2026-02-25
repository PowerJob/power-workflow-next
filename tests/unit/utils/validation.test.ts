import { describe, it, expect } from 'vitest';
import {
  required,
  minLength,
  maxLength,
  range,
  pattern,
  json,
  condition,
  positiveInteger,
  nodeName,
  createFieldValidation,
  validateField,
  composeValidators,
  type ValidationRule,
} from '@/utils/validation';

describe('validation', () => {
  describe('required', () => {
    it('should return error for null value', () => {
      expect(required(null)).toBe('workflow.validation.required');
    });

    it('should return error for undefined value', () => {
      expect(required(undefined)).toBe('workflow.validation.required');
    });

    it('should return error for empty string', () => {
      expect(required('')).toBe('workflow.validation.required');
    });

    it('should return true for non-empty string', () => {
      expect(required('test')).toBe(true);
    });

    it('should return true for number 0', () => {
      expect(required(0)).toBe(true);
    });

    it('should return true for false', () => {
      expect(required(false)).toBe(true);
    });

    it('should return true for whitespace string', () => {
      expect(required('   ')).toBe(true);
    });
  });

  describe('minLength', () => {
    const validator = minLength(3);

    it('should return error for string shorter than min', () => {
      expect(validator('ab')).toBe('workflow.validation.minLength');
    });

    it('should return true for string equal to min', () => {
      expect(validator('abc')).toBe(true);
    });

    it('should return true for string longer than min', () => {
      expect(validator('abcd')).toBe(true);
    });

    it('should return true for non-string values', () => {
      expect(validator(123)).toBe(true);
      expect(validator(null)).toBe(true);
    });

    it('should return error for empty string', () => {
      expect(validator('')).toBe('workflow.validation.minLength');
    });
  });

  describe('maxLength', () => {
    const validator = maxLength(5);

    it('should return error for string longer than max', () => {
      expect(validator('abcdef')).toBe('workflow.validation.maxLength');
    });

    it('should return true for string equal to max', () => {
      expect(validator('abcde')).toBe(true);
    });

    it('should return true for string shorter than max', () => {
      expect(validator('abc')).toBe(true);
    });

    it('should return true for non-string values', () => {
      expect(validator(123)).toBe(true);
      expect(validator(null)).toBe(true);
    });
  });

  describe('range', () => {
    const validator = range(1, 100);

    it('should return error for value below min', () => {
      expect(validator(0)).toBe('workflow.validation.range');
    });

    it('should return error for value above max', () => {
      expect(validator(101)).toBe('workflow.validation.range');
    });

    it('should return true for value at min', () => {
      expect(validator(1)).toBe(true);
    });

    it('should return true for value at max', () => {
      expect(validator(100)).toBe(true);
    });

    it('should return true for value in range', () => {
      expect(validator(50)).toBe(true);
    });

    it('should return true for non-numeric values', () => {
      expect(validator('abc')).toBe(true);
      expect(validator(NaN)).toBe(true);
    });

    it('should work with string numbers', () => {
      expect(validator('50')).toBe(true);
      expect(validator('0')).toBe('workflow.validation.range');
    });
  });

  describe('pattern', () => {
    const emailValidator = pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

    it('should return error for non-matching string', () => {
      expect(emailValidator('invalid-email')).toBe('workflow.validation.pattern');
    });

    it('should return true for matching string', () => {
      expect(emailValidator('test@example.com')).toBe(true);
    });

    it('should return true for empty string', () => {
      expect(emailValidator('')).toBe(true);
    });

    it('should return true for non-string values', () => {
      expect(emailValidator(123)).toBe(true);
    });

    it('should use custom message key', () => {
      const customValidator = pattern(/^[A-Z]+$/, 'custom.message.key');
      expect(customValidator('abc')).toBe('custom.message.key');
    });
  });

  describe('json', () => {
    it('should return error for invalid JSON string', () => {
      expect(json('{invalid}')).toBe('workflow.validation.json');
    });

    it('should return true for valid JSON string', () => {
      expect(json('{"key": "value"}')).toBe(true);
    });

    it('should return true for valid JSON array', () => {
      expect(json('[1, 2, 3]')).toBe(true);
    });

    it('should return true for empty string', () => {
      expect(json('')).toBe(true);
    });

    it('should return true for whitespace-only string', () => {
      expect(json('   ')).toBe(true);
    });

    it('should return true for null/undefined', () => {
      expect(json(null)).toBe(true);
      expect(json(undefined)).toBe(true);
    });
  });

  describe('condition', () => {
    it('should return true for valid condition with ==', () => {
      expect(condition('${var} == "value"')).toBe(true);
    });

    it('should return true for valid condition with !=', () => {
      expect(condition('${var} != "value"')).toBe(true);
    });

    it('should return true for valid condition with comparison operators', () => {
      expect(condition('${var} > 10')).toBe(true);
      expect(condition('${var} < 10')).toBe(true);
      expect(condition('${var} >= 10')).toBe(true);
      expect(condition('${var} <= 10')).toBe(true);
    });

    it('should return true for valid condition with string operators', () => {
      expect(condition('${var} contains "test"')).toBe(true);
      expect(condition('${var} startsWith "test"')).toBe(true);
      expect(condition('${var} endsWith "test"')).toBe(true);
    });

    it('should return error for invalid condition', () => {
      expect(condition('invalid condition')).toBe('workflow.validation.condition');
    });

    it('should return true for empty string', () => {
      expect(condition('')).toBe(true);
    });

    it('should return true for null/undefined', () => {
      expect(condition(null)).toBe(true);
      expect(condition(undefined)).toBe(true);
    });
  });

  describe('positiveInteger', () => {
    it('should return true for positive integers', () => {
      expect(positiveInteger(1)).toBe(true);
      expect(positiveInteger(100)).toBe(true);
    });

    it('should return error for zero', () => {
      expect(positiveInteger(0)).toBe('workflow.validation.positiveInteger');
    });

    it('should return error for negative numbers', () => {
      expect(positiveInteger(-1)).toBe('workflow.validation.positiveInteger');
    });

    it('should return error for non-integers', () => {
      expect(positiveInteger(1.5)).toBe('workflow.validation.positiveInteger');
    });

    it('should return error for NaN', () => {
      expect(positiveInteger(NaN)).toBe('workflow.validation.positiveInteger');
    });

    it('should return true for empty values', () => {
      expect(positiveInteger(null)).toBe(true);
      expect(positiveInteger(undefined)).toBe(true);
      expect(positiveInteger('')).toBe(true);
    });

    it('should work with string numbers', () => {
      expect(positiveInteger('5')).toBe(true);
      expect(positiveInteger('0')).toBe('workflow.validation.positiveInteger');
    });
  });

  describe('nodeName', () => {
    it('should return true for valid names', () => {
      expect(nodeName('MyNode')).toBe(true);
      expect(nodeName('my_node')).toBe(true);
      expect(nodeName('my-node')).toBe(true);
      expect(nodeName('节点名称')).toBe(true);
      expect(nodeName('a')).toBe(true);
    });

    it('should return error for empty/null values', () => {
      expect(nodeName('')).toBe('workflow.validation.required');
      expect(nodeName(null)).toBe('workflow.validation.required');
      expect(nodeName(undefined)).toBe('workflow.validation.required');
    });

    it('should return error for names with special characters', () => {
      expect(nodeName('node@name')).toBe('workflow.validation.nodeName');
      expect(nodeName('node name')).toBe('workflow.validation.nodeName');
      expect(nodeName('node!name')).toBe('workflow.validation.nodeName');
    });

    it('should return error for names longer than 50 characters', () => {
      const longName = 'a'.repeat(51);
      expect(nodeName(longName)).toBe('workflow.validation.nodeNameLength');
    });
  });

  describe('createFieldValidation', () => {
    it('should create field validation with initial value', () => {
      const field = createFieldValidation('test');
      expect(field.value).toBe('test');
      expect(field.errors).toEqual([]);
      expect(field.warnings).toEqual([]);
      expect(field.touched).toBe(false);
    });

    it('should create field validation with null value', () => {
      const field = createFieldValidation(null);
      expect(field.value).toBeNull();
    });
  });

  describe('validateField', () => {
    const mockT = (key: string) => key;

    it('should return errors for failed validations', () => {
      const rules: ValidationRule[] = [{ validator: required }, { validator: minLength(3) }];
      const result = validateField('', rules, mockT);
      expect(result.errors).toContain('workflow.validation.required');
    });

    it('should return warnings for warning severity', () => {
      const rules: ValidationRule[] = [{ validator: minLength(10), severity: 'warning' }];
      const result = validateField('abc', rules, mockT);
      expect(result.warnings).toContain('workflow.validation.minLength');
      expect(result.errors).toEqual([]);
    });

    it('should return empty arrays for valid values', () => {
      const rules: ValidationRule[] = [{ validator: required }, { validator: minLength(3) }];
      const result = validateField('valid', rules, mockT);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    it('should handle multiple errors', () => {
      const rules: ValidationRule[] = [{ validator: minLength(5) }, { validator: maxLength(3) }];
      const result = validateField('abcd', rules, mockT);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('composeValidators', () => {
    it('should return true when all validators pass', () => {
      const composed = composeValidators(required, minLength(3), maxLength(10));
      expect(composed('test')).toBe(true);
    });

    it('should return first error encountered', () => {
      const composed = composeValidators(required, minLength(10));
      expect(composed('abc')).toBe('workflow.validation.minLength');
    });

    it('should stop at first failing validator', () => {
      const composed = composeValidators(
        required,
        minLength(10),
        maxLength(5), // This would also fail but shouldn't be checked
      );
      expect(composed('abc')).toBe('workflow.validation.minLength');
    });

    it('should work with single validator', () => {
      const composed = composeValidators(required);
      expect(composed('')).toBe('workflow.validation.required');
      expect(composed('test')).toBe(true);
    });

    it('should work with no validators', () => {
      const composed = composeValidators();
      expect(composed('')).toBe(true);
    });
  });
});
