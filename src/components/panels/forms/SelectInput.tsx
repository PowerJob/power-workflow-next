import { InputHTMLAttributes, Ref, SelectHTMLAttributes, forwardRef, useId, useState, useEffect } from 'react';
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
  /** 为 true 时选中后显示「id + 名称」并超长截断（用于目标任务/目标工作流） */
  showIdAndName?: boolean;
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
      showIdAndName = false,
      error,
      warning,
      className,
      onChange,
      onBlur,
      onFocus,
      ...props
    },
    ref,
  ) => {
    const listId = useId();
    const [searchInput, setSearchInput] = useState<string | null>(null);

    const selectedOption = options.find((o) => String(o.value) === String(value));
    const displayValue =
      showIdAndName && searchable
        ? searchInput !== null
          ? searchInput
          : selectedOption
            ? selectedOption.label
            : String(value ?? '')
        : value ?? '';

    useEffect(() => {
      if (showIdAndName && searchable) setSearchInput(null);
    }, [value, showIdAndName, searchable]);

    const inputClassName = clsx(
      'w-full h-9 px-3 text-sm rounded-md border transition-all outline-none',
      'bg-white text-gray-700 placeholder:text-gray-400',
      showIdAndName && searchable && 'truncate',
      error
        ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100'
        : warning
          ? 'border-amber-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-100'
          : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100',
      'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
      className,
    );

    if (searchable) {
      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const next = e.target.value;
        const matched = options.find(
          (o) => String(o.value) === next || o.label === next,
        );
        if (matched !== undefined) {
          onChange?.(e);
          if (showIdAndName) setSearchInput(null);
        } else if (showIdAndName) {
          setSearchInput(next);
        } else {
          onChange?.(e);
        }
      };
      const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        if (showIdAndName) setSearchInput(selectedOption?.label ?? '');
        onFocus?.(e);
      };
      const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        if (showIdAndName) setSearchInput(null);
        onBlur?.(e);
      };

      return (
        <>
          <input
            ref={ref as Ref<HTMLInputElement>}
            list={listId}
            value={displayValue}
            placeholder={searchPlaceholder ?? placeholder}
            title={typeof displayValue === 'string' && displayValue.length > 0 ? displayValue : undefined}
            className={inputClassName}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
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
