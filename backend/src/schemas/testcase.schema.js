import { z } from "zod";

export const filesItem = z.object({
  path: z.string().min(1),
  language: z.string().optional(),
  content: z.string().optional(),
});

export const generateTestsBody = z.object({
  repo: z.union([z.string(), z.object({ owner: z.string(), repo: z.string() })]).optional().nullable(),
  files: z.array(z.string()).min(1),
});

export const generateSummariesBody = z.object({
  files: z.array(filesItem).min(1),
  repo: z.object({ owner: z.string(), repo: z.string() }).optional(),
});

export const generateCodeBody = z.object({
  summaryId: z.string().min(1),
  files: z.array(filesItem).min(1),
  framework: z.string().optional(),
});

export const createTestcaseBody = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  steps: z.array(z.any()).optional(),
  expectedResult: z.string().optional(),
});

export const updateTestcaseBody = createTestcaseBody.partial();

export const executeTestsBody = z.object({
  testCode: z.string().min(1),
  sourceCode: z.string().min(1),
  language: z.string().min(1),
  framework: z.string().min(1),
});
