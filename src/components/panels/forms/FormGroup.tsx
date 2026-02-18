import { ReactNode, LabelHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface FormGroupProps extends LabelHTMLAttributes<HTMLDivElement> {
  label: string;
  required?: boolean;
  error?: string;
  warning?: string;
  children: ReactNode;
}

export const FormGroup = ({
  label,
  required = false,
  error,
  warning,
  children,
  className,
  ...props
}: FormGroupProps) => {
  return (
    <div className={clsx('mb-4', className)} {...props}>
      <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {!error && warning && <p className="mt-1 text-xs text-amber-500">{warning}</p>}
    </div>
  );
};

export default FormGroup;
