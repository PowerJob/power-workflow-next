import {
  InputHTMLAttributes,
  Ref,
  SelectHTMLAttributes,
  forwardRef,
  useId,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';
import { WorkflowReferenceOption } from '@/types';

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
      noResultsText = '',
      showIdAndName = false,
      error,
      warning,
      className,
      onChange,
      onBlur,
      onFocus,
      disabled,
      ...props
    },
    ref,
  ) => {
    const listId = useId();
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const [searchInput, setSearchInput] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(-1);

    const selectedOption = options.find((o) => String(o.value) === String(value));
    const displayValue =
      showIdAndName && searchable
        ? searchInput !== null
          ? searchInput
          : selectedOption
            ? selectedOption.label
            : String(value ?? '')
        : value ?? '';

    const query = typeof displayValue === 'string' ? displayValue.trim().toLowerCase() : '';
    const filteredOptions = query
      ? options.filter(
          (o) =>
            String(o.value).toLowerCase().includes(query) ||
            (o.label && o.label.toLowerCase().includes(query)),
        )
      : options;

    useEffect(() => {
      if (showIdAndName && searchable) setSearchInput(null);
    }, [value, showIdAndName, searchable]);

    useEffect(() => {
      if (open) setHighlightIndex(-1);
    }, [open, query]);

    const closeDropdown = useCallback(() => setOpen(false), []);

    useEffect(() => {
      if (!open) return;
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          closeDropdown();
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open, closeDropdown]);

    const baseInputStyles =
      'w-full h-9 text-sm rounded-md border transition-all outline-none bg-white text-gray-700 placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed';
    const stateStyles = error
      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100'
      : warning
        ? 'border-amber-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-100'
        : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
    const inputClassName = clsx(
      baseInputStyles,
      stateStyles,
      searchable ? 'pl-3 pr-9' : 'px-3',
      showIdAndName && searchable && 'truncate',
      className,
    );

    const selectOption = useCallback(
      (option: WorkflowReferenceOption) => {
        const syntheticEvent = {
          target: { value: String(option.value) },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange?.(syntheticEvent);
        if (showIdAndName) setSearchInput(null);
        closeDropdown();
      },
      [onChange, showIdAndName, closeDropdown],
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
        setOpen(true);
      };
      const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        if (showIdAndName) setSearchInput(selectedOption?.label ?? '');
        setOpen(true);
        onFocus?.(e);
      };
      const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        if (showIdAndName) setSearchInput(null);
        onBlur?.(e);
        const relatedTarget = (e as React.FocusEvent<HTMLInputElement>).relatedTarget;
        if (containerRef.current?.contains(relatedTarget as Node)) return;
        setTimeout(closeDropdown, 150);
      };
      const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!open && e.key !== 'Escape') return;
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setHighlightIndex((i) =>
              i < filteredOptions.length - 1 ? i + 1 : i,
            );
            break;
          case 'ArrowUp':
            e.preventDefault();
            setHighlightIndex((i) => (i > 0 ? i - 1 : -1));
            break;
          case 'Enter':
            if (highlightIndex >= 0 && filteredOptions[highlightIndex]) {
              e.preventDefault();
              selectOption(filteredOptions[highlightIndex]);
            }
            break;
          case 'Escape':
            e.preventDefault();
            closeDropdown();
            setHighlightIndex(-1);
            break;
          default:
            break;
        }
      };

      useEffect(() => {
        if (highlightIndex < 0 || !listRef.current) return;
        const el = listRef.current.children[highlightIndex] as HTMLElement;
        el?.scrollIntoView({ block: 'nearest' });
      }, [highlightIndex]);

      return (
        <div ref={containerRef} className="relative w-full">
          <input
            ref={ref as Ref<HTMLInputElement>}
            value={displayValue}
            placeholder={searchPlaceholder ?? placeholder}
            title={typeof displayValue === 'string' && displayValue.length > 0 ? displayValue : undefined}
            className={inputClassName}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={
              highlightIndex >= 0 && filteredOptions[highlightIndex]
                ? `${listId}-option-${filteredOptions[highlightIndex].value}`
                : undefined
            }
            role="combobox"
            {...props}
          />
          <span
            className={clsx(
              'pointer-events-none absolute right-2 top-1/2 -translate-y-1/2',
              'text-gray-400 transition-colors',
              open && !error && !warning && 'text-blue-500',
            )}
            aria-hidden
          >
            <ChevronDown className="h-4 w-4" />
          </span>
          {open && !disabled && (
            <ul
              id={listId}
              ref={listRef}
              role="listbox"
              className={clsx(
                'absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg',
              )}
            >
              {filteredOptions.length === 0 ? (
                <li className="px-3 py-3 text-sm text-gray-400" role="status">
                  {noResultsText}
                </li>
              ) : (
                filteredOptions.map((option, index) => (
                  <li
                    key={String(option.value)}
                    id={`${listId}-option-${option.value}`}
                    role="option"
                    aria-selected={String(option.value) === String(value)}
                    className={clsx(
                      'cursor-pointer px-3 py-2 text-sm transition-colors',
                      index === highlightIndex
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50',
                      option.disabled && 'cursor-not-allowed opacity-50',
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (!option.disabled) selectOption(option);
                    }}
                  >
                    {option.label}
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      );
    }

    return (
      <select
        ref={ref as Ref<HTMLSelectElement>}
        value={value ?? ''}
        className={inputClassName}
        disabled={disabled}
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
