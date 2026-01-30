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
  category: z.enum(['EMERGENCY_HOTFIX', 'FALSE_POSITIVE', 'LEGACY_CODE', 'BUSINESS_EXCEPTION']).default('BUSINESS_EXCEPTION'),
  ttl_hours: z.number().min(1).max(168).default(24), // Max 1 week
  role: z.string().optional(),
});
