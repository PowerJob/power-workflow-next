import { useState, useEffect, useCallback, useMemo } from 'react';
import { FormGroup, TextInput, NumberInput, SelectInput, Toggle, CodeEditor } from '.';
import { WorkflowNodeData, WorkflowReferenceOption } from '../../../types/workflow';
import { useLocale } from '../../../hooks/useLocale';
import {
  ValidationRule,
  nodeName,
  range,
  json,
  Severity,
} from '../../../utils/validation';

interface JobNodeFormProps {
  data: WorkflowNodeData;
  onChange: (data: WorkflowNodeData) => void;
  onValidationChange: (errors: Record<string, string>, warnings: Record<string, string>) => void;
  jobOptions?: WorkflowReferenceOption[];
}

interface FormData {
  label: string;
  jobId: string | number;
  enable: boolean;
  skip: boolean;
  timeout: number;
  params: string;
}

const validationRules: Record<string, ValidationRule[]> = {
  label: [{ validator: nodeName }],
  timeout: [
    { validator: range(0, 3600) },
    {
      validator: (v: unknown) => (Number(v) > 300 ? 'workflow.validation.timeoutWarning' : true),
      severity: 'warning' as Severity,
    },
  ],
  params: [{ validator: json }],
};

export const JobNodeForm = ({ data, onChange, onValidationChange, jobOptions = [] }: JobNodeFormProps) => {
  const { t } = useLocale();

  const [formData, setFormData] = useState<FormData>({
    label: data.label || '',
    jobId: data.jobId ?? '',
    enable: data.enable ?? true,
    skip: data.skip ?? false,
    timeout: data.timeout ?? 0,
    params: data.params ?? '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const hasAvailableJobOptions = jobOptions.length > 0;
  const mergedJobOptions = useMemo(() => {
    const optionMap = new Map<string, WorkflowReferenceOption>();
    for (const option of jobOptions) {
      optionMap.set(String(option.value), option);
    }

    if (
      formData.jobId !== '' &&
      formData.jobId !== null &&
      formData.jobId !== undefined &&
      !optionMap.has(String(formData.jobId))
    ) {
      optionMap.set(String(formData.jobId), {
        value: formData.jobId,
        label: `${t('workflow.panel.legacyValue')}: ${formData.jobId}`,
        disabled: true,
      });
    }

    return Array.from(optionMap.values());
  }, [formData.jobId, jobOptions, t]);

  const availableJobValueSet = useMemo(
    () => new Set(mergedJobOptions.map((option) => String(option.value))),
    [mergedJobOptions],
  );

  useEffect(() => {
    setFormData({
      label: data.label || '',
      jobId: data.jobId ?? '',
      enable: data.enable ?? true,
      skip: data.skip ?? false,
      timeout: data.timeout ?? 0,
      params: data.params ?? '',
    });
  }, [data]);

  const validateField = useCallback(
    (field: string, value: unknown): { error?: string; warning?: string } => {
      const rules = validationRules[field];
      if (!rules && field !== 'jobId') return {};

      if (field === 'jobId') {
        if (value === '' || value === null || value === undefined) return {};
        if (!availableJobValueSet.has(String(value))) {
          return { error: t('workflow.validation.optionNotFound') };
        }
        return {};
      }

      let error: string | undefined;
      let warning: string | undefined;

      for (const rule of rules) {
        const result = rule.validator(value);
        if (result !== true && result !== null) {
          const message = t(result);
          if (rule.severity === 'warning') {
            warning = message;
          } else {
            error = message;
            break;
          }
        }
      }

      return { error, warning };
    },
    [t, availableJobValueSet],
  );

  const handleChange = useCallback(
    (field: keyof FormData, value: unknown) => {
      const newFormData = { ...formData, [field]: value };
      setFormData(newFormData);

      const { error, warning } = validateField(field, value);
      setErrors((prev) => {
        const next = { ...prev };
        if (error) next[field] = error;
        else delete next[field];
        return next;
      });
      setWarnings((prev) => {
        const next = { ...prev };
        if (warning) next[field] = warning;
        else delete next[field];
        return next;
      });

      onChange({
        ...data,
        label: newFormData.label,
        jobId: newFormData.jobId,
        enable: newFormData.enable,
        skip: newFormData.skip,
        timeout: newFormData.timeout,
        params: newFormData.params,
      });
    },
    [formData, data, validateField, onChange],
  );

  const handleBlur = useCallback((field: keyof FormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleJobIdSelect = useCallback(
    (rawValue: string) => {
      if (!rawValue) {
        handleChange('jobId', '');
        return;
      }
      const option = mergedJobOptions.find((item) => String(item.value) === rawValue);
      handleChange('jobId', option ? option.value : rawValue);
    },
    [handleChange, mergedJobOptions],
  );

  useEffect(() => {
    onValidationChange(errors, warnings);
  }, [errors, warnings, onValidationChange]);

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

      <FormGroup label={t('workflow.panel.jobId')} error={touched.jobId ? errors.jobId : undefined}>
        <SelectInput
          value={formData.jobId ?? ''}
          options={mergedJobOptions}
          onChange={(e) => handleJobIdSelect(e.target.value)}
          onBlur={() => handleBlur('jobId')}
          placeholder={t('workflow.panel.selectPlaceholder')}
          searchable
          searchPlaceholder={t('workflow.panel.searchPlaceholder')}
          noResultsText={t('workflow.panel.searchNoResults')}
          disabled={!hasAvailableJobOptions}
          error={!!errors.jobId && touched.jobId}
        />
        {!hasAvailableJobOptions && (
          <p className="mt-1 text-xs text-gray-400">{t('workflow.panel.jobOptionsEmpty')}</p>
        )}
        {hasAvailableJobOptions &&
          formData.jobId !== '' &&
          formData.jobId !== null &&
          formData.jobId !== undefined &&
          !jobOptions.some((option) => String(option.value) === String(formData.jobId)) && (
            <p className="mt-1 text-xs text-amber-500">{t('workflow.panel.legacyValueHint')}</p>
          )}
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
        label={t('workflow.panel.timeout')}
        error={touched.timeout ? errors.timeout : undefined}
        warning={touched.timeout && !errors.timeout ? warnings.timeout : undefined}
      >
        <NumberInput
          value={formData.timeout || ''}
          onChange={(e) => handleChange('timeout', e.target.value ? Number(e.target.value) : 0)}
          onBlur={() => handleBlur('timeout')}
          placeholder="60"
          min={0}
          max={3600}
          error={!!errors.timeout && touched.timeout}
          warning={!!warnings.timeout && touched.timeout && !errors.timeout}
        />
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

export default JobNodeForm;
