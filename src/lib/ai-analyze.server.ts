// Server-only helper: runs the Gemini ATS analysis and returns the structured report.
export type AtsReport = {
  matchScore: number;
  atsCompatibility: number;
  verdict: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  strengths: string[];
  weaknesses: string[];
  improvements: { section: string; suggestion: string; priority: "high" | "medium" | "low" }[];
  rewrittenBullets: { original: string; improved: string }[];
  tailoredSummary: string;
  interviewQuestions: { question: string; sampleAnswer: string }[];
  skillGapPlan: { skill: string; whyItMatters: string; resource: string }[];
  redFlags: string[];
};

export async function runAtsAnalysis(resumeText: string, jobDescription: string): Promise<AtsReport> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  const systemPrompt = `You are an expert ATS (Applicant Tracking System) analyzer and career coach.
Analyze the resume against the job description with rigor. Be honest, specific, and actionable.
Return ONLY a JSON object via the tool call.`;
  const userPrompt = `RESUME:\n"""${resumeText}"""\n\nJOB DESCRIPTION:\n"""${jobDescription}"""`;

  const tool = {
    type: "function",
    function: {
      name: "ats_report",
      description: "Return the ATS analysis report.",
      parameters: {
        type: "object",
        properties: {
          matchScore: { type: "number" },
          atsCompatibility: { type: "number" },
          verdict: { type: "string" },
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
            items: {
              type: "object",
              properties: { original: { type: "string" }, improved: { type: "string" } },
              required: ["original", "improved"],
            },
          },
          tailoredSummary: { type: "string" },
          interviewQuestions: {
            type: "array",
            items: {
              type: "object",
              properties: { question: { type: "string" }, sampleAnswer: { type: "string" } },
              required: ["question", "sampleAnswer"],
            },
          },
          skillGapPlan: {
            type: "array",
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
          redFlags: { type: "array", items: { type: "string" } },
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
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
    const t = await res.text();
    console.error("AI gateway error", res.status, t);
    throw new Error("AI analysis failed.");
  }

  const json = await res.json();
  const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) throw new Error("No analysis returned");
  return JSON.parse(args) as AtsReport;
}