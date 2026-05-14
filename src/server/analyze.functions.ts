import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { runAtsAnalysis } from "@/lib/ai-analyze.server";

const InputSchema = z.object({
  resumeText: z.string().min(50).max(50000),
  jobDescription: z.string().min(20).max(20000),
});

export const analyzeResume = createServerFn({ method: "POST" })
  .inputValidator((data) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    return runAtsAnalysis(data.resumeText, data.jobDescription);
  });