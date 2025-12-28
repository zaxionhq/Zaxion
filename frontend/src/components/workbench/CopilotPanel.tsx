import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Bot, User, Send, Sparkles, Loader2, Maximize2, X } from 'lucide-react';
import { api } from '@/lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface CopilotPanelProps {
  activeFile?: string;
  activeCode?: string;
  onStageChanges?: (code: string) => void;
}

export const CopilotPanel: React.FC<CopilotPanelProps> = ({ 
  activeFile, 
  activeCode,
  onStageChanges 
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I can help you generate tests or explain code. Select a file to get started.',
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'CHAT' | 'COMPOSER'>('CHAT');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Simulate API call or real one if endpoints exist
      // Here we mock the interaction for UI demo purposes as requested
      // In real implementation, this would call /generate-tests or similar
      
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `I see you're working on ${activeFile ? activeFile : 'a file'}. \n\nI can generate tests for this. Would you like me to proceed with creating a unit test suite?`,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, aiResponse]);
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#18181b] border-l border-[#2b2d31]">
      {/* Header Tabs */}
      <div className="flex items-center justify-between px-2 h-9 border-b border-[#2b2d31]">
        <div className="flex bg-[#27272a] rounded p-0.5">
          <button 
            onClick={() => setActiveTab('CHAT')}
            className={cn(
              "px-3 py-0.5 text-[11px] rounded font-medium transition-colors",
              activeTab === 'CHAT' ? "bg-[#3f3f46] text-white" : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            Chat
          </button>
          <button 
            onClick={() => setActiveTab('COMPOSER')}
            className={cn(
              "px-3 py-0.5 text-[11px] rounded font-medium transition-colors",
              activeTab === 'COMPOSER' ? "bg-[#3f3f46] text-white" : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            Composer
          </button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-white">
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={cn(
              "flex flex-col max-w-[90%]",
              msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
            )}
          >
            <div className={cn(
              "rounded-lg p-3 text-sm",
              msg.role === 'user' 
                ? "bg-[#27272a] text-zinc-100 border border-[#3f3f46]" 
                : "bg-transparent text-zinc-300"
            )}>
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-1 text-xs text-blue-400 font-bold uppercase tracking-wider">
                  <Sparkles className="h-3 w-3" /> AI Assistant
                </div>
              )}
              <div className="whitespace-pre-wrap leading-relaxed">
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-2 max-w-[80%]">
             <div className="flex items-center gap-2 mb-1 text-xs text-blue-400 font-bold uppercase tracking-wider">
                  <Sparkles className="h-3 w-3" /> Generating
             </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-[#2b2d31] bg-[#18181b]">
        <div className="relative rounded-lg border border-[#3f3f46] bg-[#27272a] focus-within:ring-1 focus-within:ring-blue-500/50 transition-all shadow-lg">
          {activeFile && (
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#3f3f46] bg-[#1f1f23] rounded-t-lg">
              <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 font-mono">
                @{activeFile.split('/').pop()}
              </span>
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything (Ctrl+L)..."
            className="w-full bg-transparent text-sm text-zinc-100 p-3 min-h-[80px] resize-none focus:outline-none placeholder:text-zinc-500 font-sans"
            disabled={isLoading}
          />
          <div className="flex justify-end p-2 border-t border-zinc-800/50">
             <Button 
              size="sm" 
              className="h-6 text-[11px] bg-blue-600 hover:bg-blue-500 text-white px-3"
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
            >
              {isLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              <span>Send</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
