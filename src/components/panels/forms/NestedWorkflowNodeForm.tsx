import { useState, useEffect, useCallback, useMemo } from 'react';
import { FormGroup, TextInput, SelectInput, Toggle, CodeEditor } from '.';
import { WorkflowNodeData, WorkflowReferenceOption } from '../../../types/workflow';
import { useLocale } from '../../../hooks/useLocale';
import { ValidationRule, nodeName, json } from '../../../utils/validation';

interface NestedWorkflowNodeFormProps {
  data: WorkflowNodeData;
  onChange: (data: WorkflowNodeData) => void;
  onValidationChange: (errors: Record<string, string>, warnings: Record<string, string>) => void;
  workflowOptions?: WorkflowReferenceOption[];
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
  params: [{ validator: json }],
};

export const NestedWorkflowNodeForm = ({
  data,
  onChange,
  onValidationChange,
  workflowOptions = [],
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
  const hasAvailableWorkflowOptions = workflowOptions.length > 0;
  const mergedWorkflowOptions = useMemo(() => {
    const optionMap = new Map<string, WorkflowReferenceOption>();
    for (const option of workflowOptions) {
      optionMap.set(String(option.value), option);
    }

    if (
      formData.targetWorkflowId !== '' &&
      formData.targetWorkflowId !== null &&
      formData.targetWorkflowId !== undefined &&
      !optionMap.has(String(formData.targetWorkflowId))
    ) {
      optionMap.set(String(formData.targetWorkflowId), {
        value: formData.targetWorkflowId,
        label: `${t('workflow.panel.legacyValue')}: ${formData.targetWorkflowId}`,
        disabled: true,
      });
    }

    return Array.from(optionMap.values());
  }, [formData.targetWorkflowId, workflowOptions, t]);

  const availableWorkflowValueSet = useMemo(
    () => new Set(mergedWorkflowOptions.map((option) => String(option.value))),
    [mergedWorkflowOptions],
  );

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
      if (!rules && field !== 'targetWorkflowId') return {};

      if (field === 'targetWorkflowId') {
        if (value === '' || value === null || value === undefined) {
          return { error: t('workflow.validation.required') };
        }
        if (!availableWorkflowValueSet.has(String(value))) {
          return { error: t('workflow.validation.optionNotFound') };
        }
        return {};
      }

      for (const rule of rules) {
        const result = rule.validator(value);
        if (result !== true && result !== null) {
          return { error: t(result) };
        }
      }

      return {};
    },
    [t, availableWorkflowValueSet],
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

  const handleWorkflowIdSelect = useCallback(
    (rawValue: string) => {
      if (!rawValue) {
        handleChange('targetWorkflowId', '');
        return;
      }
      const option = mergedWorkflowOptions.find((item) => String(item.value) === rawValue);
      handleChange('targetWorkflowId', option ? option.value : rawValue);
    },
    [handleChange, mergedWorkflowOptions],
  );

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
        <SelectInput
          value={formData.targetWorkflowId ?? ''}
          options={mergedWorkflowOptions}
          onChange={(e) => handleWorkflowIdSelect(e.target.value)}
          onBlur={() => handleBlur('targetWorkflowId')}
          placeholder={t('workflow.panel.selectPlaceholder')}
          searchable
          searchPlaceholder={t('workflow.panel.searchPlaceholder')}
          noResultsText={t('workflow.panel.searchNoResults')}
          disabled={!hasAvailableWorkflowOptions}
          error={!!errors.targetWorkflowId && touched.targetWorkflowId}
        />
        {!hasAvailableWorkflowOptions && (
          <p className="mt-1 text-xs text-gray-400">{t('workflow.panel.workflowOptionsEmpty')}</p>
        )}
        {hasAvailableWorkflowOptions &&
          formData.targetWorkflowId !== '' &&
          formData.targetWorkflowId !== null &&
          formData.targetWorkflowId !== undefined &&
          !workflowOptions.some(
            (option) => String(option.value) === String(formData.targetWorkflowId),
          ) && <p className="mt-1 text-xs text-amber-500">{t('workflow.panel.legacyValueHint')}</p>}
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
