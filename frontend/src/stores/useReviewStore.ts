import { create } from 'zustand';

interface ReviewState {
  sourceFile: string;
  sourceFilePath: string | undefined;
  testFile: string;
  isReviewing: boolean;
  testResults: Array<{ type: 'pass' | 'fail' | 'info', message: string }>;
  
  setSourceFile: (content: string, path?: string) => void;
  setTestFile: (content: string) => void;
  setIsReviewing: (isReviewing: boolean) => void;
  addTestResult: (result: { type: 'pass' | 'fail' | 'info', message: string }) => void;
  clearTestResults: () => void;
}

export const useReviewStore = create<ReviewState>((set) => ({
  sourceFile: '',
  sourceFilePath: undefined,
  testFile: '',
  isReviewing: false,
  testResults: [],

  setSourceFile: (content, path) => set({ sourceFile: content, sourceFilePath: path }),
  setTestFile: (content) => set({ testFile: content }),
  setIsReviewing: (isReviewing) => set({ isReviewing }),
  addTestResult: (result) => set((state) => ({ testResults: [...state.testResults, result] })),
  clearTestResults: () => set({ testResults: [] }),
}));
