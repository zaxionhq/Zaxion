import { z } from "zod";

export const githubCallbackQuery = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});
