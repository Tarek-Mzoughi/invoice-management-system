import React from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { Editor, useMonaco } from '@monaco-editor/react';

export interface CodeBlockProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  defaultLanguage: string;
  height: string;
}

const CodeBlock = React.forwardRef<HTMLTextAreaElement, CodeBlockProps>(
  ({ className, defaultLanguage, height, defaultValue, value, onChange, ...props }, ref) => {
    const { theme } = useTheme();
    const monaco = useMonaco();

    React.useEffect(() => {
      monaco?.languages.typescript.javascriptDefaults.setEagerModelSync(true);
    }, [monaco]);

    // Handle the onChange event expected by the Monaco Editor
    const handleEditorChange = (newValue: string | undefined) => {
      if (onChange) {
        const event = {
          target: {
            value: newValue ?? ''
          }
        } as React.ChangeEvent<HTMLTextAreaElement>;
        onChange(event);
      }
    };

    return (
      <Editor
        theme={theme === 'light' ? 'vs-light' : 'vs-dark'}
        className={cn(
          `relative flex w-full rounded pl-4 text-md overflow-auto border-2`,
          className
        )}
        value={value?.toString()}
        onChange={handleEditorChange}
        height={height}
        defaultLanguage={defaultLanguage}
        style={{
          width: '100%',
          fontFamily: 'ui-monospace, Menlo, monospace',
          fontWeight: 'bold',
          overflow: 'scroll'
        }}
        {...props}
      />
    );
  }
);

CodeBlock.displayName = 'CodeBlock';

export { CodeBlock };
