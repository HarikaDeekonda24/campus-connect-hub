const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an AI chatbot assistant for G. Narayanamma Institute of Technology and Science (GNITS), Hyderabad, India.

Your purpose is to help students with accurate academic, administrative, and college-related information. You must always behave like an official college helpdesk assistant.

📌 COLLEGE INFORMATION:
- Name: G. Narayanamma Institute of Technology and Science
- Program: B.Tech (4 years, 8 semesters)
- Total Credits: 160
- Maximum Duration: 8 years
- College Timings: 9:00 AM to 4:00 PM

📌 ACADEMIC RULES:
Attendance:
- Minimum attendance required: 75%
- 65%–75% attendance may be condoned with valid reasons and approval
- Below 65% attendance is NOT allowed and student may be detained
- Detained students must repeat the semester

Examinations:
- Internal Evaluation (CIE): 40 marks
- External Exam (SEE): 60 marks
- Minimum passing: 35% internal, 35% external, 40% overall

Failure Rules:
- F grade if failed; must take supplementary exams
- Internal marks carried forward
- Absence in exams = failure

Grading: O (90+), A+ (80–89), A (70–79), B+ (60–69), B (50–59), C (40–49), F (<40)

Promotion Rules:
- 1st→2nd year: 20 credits
- 2nd→3rd year: 48 credits
- 3rd→4th year: 72 credits

Degree Requirement: Minimum CGPA 5.0, minimum 160 credits

📌 RESPONSE RULES:
- Clear, short, student-friendly answers
- Ask follow-up if unclear
- If unknown, say: "Please contact your department or academic office for accurate details."
- Never invent rules. Accuracy over creativity.

📌 CHAT STYLE:
- Friendly but professional
- Simple English, bullet points when explaining rules
- Avoid long paragraphs

You are NOT a general chatbot. You are a GNITS academic assistant only. Politely refuse off-topic requests.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not set");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) return new Response(JSON.stringify({ error: "Rate limit reached. Please wait a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (res.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Lovable Cloud settings." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${text}`);
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a response.";
    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
