import { SelectHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { WorkflowReferenceOption } from '../../../types/workflow';

interface SelectInputProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'children' | 'value'> {
  options: WorkflowReferenceOption[];
  value?: string | number;
  placeholder?: string;
  error?: boolean;
  warning?: boolean;
}

export const SelectInput = forwardRef<HTMLSelectElement, SelectInputProps>(
  ({ options, value, placeholder, error, warning, className, ...props }, ref) => {
    return (
      <select
        ref={ref}
        value={value ?? ''}
        className={clsx(
          'w-full h-9 px-3 text-sm rounded-md border transition-all outline-none',
          'bg-white text-gray-700',
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100'
            : warning
              ? 'border-amber-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-100'
              : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100',
          'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
          className,
        )}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={String(option.value)} value={String(option.value)} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    );
  },
);

SelectInput.displayName = 'SelectInput';

export default SelectInput;
