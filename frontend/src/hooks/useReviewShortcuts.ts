import { useEffect, useRef } from 'react';
import { useReviewStore } from '../stores/useReviewStore';
import { useToast } from '@/hooks/use-toast';
import type { editor } from 'monaco-editor';

interface UseReviewShortcutsProps {
  editor: editor.IStandaloneCodeEditor | null; // Monaco editor instance
  runTests: () => void;
  stageForPR: () => void;
}

export const useReviewShortcuts = ({ editor, runTests, stageForPR }: UseReviewShortcutsProps) => {
  const { toast } = useToast();

  useEffect(() => {
    if (!editor) return;

    // Command + K: Focus AI Chat
    editor.addCommand(2048 | 41, () => { // KeyMod.CtrlCmd | KeyCode.KeyK
      // In a real implementation, this would focus the chat input
      // For now, we'll just show a toast or log
      console.log('Focusing AI Chat');
      // trigger event or focus element logic here
      document.getElementById('ai-chat-input')?.focus();
    });

    // Command + Enter: Verify (Run Tests)
    editor.addCommand(2048 | 3, () => { // KeyMod.CtrlCmd | KeyCode.Enter
      console.log('Running Tests');
      runTests();
    });

    // Command + S: Capture (Stage for PR)
    editor.addCommand(2048 | 49, () => { // KeyMod.CtrlCmd | KeyCode.KeyS
      console.log('Staging for PR');
      stageForPR();
    });

    // Note: Monaco's addCommand automatically handles preventing default for the editor scope.
    // However, for global browser defaults (like Ctrl+S saving the page), 
    // we might need a global listener if the editor doesn't catch it when not focused,
    // but usually Monaco captures these when focused.

  }, [editor, runTests, stageForPR]);
};
