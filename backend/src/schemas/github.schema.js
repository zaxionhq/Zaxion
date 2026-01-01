import { z } from "zod";

export const listRepoFilesQuery = z.object({
  path: z.string().optional(),
});

export const getRepoTreeQuery = z.object({
  branch: z.string().optional(),
});

export const createPrBody = z.object({
  branchName: z.string().optional(),
  title: z.string().optional(),
  body: z.string().optional(),
  files: z.array(z.object({ path: z.string(), content: z.string() })).optional(),
  baseBranch: z.string().optional(),
});

export const executeOverrideBody = z.object({
  reason: z.string().min(10, "Justification must be at least 10 characters long"),
  role: z.string().optional(), // In a real app, this would be verified against user sessions
});
