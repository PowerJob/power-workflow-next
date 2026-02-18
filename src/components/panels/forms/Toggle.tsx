import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ label, className, checked, disabled, ...props }, ref) => {
    return (
      <label
        className={clsx(
          'inline-flex items-center cursor-pointer',
          disabled && 'cursor-not-allowed opacity-50',
          className,
        )}
      >
        <div className="relative">
          <input
            ref={ref}
            type="checkbox"
            className="sr-only peer"
            checked={checked}
            disabled={disabled}
            {...props}
          />
          <div
            className={clsx(
              'w-10 h-6 rounded-full transition-colors',
              'bg-gray-200 peer-checked:bg-blue-500',
              'peer-focus:ring-2 peer-focus:ring-blue-100',
            )}
          />
          <div
            className={clsx(
              'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
              'peer-checked:translate-x-4',
            )}
          />
        </div>
        {label && <span className="ml-2 text-sm text-gray-700">{label}</span>}
      </label>
    );
  },
);

Toggle.displayName = 'Toggle';

export default Toggle;
