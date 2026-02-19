import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface ToolbarButtonProps {
  icon?: ReactNode;
  label?: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  title?: string;
  children?: ReactNode;
}

export const ToolbarButton = ({
  icon,
  label,
  onClick,
  disabled = false,
  active = false,
  title,
  children,
}: ToolbarButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={clsx(
        'inline-flex items-center justify-center gap-1 h-7 px-2 rounded-md text-sm transition-colors whitespace-nowrap',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        active ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100',
      )}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {label && <span>{label}</span>}
      {children}
    </button>
  );
};

interface ToolbarDividerProps {
  vertical?: boolean;
}

export const ToolbarDivider = ({ vertical = false }: ToolbarDividerProps) => {
  if (vertical) {
    return <div className="w-px h-5 bg-gray-200 mx-1" />;
  }
  return <div className="h-px w-full bg-gray-200 my-1" />;
};

interface ToolbarDropdownProps {
  icon?: ReactNode;
  label?: string;
  title?: string;
  disabled?: boolean;
  children: ReactNode;
}

export const ToolbarDropdown = ({
  icon,
  label,
  title,
  disabled = false,
  children,
}: ToolbarDropdownProps) => {
  return (
    <div className="relative group">
      <ToolbarButton icon={icon} label={label} title={title} disabled={disabled}>
        <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </ToolbarButton>
      {!disabled && (
        <div className="absolute top-full left-0 mt-1 py-1 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all min-w-[120px] z-50">
          {children}
        </div>
      )}
    </div>
  );
};

interface DropdownItemProps {
  icon?: ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const DropdownItem = ({ icon, label, onClick, disabled = false }: DropdownItemProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left transition-colors',
        disabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50',
      )}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {label}
    </button>
  );
};

export default ToolbarButton;
