import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  resumeText: z.string().min(50).max(50000),
  jobDescription: z.string().min(20).max(20000),
});

export const analyzeResume = createServerFn({ method: "POST" })
  .inputValidator((data) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are an expert ATS (Applicant Tracking System) analyzer and career coach.
Analyze the resume against the job description with rigor. Be honest, specific, and actionable.
Return ONLY a JSON object via the tool call.`;

    const userPrompt = `RESUME:\n"""${data.resumeText}"""\n\nJOB DESCRIPTION:\n"""${data.jobDescription}"""`;

    const tool = {
      type: "function",
      function: {
        name: "ats_report",
        description: "Return the ATS analysis report.",
        parameters: {
          type: "object",
          properties: {
            matchScore: { type: "number", description: "0-100 overall match score" },
            atsCompatibility: { type: "number", description: "0-100 ATS parsability/format score" },
            verdict: { type: "string", description: "1-sentence summary verdict" },
            matchedKeywords: { type: "array", items: { type: "string" } },
            missingKeywords: { type: "array", items: { type: "string" } },
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
            improvements: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  section: { type: "string" },
                  suggestion: { type: "string" },
                  priority: { type: "string", enum: ["high", "medium", "low"] },
                },
                required: ["section", "suggestion", "priority"],
              },
            },
            rewrittenBullets: {
              type: "array",
              description: "Rewritten resume bullets tailored to the JD",
              items: {
                type: "object",
                properties: {
                  original: { type: "string" },
                  improved: { type: "string" },
                },
                required: ["original", "improved"],
              },
            },
            tailoredSummary: { type: "string", description: "A 3-4 sentence professional summary tailored to this JD" },
            interviewQuestions: {
              type: "array",
              description: "Likely interview questions with strong sample answers",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  sampleAnswer: { type: "string" },
                },
                required: ["question", "sampleAnswer"],
              },
            },
            skillGapPlan: {
              type: "array",
              description: "Skills to learn with quick learning path",
              items: {
                type: "object",
                properties: {
                  skill: { type: "string" },
                  whyItMatters: { type: "string" },
                  resource: { type: "string" },
                },
                required: ["skill", "whyItMatters", "resource"],
              },
            },
            redFlags: { type: "array", items: { type: "string" }, description: "Things recruiters may flag" },
          },
          required: [
            "matchScore", "atsCompatibility", "verdict", "matchedKeywords", "missingKeywords",
            "strengths", "weaknesses", "improvements", "rewrittenBullets", "tailoredSummary",
            "interviewQuestions", "skillGapPlan", "redFlags",
          ],
        },
      },
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "ats_report" } },
      }),
    });

    if (!res.ok) {
      if (res.status === 429) throw new Error("Rate limit exceeded. Please try again shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted. Please add credits in Settings → Workspace → Usage.");
      const t = await res.text();
      console.error("AI gateway error", res.status, t);
      throw new Error("AI analysis failed. Please try again.");
    }

    const json = await res.json();
    const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("No analysis returned");
    return JSON.parse(args);
  });