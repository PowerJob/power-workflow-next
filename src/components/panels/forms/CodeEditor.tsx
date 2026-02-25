import { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef, TextareaHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { AlignJustify, Minimize2 } from 'lucide-react';
import { useLocale } from '../../../hooks/useLocale';

interface CodeEditorProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'value' | 'onChange'
> {
  value?: string;
  onChange?: (value: string) => void;
  error?: boolean;
  warning?: boolean;
  /** 最小高度（px），内容超出时自动增高 */
  height?: number;
  /** 是否显示行号，默认 true */
  showLineNumbers?: boolean;
  /** 是否启用 JSON 编辑模式：工具栏格式化/压缩，失焦时自动压缩合法 JSON */
  jsonMode?: boolean;
}

function formatJson(value: string): string {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

function compressJson(value: string): string {
  try {
    return JSON.stringify(JSON.parse(value));
  } catch {
    return value;
  }
}

type JsonTokenType = 'key' | 'string' | 'number' | 'literal' | 'punctuation';

interface JsonToken {
  type: JsonTokenType;
  value: string;
}

function tokenizeJson(text: string): JsonToken[] {
  const tokens: JsonToken[] = [];
  let i = 0;
  const s = text;
  while (i < s.length) {
    if (/\s/.test(s[i])) {
      tokens.push({ type: 'punctuation', value: s[i] });
      i++;
      continue;
    }
    if (s[i] === '"') {
      let end = i + 1;
      while (end < s.length && (s[end] !== '"' || s[end - 1] === '\\')) end++;
      if (end < s.length) end++;
      const value = s.slice(i, end);
      let j = end;
      while (j < s.length && /\s/.test(s[j])) j++;
      const isKey = s[j] === ':';
      tokens.push({ type: isKey ? 'key' : 'string', value });
      i = end;
      continue;
    }
    if (/[-0-9]/.test(s[i])) {
      let end = i;
      if (s[end] === '-') end++;
      while (end < s.length && /\d/.test(s[end])) end++;
      if (s[end] === '.' && /\d/.test(s[end + 1])) {
        end++;
        while (end < s.length && /\d/.test(s[end])) end++;
      }
      if (/[eE]/.test(s[end])) {
        end++;
        if (/[+-]/.test(s[end])) end++;
        while (end < s.length && /\d/.test(s[end])) end++;
      }
      tokens.push({ type: 'number', value: s.slice(i, end) });
      i = end;
      continue;
    }
    if (s.slice(i, i + 4) === 'true' && !/[a-zA-Z0-9_]/.test(s[i + 4] ?? '')) {
      tokens.push({ type: 'literal', value: 'true' });
      i += 4;
      continue;
    }
    if (s.slice(i, i + 5) === 'false' && !/[a-zA-Z0-9_]/.test(s[i + 5] ?? '')) {
      tokens.push({ type: 'literal', value: 'false' });
      i += 5;
      continue;
    }
    if (s.slice(i, i + 4) === 'null' && !/[a-zA-Z0-9_]/.test(s[i + 4] ?? '')) {
      tokens.push({ type: 'literal', value: 'null' });
      i += 4;
      continue;
    }
    if ('{}[],:'.includes(s[i])) {
      tokens.push({ type: 'punctuation', value: s[i] });
      i++;
      continue;
    }
    tokens.push({ type: 'punctuation', value: s[i] });
    i++;
  }
  return tokens;
}

const JSON_HIGHLIGHT_CLASSES: Record<JsonTokenType, string> = {
  key: 'text-blue-600',
  string: 'text-emerald-600',
  number: 'text-amber-600',
  literal: 'text-purple-600',
  punctuation: 'text-gray-700',
};

export const CodeEditor = forwardRef<HTMLTextAreaElement, CodeEditorProps>(
  (
    {
      value = '',
      onChange,
      onBlur,
      error,
      warning,
      height = 200,
      className,
      placeholder,
      showLineNumbers = true,
      jsonMode = false,
      ...props
    },
    ref,
  ) => {
    const { t } = useLocale();
    const [internalValue, setInternalValue] = useState(value);
    const [contentHeight, setContentHeight] = useState(height);
    const highlightRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
      setInternalValue(value);
    }, [value]);

    useLayoutEffect(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.style.height = 'auto';
      setContentHeight(Math.max(height, el.scrollHeight));
    }, [internalValue, height]);

    const setRef = useCallback(
      (el: HTMLTextAreaElement | null) => {
        (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
        if (typeof ref === 'function') ref(el);
        else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
      },
      [ref],
    );

    const highlightedContent = useMemo(() => {
      if (!jsonMode) return null;
      const tokens = tokenizeJson(internalValue);
      return tokens.map((tok, i) => (
        <span key={i} className={JSON_HIGHLIGHT_CLASSES[tok.type]}>
          {tok.value}
        </span>
      ));
    }, [jsonMode, internalValue]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setInternalValue(newValue);
        onChange?.(newValue);
      },
      [onChange],
    );

    const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
      const el = e.currentTarget;
      if (highlightRef.current) {
        highlightRef.current.scrollTop = el.scrollTop;
        highlightRef.current.scrollLeft = el.scrollLeft;
      }
    }, []);

    const applyFormat = useCallback(() => {
      const result = validateJson(internalValue);
      if (!result.valid) return;
      const formatted = formatJson(internalValue);
      setInternalValue(formatted);
      onChange?.(formatted);
    }, [internalValue, onChange]);

    const applyCompress = useCallback(() => {
      const result = validateJson(internalValue);
      if (!result.valid) return;
      const compressed = compressJson(internalValue);
      setInternalValue(compressed);
      onChange?.(compressed);
    }, [internalValue, onChange]);

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLTextAreaElement>) => {
        if (jsonMode && internalValue.trim() !== '') {
          const result = validateJson(internalValue);
          if (result.valid) {
            const compressed = compressJson(internalValue);
            setInternalValue(compressed);
            onChange?.(compressed);
          }
        }
        onBlur?.(e);
      },
      [jsonMode, internalValue, onChange, onBlur],
    );

    const borderClass = error
      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100'
      : warning
        ? 'border-amber-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-100'
        : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

    const editorContent = (
      <>
        {showLineNumbers && (
          <div className="absolute top-0 left-0 w-8 h-full bg-gray-50 border-r border-gray-200 rounded-l-md overflow-hidden">
            <div className="py-2 px-1 text-right text-xs text-gray-400 font-mono leading-[20px] select-none">
              {internalValue.split('\n').map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
          </div>
        )}
        {jsonMode ? (
          <div
            className={clsx(
              'absolute top-0 bottom-0 overflow-auto',
              showLineNumbers ? 'left-8 right-0' : 'left-0 right-0',
            )}
            style={{ height: contentHeight }}
          >
            <div
              ref={highlightRef}
              className="absolute inset-0 overflow-auto z-0 bg-white"
              aria-hidden
            >
              <pre
                className={clsx(
                  'm-0 text-sm font-mono whitespace-pre-wrap break-words min-h-full bg-white',
                  'py-2 pr-3',
                  showLineNumbers ? 'pl-2' : 'pl-3',
                  'leading-[20px]',
                )}
              >
                {highlightedContent}
              </pre>
            </div>
            <textarea
              ref={setRef}
              value={internalValue}
              onChange={handleChange}
              onBlur={handleBlur}
              onScroll={handleScroll}
              placeholder={placeholder || '{"key": "value"}'}
              className={clsx(
                'absolute inset-0 w-full resize-none outline-none z-10',
                'text-sm font-mono py-2 pr-3',
                showLineNumbers ? 'pl-2' : 'pl-3',
                'leading-[20px]',
                'bg-transparent text-transparent caret-gray-700 placeholder:text-gray-400',
                'border-0 disabled:bg-transparent disabled:cursor-not-allowed',
                className,
              )}
              style={{ height: contentHeight }}
              spellCheck={false}
              {...props}
            />
          </div>
        ) : (
          <textarea
            ref={setRef}
            value={internalValue}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder || '{"key": "value"}'}
            className={clsx(
              'w-full text-sm font-mono transition-all outline-none resize-none',
              'py-2',
              showLineNumbers ? 'pl-10 pr-3' : 'px-3',
              'bg-white text-gray-700 placeholder:text-gray-400',
              'rounded-md border',
              borderClass,
              'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
              className,
            )}
            style={{ minHeight: height, height: contentHeight }}
            spellCheck={false}
            {...props}
          />
        )}
      </>
    );

    if (jsonMode) {
      return (
        <div
          className={clsx(
            'rounded-md border overflow-hidden',
            error ? 'border-red-500' : warning ? 'border-amber-500' : 'border-gray-200',
          )}
        >
          <TooltipPrimitive.Provider delayDuration={400}>
            <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
              <TooltipPrimitive.Root delayDuration={400}>
                <TooltipPrimitive.Trigger asChild>
                  <button
                    type="button"
                    onClick={applyFormat}
                    className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
                    aria-label={t('workflow.panel.jsonFormat')}
                  >
                    <AlignJustify size={16} />
                  </button>
                </TooltipPrimitive.Trigger>
                <TooltipPrimitive.Portal>
                  <TooltipPrimitive.Content
                    className="z-[100] px-2 py-1.5 text-xs bg-gray-800 text-white rounded shadow-lg"
                    sideOffset={4}
                    side="bottom"
                  >
                    {t('workflow.panel.jsonFormat')}
                  </TooltipPrimitive.Content>
                </TooltipPrimitive.Portal>
              </TooltipPrimitive.Root>
              <TooltipPrimitive.Root delayDuration={400}>
                <TooltipPrimitive.Trigger asChild>
                  <button
                    type="button"
                    onClick={applyCompress}
                    className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
                    aria-label={t('workflow.panel.jsonCompress')}
                  >
                    <Minimize2 size={16} />
                  </button>
                </TooltipPrimitive.Trigger>
                <TooltipPrimitive.Portal>
                  <TooltipPrimitive.Content
                    className="z-[100] px-2 py-1.5 text-xs bg-gray-800 text-white rounded shadow-lg"
                    sideOffset={4}
                    side="bottom"
                  >
                    {t('workflow.panel.jsonCompress')}
                  </TooltipPrimitive.Content>
                </TooltipPrimitive.Portal>
              </TooltipPrimitive.Root>
            </div>
          </TooltipPrimitive.Provider>
          <div className={clsx('relative', error ? 'focus-within:ring-2 focus-within:ring-red-100' : '')} style={{ height: contentHeight }}>
            {editorContent}
          </div>
        </div>
      );
    }

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
          onBlur={onBlur}
          placeholder={placeholder || '{"key": "value"}'}
          className={clsx(
            'w-full text-sm font-mono rounded-md border transition-all outline-none resize-none',
            'py-2',
            showLineNumbers ? 'pl-10 pr-3' : 'px-3',
            'bg-white text-gray-700 placeholder:text-gray-400',
            borderClass,
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
