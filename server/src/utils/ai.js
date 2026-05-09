const { randomUUID } = require('crypto');

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (!value) {
    return [];
  }
  return [value];
};

const extractKeywords = (text, limit = 12) => {
  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'that', 'from', 'this', 'your', 'have', 'will', 'are', 'was', 'were', 'their', 'about',
    'into', 'over', 'than', 'then', 'when', 'what', 'where', 'which', 'while', 'using', 'used', 'use', 'our', 'you', 'who',
    'can', 'not', 'but', 'may', 'had', 'has', 'had', 'been', 'his', 'her', 'they', 'them', 'its', 'our', 'out', 'any'
  ]);

  const counts = new Map();
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s#+.-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word && word.length > 2 && !stopWords.has(word))
    .forEach((word) => counts.set(word, (counts.get(word) || 0) + 1));

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
};

const stripCodeFence = (value) => {
  if (typeof value !== 'string') {
    return value;
  }

  return value
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
};

const safeJsonParse = (value) => {
  if (typeof value === 'object' && value !== null) {
    return value;
  }

  const cleaned = stripCodeFence(value);
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    }
    throw error;
  }
};

const fallbackQuestions = (pdfText) => {
  const keywords = extractKeywords(pdfText, 10);
  const focus = keywords[0] || 'the role';
  const technical = [
    `How would you explain your experience with ${focus} to a technical interviewer?`,
    `Which tools, frameworks, or workflows would you use to improve a project related to ${focus}?`,
    `Describe a difficult technical problem you solved when working with ${focus}.`,
    `How do you validate the quality and reliability of solutions in the ${focus} domain?`,
    `What trade-offs do you consider when designing a scalable implementation around ${focus}?`,
  ];
  const hr = [
    'Tell me about yourself and how your background fits this role.',
    'Why are you interested in this opportunity right now?',
    'Describe a time you worked with a difficult teammate or stakeholder.',
  ];
  const scenario = [
    `If you had one week to improve a project involving ${focus}, what would you prioritize first?`,
    `How would you respond if the interviewer challenged your approach to ${focus}?`,
  ];

  return {
    technicalQuestions: technical.map((question) => ({
      id: randomUUID(),
      category: 'technical',
      question,
      idealAnswer: `A strong answer should show practical experience, clear reasoning, and relevant examples tied to ${focus}.`,
      tips: ['Mention relevant tools', 'Use concrete examples', 'Explain trade-offs clearly'],
    })),
    hrQuestions: hr.map((question) => ({
      id: randomUUID(),
      category: 'hr',
      question,
      idealAnswer: 'A concise, confident answer with a real example and a positive outcome.',
      tips: ['Keep it structured', 'Stay specific', 'End with impact'],
    })),
    scenarioQuestions: scenario.map((question) => ({
      id: randomUUID(),
      category: 'scenario',
      question,
      idealAnswer: 'A practical answer that walks through priorities, risks, and next steps.',
      tips: ['Think aloud', 'Prioritize clearly', 'Show ownership'],
    })),
  };
};

const fallbackEvaluation = ({ question, answer, context }) => {
  const keywords = extractKeywords(`${question} ${context}`, 8);
  const normalizedAnswer = answer.toLowerCase();
  const matchedKeywords = keywords.filter((keyword) => normalizedAnswer.includes(keyword));
  const lengthScore = Math.min(4, Math.floor(answer.trim().split(/\s+/).length / 25));
  const relevanceScore = Math.min(4, matchedKeywords.length * 2);
  const structureScore = answer.includes('because') || answer.includes('for example') ? 2 : 1;
  const score = Math.min(10, Math.max(0, lengthScore + relevanceScore + structureScore));

  return {
    score,
    feedback: score >= 7
      ? 'Your answer is relevant, specific, and shows good command of the topic.'
      : 'Your answer is a useful start, but it needs more detail, structure, and role-specific evidence.',
    improvedAnswer: `A stronger answer would directly address ${keywords.slice(0, 3).join(', ') || 'the question'} and include a concrete example, the reasoning behind your choice, and the outcome.`,
    strengths: matchedKeywords.length ? matchedKeywords.map((keyword) => `Referenced ${keyword}`) : ['Responded to the prompt'],
    weaknesses: answer.trim().split(/\s+/).length < 40 ? ['Answer is too short'] : ['Could include more concrete examples'],
    improvementTips: ['Use the STAR format when relevant', 'Add one concrete example', 'Explain why your approach works'],
  };
};

