import { useState, useEffect, useCallback } from 'react';
import { FormGroup, TextInput, NumberInput, Toggle, CodeEditor } from '.';
import { WorkflowNodeData } from '../../../types/workflow';
import { useLocale } from '../../../hooks/useLocale';
import { ValidationRule, nodeName, positiveInteger, json } from '../../../utils/validation';

interface NestedWorkflowNodeFormProps {
  data: WorkflowNodeData;
  onChange: (data: WorkflowNodeData) => void;
  onValidationChange: (errors: Record<string, string>, warnings: Record<string, string>) => void;
}

interface FormData {
  label: string;
  targetWorkflowId: string | number;
  enable: boolean;
  skip: boolean;
  params: string;
}

const validationRules: Record<string, ValidationRule[]> = {
  label: [{ validator: nodeName }],
  targetWorkflowId: [{ validator: positiveInteger }],
  params: [{ validator: json }],
};

export const NestedWorkflowNodeForm = ({
  data,
  onChange,
  onValidationChange,
}: NestedWorkflowNodeFormProps) => {
  const { t } = useLocale();

  const [formData, setFormData] = useState<FormData>({
    label: data.label || '',
    targetWorkflowId: data.targetWorkflowId ?? '',
    enable: data.enable ?? true,
    skip: data.skip ?? false,
    params: data.params ?? '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setFormData({
      label: data.label || '',
      targetWorkflowId: data.targetWorkflowId ?? '',
      enable: data.enable ?? true,
      skip: data.skip ?? false,
      params: data.params ?? '',
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
        targetWorkflowId: newFormData.targetWorkflowId,
        enable: newFormData.enable,
        skip: newFormData.skip,
        params: newFormData.params,
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

      <FormGroup
        label={t('workflow.panel.target')}
        required
        error={touched.targetWorkflowId ? errors.targetWorkflowId : undefined}
      >
        <NumberInput
          value={formData.targetWorkflowId || ''}
          onChange={(e) =>
            handleChange('targetWorkflowId', e.target.value ? Number(e.target.value) : '')
          }
          onBlur={() => handleBlur('targetWorkflowId')}
          placeholder="1001"
          min={1}
          error={!!errors.targetWorkflowId && touched.targetWorkflowId}
        />
      </FormGroup>

      <FormGroup label={t('workflow.panel.enable')}>
        <Toggle
          checked={formData.enable}
          onChange={(e) => handleChange('enable', e.target.checked)}
        />
      </FormGroup>

      <FormGroup label={t('workflow.panel.skip')}>
        <Toggle checked={formData.skip} onChange={(e) => handleChange('skip', e.target.checked)} />
      </FormGroup>

      <FormGroup
        label={t('workflow.panel.params')}
        error={touched.params ? errors.params : undefined}
      >
        <CodeEditor
          value={formData.params}
          onChange={(value) => handleChange('params', value)}
          onBlur={() => handleBlur('params')}
          placeholder='{"key": "value"}'
          height={150}
          error={!!errors.params && touched.params}
        />
      </FormGroup>
    </div>
  );
};

export default NestedWorkflowNodeForm;
