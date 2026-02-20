import { useState, useEffect, TextareaHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface CodeEditorProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'value' | 'onChange'
> {
  value?: string;
  onChange?: (value: string) => void;
  error?: boolean;
  warning?: boolean;
  height?: number;
  /** 是否显示行号，默认 true */
  showLineNumbers?: boolean;
}

export const CodeEditor = forwardRef<HTMLTextAreaElement, CodeEditorProps>(
  (
    {
      value = '',
      onChange,
      error,
      warning,
      height = 200,
      className,
      placeholder,
      showLineNumbers = true,
      ...props
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = useState(value);

    useEffect(() => {
      setInternalValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setInternalValue(newValue);
      onChange?.(newValue);
    };

    return (
      <div className="relative">
        {showLineNumbers && (
          <div className="absolute top-0 left-0 w-8 h-full bg-gray-50 border-r border-gray-200 rounded-l-md overflow-hidden">
            <div className="py-2 px-1 text-right text-xs text-gray-400 font-mono leading-[20px] select-none">
              {internalValue.split('\n').map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
          </div>
        )}
        <textarea
          ref={ref}
          value={internalValue}
          onChange={handleChange}
          placeholder={placeholder || '{"key": "value"}'}
          className={clsx(
            'w-full text-sm font-mono rounded-md border transition-all outline-none resize-none',
            'py-2',
            showLineNumbers ? 'pl-10 pr-3' : 'px-3',
            'bg-white text-gray-700 placeholder:text-gray-400',
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100'
              : warning
                ? 'border-amber-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-100'
                : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100',
            'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
            className,
          )}
          style={{ height }}
          spellCheck={false}
          {...props}
        />
      </div>
    );
  },
);

CodeEditor.displayName = 'CodeEditor';

export const validateJson = (value: string): { valid: boolean; error?: string } => {
  if (!value.trim()) {
    return { valid: true };
  }
  try {
    JSON.parse(value);
    return { valid: true };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Invalid JSON';
    return { valid: false, error: errorMessage };
  }
};

export default CodeEditor;
