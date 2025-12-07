import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AIButton } from '@/components/ui/ai-button';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Code, FileText, Zap, BookOpen } from 'lucide-react';

export interface TestSummary {
  id: string;
  fileName: string;
  filePath: string;
  language: string;
  summary: string;
  testTypes: string[];
  complexity: 'low' | 'medium' | 'high';
  estimatedTests: number;
}

interface TestSummaryCardProps {
  summary: TestSummary;
  onGenerateCode: (summary: TestSummary) => void;
  onExplainCode?: (summary: TestSummary) => void;
  loading?: boolean;
}

const getComplexityColor = (complexity: string) => {
  switch (complexity) {
    case 'low': return 'bg-success/10 text-success border-success/20';
    case 'medium': return 'bg-warning/10 text-warning border-warning/20';
    case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
    default: return 'bg-muted/10 text-muted-foreground border-muted/20';
  }
};

const getLanguageIcon = (language: string) => {
  switch (language.toLowerCase()) {
    case 'javascript':
    case 'typescript':
      return '🟨';
    case 'python':
      return '🐍';
    case 'java':
      return '☕';
    case 'react':
    case 'jsx':
    case 'tsx':
      return '⚛️';
    default:
      return '📄';
  }
};

export const TestSummaryCard: React.FC<TestSummaryCardProps> = ({
  summary,
  onGenerateCode,
  onExplainCode,
  loading = false
}) => {
  return (
    <Card className="w-full transition-smooth hover:shadow-elegant border-l-4 border-l-primary">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="text-xl">{getLanguageIcon(summary.language)}</span>
              {summary.fileName}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <FileText className="h-4 w-4" />
              {summary.filePath}
            </CardDescription>
          </div>
          <Badge 
            variant="outline" 
            className={`ml-2 ${getComplexityColor(summary.complexity)}`}
          >
            {summary.complexity} complexity
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Brain className="h-4 w-4" />
          <span>AI-Generated Test Strategy</span>
        </div>
        
        <p className="text-sm leading-relaxed">{summary.summary}</p>
        
        <div className="flex items-center gap-2 flex-wrap">
          {summary.testTypes.map((type, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {type}
            </Badge>
          ))}
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4" />
              ~{summary.estimatedTests} tests
            </div>
            <div className="flex items-center gap-1">
              <Code className="h-4 w-4" />
              {summary.language}
            </div>
          </div>
          
          <div className="flex gap-2">
            {onExplainCode && (
              <Button 
                variant="outline" 
                onClick={() => onExplainCode(summary)} 
                disabled={loading}
                className="gap-2"
              >
                <BookOpen className="h-4 w-4" />
                Explain
              </Button>
            )}
            <AIButton
              onClick={() => onGenerateCode(summary)}
              loading={loading}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Brain className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  Generate Tests
                </>
              )}
            </AIButton>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};