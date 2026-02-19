import { InputHTMLAttributes, Ref, SelectHTMLAttributes, forwardRef, useId } from 'react';
import { clsx } from 'clsx';
import { WorkflowReferenceOption } from '../../../types/workflow';

interface SelectInputProps
  extends Omit<
    SelectHTMLAttributes<HTMLSelectElement> & InputHTMLAttributes<HTMLInputElement>,
    'size' | 'children' | 'value'
  > {
  options: WorkflowReferenceOption[];
  value?: string | number;
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  noResultsText?: string;
  error?: boolean;
  warning?: boolean;
}

export const SelectInput = forwardRef<HTMLInputElement | HTMLSelectElement, SelectInputProps>(
  (
    {
      options,
      value,
      placeholder,
      searchable = false,
      searchPlaceholder,
      noResultsText: _noResultsText,
      error,
      warning,
      className,
      ...props
    },
    ref,
  ) => {
    const listId = useId();
    const inputClassName = clsx(
      'w-full h-9 px-3 text-sm rounded-md border transition-all outline-none',
      'bg-white text-gray-700 placeholder:text-gray-400',
      error
        ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100'
        : warning
          ? 'border-amber-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-100'
          : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100',
      'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
      className,
    );

    if (searchable) {
      return (
        <>
          <input
            ref={ref as Ref<HTMLInputElement>}
            list={listId}
            value={value ?? ''}
            placeholder={searchPlaceholder ?? placeholder}
            className={inputClassName}
            {...props}
          />
          <datalist id={listId}>
            {options.map((option) => (
              <option key={String(option.value)} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </datalist>
        </>
      );
    }

    return (
      <select
        ref={ref as Ref<HTMLSelectElement>}
        value={value ?? ''}
        className={inputClassName}
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
