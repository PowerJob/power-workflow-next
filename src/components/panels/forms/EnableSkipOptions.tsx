import { clsx } from 'clsx';
import { Toggle } from '.';
import { useLocale } from '../../../hooks/useLocale';

interface EnableSkipOptionsProps {
  enable: boolean;
  skip: boolean;
  onEnableChange: (enable: boolean) => void;
  onSkipChange: (skip: boolean) => void;
  className?: string;
}

/**
 * 运行策略区块：是否启用 + 失败跳过（仅启用时展示）。
 * @author Echo009
 */
export const EnableSkipOptions = ({
  enable,
  skip,
  onEnableChange,
  onSkipChange,
  className,
}: EnableSkipOptionsProps) => {
  const { t } = useLocale();

  return (
    <div className={clsx('mb-4', className)}>
      <p className="text-[13px] font-medium text-gray-700 mb-1.5">
        {t('workflow.panel.runStrategy')}
      </p>
      <div className="rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <span className="text-[13px] text-gray-700">
              {t('workflow.panel.enable')}
            </span>
            <Toggle
              checked={enable}
              onChange={(e) => onEnableChange(e.target.checked)}
            />
          </label>
          {enable && (
            <label className="inline-flex items-center gap-2 cursor-pointer transition-opacity duration-200">
              <span className="text-[13px] text-gray-700">
                {t('workflow.panel.skip')}
              </span>
              <Toggle
                checked={skip}
                onChange={(e) => onSkipChange(e.target.checked)}
              />
            </label>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnableSkipOptions;
