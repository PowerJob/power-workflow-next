import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  error?: boolean;
  warning?: boolean;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ error, warning, className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="number"
        className={clsx(
          'w-full h-9 px-3 text-sm rounded-md border transition-all outline-none',
          'bg-white text-gray-700 placeholder:text-gray-400',
          '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
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

NumberInput.displayName = 'NumberInput';

export default NumberInput;
