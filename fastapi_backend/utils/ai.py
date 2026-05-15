import os
import json
import logging
import re
import google.genai as genai
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

load_dotenv(override=True)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-latest")

# Configure Gemini with API key
client = genai.Client(api_key=GEMINI_API_KEY)

def truncate_text(text: str, max_chars: int = 15000):
    """Limit the length of resume text to save tokens and avoid API limits."""
    if len(text) > max_chars:
        logger.info(f"Truncating text from {len(text)} to {max_chars} chars")
        return text[:max_chars] + "... [Truncated]"
    return text

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(Exception),
    reraise=True
)
async def call_gemini(prompt: str):
    logger.info(f"Calling Gemini with model: {GEMINI_MODEL}")
    
    try:
        # Use the async client (aio) for non-blocking calls
        response = await client.aio.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                temperature=0.3,
                response_mime_type="application/json" if "JSON" in prompt.upper() else None
            )
        )
        
        # In the new SDK, response.text is the aggregated text
        text = response.text
        if not text:
            logger.error(f"Empty response from Gemini. Candidates: {response.candidates}")
            raise ValueError("Empty response from AI")

        text = text.strip()
        
        # Robust JSON extraction
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            # Fallback to regex if simple cleaning fails
            json_match = re.search(r'\{.*\}', text, re.DOTALL)
            if json_match:
                try:
                    return json.loads(json_match.group(0))
                except:
                    pass
            
            # If it's a list
            json_match = re.search(r'\[.*\]', text, re.DOTALL)
            if json_match:
                try:
                    return json.loads(json_match.group(0))
                except:
                    pass
                    
            logger.error(f"Failed to parse Gemini response as JSON. Raw text: {text[:500]}")
            raise ValueError("Invalid JSON response from AI")
            
    except Exception as e:
        error_msg = str(e).lower()
        if "429" in error_msg or "quota" in error_msg or "resource_exhausted" in error_msg:
            logger.warning(f"Gemini Rate Limit hit. Retrying... Error: {error_msg}")
        else:
            logger.error(f"Gemini API error: {str(e)}")
        raise

async def generate_questions_from_text(pdf_text: str):
    truncated_text = truncate_text(pdf_text)
    prompt = f"""
You are an expert FAANG Technical Interviewer. Your task is to generate HIGH-QUALITY, NON-REPETITIVE interview questions based on the candidate's CV content.

Analyze this CV content:
{truncated_text}

---
TASK: Generate exactly 5 unique questions following these strict requirements:
1. 2 PROJECT QUESTIONS: Deep-dive into specific projects.
2. 1 SKILL QUESTION: Technical probe into tools/languages.
3. 1 PROBLEM-SOLVING: Logic/architectural scenario.
4. 1 BEHAVIORAL: Teamwork/conflict question.

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
    truncated_context = truncate_text(context, max_chars=5000)
    prompt = f"""
Evaluate the candidate's answer for this question.
Question: {question}
Answer: {answer}
Context: {truncated_context}

Return JSON:
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
    truncated_text = truncate_text(pdf_text)
    prompt = f"""
Analyze this CV and provide a high-level assessment as JSON:
{{
  "score": number,
  "summary": string,
  "skills": [string],
  "marketFit": string,
  "interviewStrategy": string
}}
CV CONTENT:
{truncated_text}
"""
    return await call_gemini(prompt)

async def chat_with_ai(messages: list):
    """Handle multi-turn chat with the IntervueAI Coach persona."""
    try:
        # Persona description
        system_instruction = "You are the IntervueAI Coach, an elite career mentor and interview expert. Provide professional, encouraging, and actionable advice. Use markdown for formatting (bolding, lists). Keep responses concise but insightful."
        
        # Convert messages to the format expected by the new SDK
        contents = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            contents.append(genai.types.Content(
                role=role,
                parts=[genai.types.Part(text=msg["content"])]
            ))
            
        # Call Gemini (simple text generation for chat)
        response = await client.aio.models.generate_content(
            model=GEMINI_MODEL,
            contents=contents,
            config=genai.types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.7
            )
        )
        
        if not response.text:
            logger.warning("Gemini chat response empty. Returning fallback.")
            return {"reply": "I'm sorry, I'm having trouble processing that right now. Could you please rephrase your question?"}
            
        return {"reply": response.text.strip()}
    except Exception as e:
        logger.error(f"Chat API error: {str(e)}", exc_info=True)
        return {"reply": "I apologize, but I encountered an error. Please try again in a moment."}
