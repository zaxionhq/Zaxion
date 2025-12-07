import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, X, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyChanges?: (suggestedCode: string) => void;
  currentCode?: string;
  language?: string;
}

export const Chatbot: React.FC<ChatbotProps> = ({
  isOpen,
  onClose,
  onApplyChanges,
  currentCode,
  language = 'typescript'
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `Hi! I'm your AI testing assistant. I can help you improve your ${language} test cases. What would you like me to help you with?`,
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const [previewCode, setPreviewCode] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Handle mouse down for dragging (Windows-style - header only)
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow dragging from the header area, not from buttons
    if (headerRef.current && !(e.target as HTMLElement).closest('button')) {
      setIsDragging(true);
      const rect = headerRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  // Handle mouse move for dragging
  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Keep within viewport bounds
      const maxX = window.innerWidth - size.width;
      const maxY = window.innerHeight - size.height;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  // Handle mouse up for dragging and resizing
  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection('');
  };

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setDragOffset({
      x: e.clientX,
      y: e.clientY
    });
  };

  // Handle resize move
  const handleResizeMove = (e: MouseEvent) => {
    if (isResizing) {
      const deltaX = e.clientX - dragOffset.x;
      const deltaY = e.clientY - dragOffset.y;
      
      let newWidth = size.width;
      let newHeight = size.height;
      
      if (resizeDirection.includes('e')) newWidth += deltaX;
      if (resizeDirection.includes('w')) {
        newWidth -= deltaX;
        setPosition(prev => ({ ...prev, x: prev.x + deltaX }));
      }
      if (resizeDirection.includes('s')) newHeight += deltaY;
      if (resizeDirection.includes('n')) {
        newHeight -= deltaY;
        setPosition(prev => ({ ...prev, y: prev.y + deltaY }));
      }
      
      // Minimum size constraints
      newWidth = Math.max(600, newWidth);
      newHeight = Math.max(400, newHeight);
      
      setSize({ width: newWidth, height: newHeight });
      setDragOffset({ x: e.clientX, y: e.clientY });
    }
  };

  // Refs to keep track of latest handlers without triggering re-effects
  const handleMouseMoveRef = useRef(handleMouseMove);
  const handleResizeMoveRef = useRef(handleResizeMove);
  const handleMouseUpRef = useRef(handleMouseUp);

  useEffect(() => {
    handleMouseMoveRef.current = handleMouseMove;
    handleResizeMoveRef.current = handleResizeMove;
    handleMouseUpRef.current = handleMouseUp;
  });

  // Add/remove mouse event listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      const onMouseMove = (e: MouseEvent) => {
        if (isDragging) handleMouseMoveRef.current(e);
        else handleResizeMoveRef.current(e);
      };
      const onMouseUp = () => handleMouseUpRef.current();

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      return () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };
    }
  }, [isDragging, isResizing]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call the backend API
      const data = await api.post<{ message: string; suggestedCode?: string; recommendations?: string[] }>(
        '/v1/chatbot/chat',
        {
          message: inputValue,
          currentCode: currentCode || '',
          language: language,
          context: 'Test improvement'
        }
      );
      
      // Add AI response
      const aiMessage: Message = {
        id: Date.now().toString(),
        content: data.message,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      // If we have suggested code, show it as a separate message and update preview
      if (data.suggestedCode) {
        const codeMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `\`\`\`${language}\n${data.suggestedCode}\n\`\`\``,
          role: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, codeMessage]);
        
        // Update preview code for real-time changes
        setPreviewCode(data.suggestedCode);
      }

      // Add recommendations if available
      if (data.recommendations && data.recommendations.length > 0) {
        const recommendationsMessage: Message = {
          id: (Date.now() + 2).toString(),
          content: `**Recommendations:**\n${data.recommendations.map(rec => `• ${rec}`).join('\n')}`,
          role: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, recommendationsMessage]);
      }

    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleApplyChanges = () => {
    if (previewCode && onApplyChanges) {
      onApplyChanges(previewCode);
      onClose();
    }
  };

  const handlePreviewCodeChange = (newCode: string) => {
    setPreviewCode(newCode);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="chatbot-title"
    >
      <Card 
        className="flex flex-col shadow-2xl relative"
        style={{
          position: 'absolute',
          left: position.x,
          top: position.y,
          width: size.width,
          height: size.height,
          transform: 'none',
          cursor: isDragging ? 'grabbing' : 'default'
        }}
      >
        <CardHeader 
          ref={headerRef}
          className="flex-shrink-0 border-b cursor-move select-none"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center justify-between">
            <CardTitle id="chatbot-title" className="flex items-center gap-2">
              <Move className="h-4 w-4 text-muted-foreground" />
              <Bot className="h-5 w-5 text-primary" />
              AI Testing Assistant
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="cursor-pointer hover:bg-muted/50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{language}</Badge>
            <span>Drag header to move • Resize edges/corners • Ask me to improve your test cases!</span>
          </div>
        </CardHeader>

        {/* Resize Handles */}
        <div 
          className="absolute top-0 left-0 w-2 h-2 cursor-nw-resize bg-transparent hover:bg-primary/20"
          onMouseDown={(e) => handleResizeStart(e, 'nw')}
        />
        <div 
          className="absolute top-0 right-0 w-2 h-2 cursor-ne-resize bg-transparent hover:bg-primary/20"
          onMouseDown={(e) => handleResizeStart(e, 'ne')}
        />
        <div 
          className="absolute bottom-0 left-0 w-2 h-2 cursor-sw-resize bg-transparent hover:bg-primary/20"
          onMouseDown={(e) => handleResizeStart(e, 'sw')}
        />
        <div 
          className="absolute bottom-0 right-0 w-2 h-2 cursor-se-resize bg-transparent hover:bg-primary/20"
          onMouseDown={(e) => handleResizeStart(e, 'se')}
        />
        
        {/* Edge Resize Handles */}
        <div 
          className="absolute top-0 left-2 right-2 h-1 cursor-n-resize bg-transparent hover:bg-primary/20"
          onMouseDown={(e) => handleResizeStart(e, 'n')}
        />
        <div 
          className="absolute bottom-0 left-2 right-2 h-1 cursor-s-resize bg-transparent hover:bg-primary/20"
          onMouseDown={(e) => handleResizeStart(e, 's')}
        />
        <div 
          className="absolute left-0 top-2 bottom-2 w-1 cursor-w-resize bg-transparent hover:bg-primary/20"
          onMouseDown={(e) => handleResizeStart(e, 'w')}
        />
        <div 
          className="absolute right-0 top-2 bottom-2 w-1 cursor-e-resize bg-transparent hover:bg-primary/20"
          onMouseDown={(e) => handleResizeStart(e, 'e')}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Chat Section */}
          <div className="flex-1 flex flex-col border-r">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}

                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {message.content.includes('```') ? (
                        <pre className="whitespace-pre-wrap text-sm">
                          <code>{message.content}</code>
                        </pre>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                      <span className="text-xs opacity-70 mt-1 block">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>

                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <CardContent className="flex-shrink-0 border-t pt-4">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me to improve your test cases..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </div>

          {/* Preview Section */}
          <div className="w-1/2 flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-sm">Preview Changes</h3>
              <p className="text-xs text-muted-foreground">Real-time preview of suggested improvements</p>
            </div>
            
            <div className="flex-1 p-4">
              {previewCode ? (
                <div className="space-y-3">
                  <div className="bg-muted rounded-lg p-3">
                    <pre className="text-xs overflow-auto max-h-96">
                      <code>{previewCode}</code>
                    </pre>
                  </div>
                  <Button
                    onClick={handleApplyChanges}
                    size="sm"
                    className="w-full"
                  >
                    Apply These Changes
                  </Button>
                </div>
              ) : (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Ask the AI to suggest improvements</p>
                  <p>to see a preview here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
