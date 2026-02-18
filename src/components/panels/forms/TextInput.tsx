import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  error?: boolean;
  warning?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ error, warning, className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="text"
        className={clsx(
          'w-full h-9 px-3 text-sm rounded-md border transition-all outline-none',
          'bg-white text-gray-700 placeholder:text-gray-400',
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100'
            : warning
              ? 'border-amber-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-100'
              : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100',
          'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
          className,
        )}
        {...props}
      />
    );
  },
);

TextInput.displayName = 'TextInput';

export default TextInput;