const callOpenAI = async ({ prompt, model }) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: model || process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are an interview coach that returns valid JSON only.' },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`OpenAI request failed: ${message}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '{}';
  return safeJsonParse(content);
};

const callGemini = async ({ prompt, model }) => {
  const targetModel = model || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Gemini request failed: ${message}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.map((part) => part.text).join('') || '{}';
  return safeJsonParse(content);
};

const generateQuestionsFromText = async (pdfText) => {
  const prompt = `
Analyze the following PDF content and generate interview questions as strict JSON with this shape:
{
  "technicalQuestions": [{"question": string, "idealAnswer": string, "tips": [string]}],
  "hrQuestions": [{"question": string, "idealAnswer": string, "tips": [string]}],
  "scenarioQuestions": [{"question": string, "idealAnswer": string, "tips": [string]}]
}
Rules:
- Create exactly 5 technical questions, 3 HR questions, and 2 scenario-based questions.
- Make the questions specific to the content, skills, and role signals in the text.
- Keep answers concise but useful.
- Return JSON only.

PDF CONTENT:
${pdfText}
`;

  if (process.env.AI_PROVIDER === 'gemini' && process.env.GEMINI_API_KEY) {
    try {
      return await callGemini({ prompt });
    } catch (error) {
      console.error("Gemini failed in generateQuestionsFromText:", error);
      return fallbackQuestions(pdfText);
    }
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      return await callOpenAI({ prompt });
    } catch (error) {
      return fallbackQuestions(pdfText);
    }
  }

  return fallbackQuestions(pdfText);
};

const evaluateAnswer = async ({ question, answer, context }) => {
  const prompt = `
Evaluate the following interview answer and return strict JSON with this shape:
{
  "score": number,
  "feedback": string,
  "improvedAnswer": string,
  "strengths": [string],
  "weaknesses": [string],
  "improvementTips": [string]
}
Rules:
- Score must be between 0 and 10.
- Mention one or two strengths and weaknesses.
- Provide a realistic improved answer suggestion.
- Return JSON only.

QUESTION:
${question}

ANSWER:
${answer}

CONTEXT:
${context}
`;

  if (process.env.AI_PROVIDER === 'gemini' && process.env.GEMINI_API_KEY) {
    try {
      const result = await callGemini({ prompt });
      return {
        score: Number(result.score) || 0,
        feedback: result.feedback || 'No feedback returned.',
        improvedAnswer: result.improvedAnswer || '',
        strengths: toArray(result.strengths),
        weaknesses: toArray(result.weaknesses),
        improvementTips: toArray(result.improvementTips),
      };
    } catch (error) {
      return fallbackEvaluation({ question, answer, context });
    }
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      const result = await callOpenAI({ prompt });
      return {
        score: Number(result.score) || 0,
        feedback: result.feedback || 'No feedback returned.',
        improvedAnswer: result.improvedAnswer || '',
        strengths: toArray(result.strengths),
        weaknesses: toArray(result.weaknesses),
        improvementTips: toArray(result.improvementTips),
      };
    } catch (error) {
      return fallbackEvaluation({ question, answer, context });
    }
  }

  return fallbackEvaluation({ question, answer, context });
};

const normalizeQuestions = (questions) => {
  return questions.map((question) => ({
    id: question.id || randomUUID(),
    category: question.category || 'technical',
    question: question.question,
    idealAnswer: question.idealAnswer || '',
    tips: toArray(question.tips),
  }));
};

module.exports = {
  evaluateAnswer,
  generateQuestionsFromText,
  normalizeQuestions,
};
