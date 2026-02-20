import { useState, useEffect, useCallback } from 'react';
import { FormGroup, TextInput, Toggle, CodeEditor } from '.';
import { WorkflowNodeData } from '../../../types/workflow';
import { useLocale } from '../../../hooks/useLocale';
import { ValidationRule, nodeName, condition } from '../../../utils/validation';

interface DecisionNodeFormProps {
  data: WorkflowNodeData;
  onChange: (data: WorkflowNodeData) => void;
  onValidationChange: (errors: Record<string, string>, warnings: Record<string, string>) => void;
}

interface FormData {
  label: string;
  enable: boolean;
  condition: string;
}

const validationRules: Record<string, ValidationRule[]> = {
  label: [{ validator: nodeName }],
  condition: [{ validator: condition }],
};

export const DecisionNodeForm = ({ data, onChange, onValidationChange }: DecisionNodeFormProps) => {
  const { t } = useLocale();

  const [formData, setFormData] = useState<FormData>({
    label: data.label || '',
    enable: data.enable ?? true,
    condition: data.condition || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setFormData({
      label: data.label || '',
      enable: data.enable ?? true,
      condition: data.condition || '',
    });
  }, [data]);

  const validateField = useCallback(
    (field: string, value: unknown): { error?: string } => {
      const rules = validationRules[field];
      if (!rules) return {};

      for (const rule of rules) {
        const result = rule.validator(value);
        if (result !== true && result !== null) {
          return { error: t(result) };
        }
      }

      return {};
    },
    [t],
  );

  const handleChange = useCallback(
    (field: keyof FormData, value: unknown) => {
      const newFormData = { ...formData, [field]: value };
      setFormData(newFormData);

      const { error } = validateField(field, value);
      setErrors((prev) => {
        const next = { ...prev };
        if (error) next[field] = error;
        else delete next[field];
        return next;
      });

      onChange({
        ...data,
        label: newFormData.label,
        enable: newFormData.enable,
        condition: newFormData.condition,
      });
    },
    [formData, data, validateField, onChange],
  );

  const handleBlur = useCallback((field: keyof FormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  useEffect(() => {
    onValidationChange(errors, {});
  }, [errors, onValidationChange]);

  return (
    <div className="space-y-1">
      <FormGroup
        label={t('workflow.panel.name')}
        required
        error={touched.label ? errors.label : undefined}
      >
        <TextInput
          value={formData.label}
          onChange={(e) => handleChange('label', e.target.value)}
          onBlur={() => handleBlur('label')}
          placeholder={t('workflow.panel.name')}
          error={!!errors.label && touched.label}
        />
      </FormGroup>

      <FormGroup label={t('workflow.panel.enable')}>
        <Toggle
          checked={formData.enable}
          onChange={(e) => handleChange('enable', e.target.checked)}
        />
      </FormGroup>

      <FormGroup
        label={t('workflow.panel.condition')}
        required
        error={touched.condition ? errors.condition : undefined}
      >
        <CodeEditor
          value={formData.condition}
          onChange={(value) => handleChange('condition', value)}
          onBlur={() => handleBlur('condition')}
          placeholder={t('workflow.panel.conditionPlaceholder')}
          height={120}
          showLineNumbers={false}
          error={!!errors.condition && touched.condition}
        />
        <p className="mt-1 text-xs text-gray-400">{t('workflow.panel.conditionHint')}</p>
      </FormGroup>
    </div>
  );
};

export default DecisionNodeForm;
