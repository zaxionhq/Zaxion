import React from 'react';
import Editor from '@monaco-editor/react';
import { Card } from '@/components/ui/card';
import { Copy, Download, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface CodeViewerProps {
  code: string;
  language: string;
  filename?: string; // Made optional
  onClose?: () => void;
  editable?: boolean; // New prop for editability
  onCodeChange?: (newCode: string) => void; // New prop for handling code changes
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  code,
  language,
  filename = "generated-code.txt", // Default filename
  onClose,
  editable = false, // Default to not editable
  onCodeChange
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full max-w-6xl mx-auto overflow-hidden border-2 border-primary/20">
      <div className="bg-code-bg px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive"></div>
            <div className="w-3 h-3 rounded-full bg-warning"></div>
            <div className="w-3 h-3 rounded-full bg-success"></div>
          </div>
          <span className="text-sm font-mono text-muted-foreground">{filename}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <Download className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              ×
            </Button>
          )}
        </div>
      </div>
      <div className="h-96">
        <Editor
          height="100%"
          language={language}
          value={code}
          theme="vs-dark"
          onChange={onCodeChange} // Pass the new handler
          options={{
            readOnly: !editable, // Use the editable prop
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 16, bottom: 16 }
          }}
        />
      </div>
    </Card>
  );
};