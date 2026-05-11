import os
import json
import google.genai as genai
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

print(f"[DEBUG] GEMINI_MODEL loaded: {GEMINI_MODEL}")
print(f"[DEBUG] GEMINI_API_KEY loaded: {bool(GEMINI_API_KEY)}")

# Configure Gemini with API key
client = genai.Client(api_key=GEMINI_API_KEY)

async def call_gemini(prompt: str):
    print(f"[DEBUG] Calling Gemini with model: {GEMINI_MODEL}")
    
    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=genai.types.GenerateContentConfig(temperature=0.3)
        )
        print(f"[DEBUG] Gemini response text: {response.text[:200]}")
        return json.loads(response.text)
    except Exception as e:
        print(f"[DEBUG] Gemini call error: {str(e)}")
        raise

async def generate_questions_from_text(pdf_text: str):
    prompt = f"""
You are an expert FAANG Technical Interviewer. Your task is to generate HIGH-QUALITY, NON-REPETITIVE interview questions based on the candidate's CV content.

Analyze this CV content:
{pdf_text}

---
TASK: Generate exactly 5 unique questions following these strict requirements:

1. 2 PROJECT QUESTIONS: Deep-dive into specific projects mentioned. Ask about architecture, technical trade-offs, and difficult challenges.
2. 1 SKILL QUESTION: Technical probe into the specific tools or languages listed (e.g., React, Node, SQL).
3. 1 PROBLEM-SOLVING: Logic-based or architectural scenario related to their experience.
4. 1 BEHAVIORAL: Context-based teamwork or conflict question linked to their work history.

---
RULES:
- NO GENERIC QUESTIONS: Avoid "Tell me about yourself" or "What is X?"
- PERSONALIZATION: Mention specific project names, tools, and roles from the CV.
- TONE: Professional, specific, and challenging (FAANG style).
- STRUCTURE: Encourage thinking and problem-solving, not memorization.

---
OUTPUT: Return valid JSON only with this structure:
{{
  "technicalQuestions": [
    {{"question": string, "category": "Project", "idealAnswer": string, "tips": [string]}},
    {{"question": string, "category": "Project", "idealAnswer": string, "tips": [string]}},
    {{"question": string, "category": "Skill", "idealAnswer": string, "tips": [string]}}
  ],
  "hrQuestions": [
    {{"question": string, "category": "Behavioral", "idealAnswer": string, "tips": [string]}}
  ],
  "scenarioQuestions": [
    {{"question": string, "category": "Problem-Solving", "idealAnswer": string, "tips": [string]}}
  ]
}}
"""
    return await call_gemini(prompt)

async def evaluate_answer(question: str, answer: str, context: str = ""):
    prompt = f"""
Evaluate the candidate's answer for the following interview question.
Question: {question}
Candidate's Answer: {answer}
Context (CV Info): {context}

Provide a detailed evaluation as JSON:
{{
  "score": number (0-10),
  "feedback": string,
  "improvedAnswer": string,
  "strengths": [string],
  "weaknesses": [string],
  "improvementTips": [string]
}}
"""
    return await call_gemini(prompt)

async def analyze_resume(pdf_text: str):
    prompt = f"""
Analyze the following CV/Resume and provide a high-level candidate assessment as strict JSON:
{{
  "score": number,
  "summary": string,
  "skills": [string],
  "marketFit": string,
  "interviewStrategy": string
}}
Rules:
- Score is 0-100 based on resume quality and impact.
- summary is 2 sentences.
- marketFit describes how well they fit current top-tier industry standards.
- interviewStrategy suggests what a hiring manager should focus on.
- Return JSON only.

CV CONTENT:
{pdf_text}
"""
    return await call_gemini(prompt)
