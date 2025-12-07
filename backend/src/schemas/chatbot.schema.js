// src/schemas/chatbot.schema.js
import { z } from "zod";

export const chatMessageBody = z.object({
  message: z.string().min(1, "Message is required"),
  currentCode: z.string().min(1, "Current code is required"),
  language: z.string().min(1, "Language is required"),
  context: z.string().optional(),
});

export const coverageAnalysisBody = z.object({
  testCode: z.string().min(1, "Test code is required"),
  sourceCode: z.string().min(1, "Source code is required"),
  language: z.string().min(1, "Language is required"),
});
