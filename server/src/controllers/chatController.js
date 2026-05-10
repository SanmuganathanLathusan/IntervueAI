const SYSTEM_PROMPT = `You are IntervueAI Coach — a friendly, expert interview coach and career advisor.
Your role is to help users:
- Prepare for job interviews (technical, HR, behavioural, case-based)
- Improve their answers using the STAR method
- Understand what interviewers look for
- Fix their resumes and cover letters
- Handle salary negotiation and offer evaluation
- Deal with interview anxiety and confidence
- Learn about specific roles, industries, and companies
- Practice coding interview concepts and system design

Keep your tone warm, professional, and encouraging. Give concrete, actionable advice.
Format responses clearly — use bullet points, numbered lists, and short paragraphs.
If the user asks something unrelated to careers or interviews, gently redirect them.`;

const callGeminiChat = async (messages) => {
  const targetModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  
  // Build Gemini-style contents array from message history
  const contents = messages.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini chat failed: ${err}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || 'I could not generate a response. Please try again.';
};

const callOpenAIChat = async (messages) => {
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI chat failed: ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'I could not generate a response. Please try again.';
};

const fallbackChat = (userMessage) => {
  const msg = userMessage.toLowerCase();
  
  if (msg.includes('star') || msg.includes('method') || msg.includes('behavioural') || msg.includes('behavioral')) {
    return `**The STAR Method** is the gold standard for behavioural interview answers:

- **S – Situation**: Set the scene. Briefly describe the context.
- **T – Task**: What was your responsibility or the challenge?
- **A – Action**: What specific steps did YOU take? (Most important!)
- **R – Result**: What was the outcome? Use numbers if possible.

**Example Question**: "Tell me about a time you handled a conflict at work."

**STAR Answer**: "At my previous job *(Situation)*, our team disagreed on a product launch timeline *(Task)*. I set up a structured meeting, presented data on user readiness, and proposed a phased rollout *(Action)*. We launched 2 weeks later with a 95% satisfaction rate *(Result)*."

Would you like to practice a specific behavioural question?`;
  }
  
  if (msg.includes('salary') || msg.includes('negotiate') || msg.includes('offer')) {
    return `**Salary Negotiation Tips:**

1. **Research first** — Use Glassdoor, LinkedIn Salary, and Levels.fyi to find market rates
2. **Let them go first** — Avoid naming a number unless pressed
3. **Use a range** — Say "Based on my research, I'm targeting ₹X–₹Y"
4. **Negotiate the whole package** — Consider equity, bonuses, remote work, PTO
5. **Don't rush** — It's OK to say "Can I have 48 hours to consider?"

**Key phrase to use**: *"I'm very excited about this role. Based on my experience and market research, I was hoping we could get closer to [X]. Is there flexibility there?"*

What's your specific situation — do you have an offer in hand?`;
  }

  if (msg.includes('resume') || msg.includes('cv')) {
    return `**Resume Best Practices:**

✅ **Keep it to 1 page** (2 pages if 10+ years experience)
✅ **Use action verbs**: Led, Built, Improved, Designed, Reduced
✅ **Quantify impact**: "Increased API response speed by 40%", "Managed team of 8"
✅ **Tailor to each job**: Mirror keywords from the job description
✅ **ATS-friendly format**: Simple layout, standard fonts, no tables/columns

❌ Avoid: Photos, personal info like age/marital status, generic objectives, "References available on request"

**Strong bullet example:**
> *"Architected a microservices migration that reduced system downtime by 65% and cut cloud costs by ₹12L annually"*

Would you like me to review specific bullet points?`;
  }

  return `I'm your **IntervueAI Coach** — here to help you ace interviews and advance your career! 🎯

I can help you with:
- 📝 **Interview prep** — practice questions, STAR method, mock answers
- 📄 **Resume & CV review** — tips, bullet rewrites, ATS optimization
- 💰 **Salary negotiation** — scripts and strategies
- 🧠 **Technical interviews** — DSA, system design, coding concepts
- 🏢 **Company research** — what to know before your interview
- 😌 **Confidence & anxiety** — mindset and preparation tips

What would you like to work on today?`;
};

const chat = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: 'Messages array is required' });
    }

    // Limit context to last 20 messages to avoid token overflow
    const recentMessages = messages.slice(-20);
    let reply;

    if (process.env.AI_PROVIDER === 'gemini' && process.env.GEMINI_API_KEY) {
      try {
        reply = await callGeminiChat(recentMessages);
      } catch (err) {
        console.error('Gemini chat error:', err.message);
        reply = fallbackChat(recentMessages[recentMessages.length - 1]?.content || '');
      }
    } else if (process.env.OPENAI_API_KEY) {
      try {
        reply = await callOpenAIChat(recentMessages);
      } catch (err) {
        console.error('OpenAI chat error:', err.message);
        reply = fallbackChat(recentMessages[recentMessages.length - 1]?.content || '');
      }
    } else {
      reply = fallbackChat(recentMessages[recentMessages.length - 1]?.content || '');
    }

    return res.json({ reply });
  } catch (error) {
    return res.status(500).json({ message: 'Chat failed', error: error.message });
  }
};

module.exports = { chat };
