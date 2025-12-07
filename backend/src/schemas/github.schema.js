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
