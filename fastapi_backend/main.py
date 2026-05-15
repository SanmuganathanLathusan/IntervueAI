import os
from dotenv import load_dotenv
load_dotenv(override=True)
import shutil
import logging
from typing import List, Dict, Any
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from bson import ObjectId
from datetime import datetime
import uuid

from database import users_collection, interviews_collection
from models import UserCreate, UserResponse, InterviewCreate, InterviewResponse
from auth import get_password_hash, verify_password, create_access_token, get_current_user
from utils.ai import generate_questions_from_text, evaluate_answer, analyze_resume, chat_with_ai
from utils.pdf import extract_text_from_pdf

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="IntervueAI FastAPI")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "code": exc.status_code}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global error: {str(exc)}", exc_info=True)
    
    # Handle Gemini specific rate limits
    exc_str = str(exc).lower()
    if "429" in exc_str or "resource_exhausted" in exc_str or "quota" in exc_str:
        return JSONResponse(
            status_code=429,
            content={
                "error": "AI Quota exceeded. Please wait a moment and try again.",
                "code": 429,
                "retry_after": 60
            }
        )
        
    return JSONResponse(
        status_code=500,
        content={"error": "An unexpected server error occurred.", "code": 500}
    )

# Uploads directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "..", "uploads_data")

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "IntervueAI FastAPI is running"}

# --- Auth Routes ---
@app.post("/api/auth/register")
async def register(user_data: UserCreate):
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = user_data.dict()
    user_dict["password"] = get_password_hash(user_dict["password"])
    result = await users_collection.insert_one(user_dict)
    
    user_dict["id"] = user_dict["_id"] = str(result.inserted_id)
    del user_dict["password"]
    
    token = create_access_token(data={"userId": user_dict["id"], "email": user_dict["email"], "name": user_dict["name"]})
    return {"token": token, "user": user_dict}

@app.post("/api/auth/login")
async def login(credentials: dict = Body(...)):
    email = credentials.get("email")
    password = credentials.get("password")
    
    logger.info(f"Login attempt for email: {email}")
    user = await users_collection.find_one({"email": email})
    
    if not user:
        logger.warning(f"Login failed: User with email {email} not found")
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    if not verify_password(password, user["password"]):
        logger.warning(f"Login failed: Incorrect password for email {email}")
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    logger.info(f"Login successful for user: {email}")
    user["id"] = user["_id"] = str(user["_id"])
    del user["password"]
    
    token = create_access_token(data={"userId": user["id"], "email": user["email"], "name": user["name"]})
    return {"token": token, "user": user}

@app.put("/api/auth/profile")
async def update_profile(body: dict = Body(...), current_user: dict = Depends(get_current_user)):
    user_id = current_user["userId"]
    name = body.get("name")
    avatar = body.get("avatar")
    
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")
    
    update_data = {"name": name}
    if avatar:
        update_data["avatar"] = avatar
    
    await users_collection.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
    
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    user["id"] = user["_id"] = str(user["_id"])
    del user["password"]
    
    token = create_access_token(data={"userId": user["id"], "email": user["email"], "name": user["name"]})
    return {"message": "Profile updated successfully", "token": token, "user": user}

@app.put("/api/auth/resume-analysis")
async def update_resume_analysis(analysis: dict = Body(...), current_user: dict = Depends(get_current_user)):
    user_id = current_user["userId"]
    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {
            "resumeScore": analysis.get("score"),
            "resumeAnalysis": analysis
        }}
    )
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    user["id"] = user["_id"] = str(user["_id"])
    del user["password"]
    return {"user": user}

# --- Upload & AI Routes ---
@app.post("/api/upload-pdf")
async def upload_pdf(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}-{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    pdf_text = extract_text_from_pdf(file_path)
    if not pdf_text:
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")
    
    return {
        "message": "PDF uploaded successfully",
        "fileName": file.filename,
        "filePath": file_path,
        "pdfText": pdf_text
    }

@app.post("/api/analyze-resume")
async def analyze_resume_route(body: dict = Body(...), current_user: dict = Depends(get_current_user)):
    pdf_text = body.get("pdfText")
    if not pdf_text:
        raise HTTPException(status_code=400, detail="No PDF text provided")
    
    return await analyze_resume(pdf_text)

@app.post("/api/generate-questions")
async def generate_questions_route(body: dict = Body(...), current_user: dict = Depends(get_current_user)):
    pdf_text = body.get("pdfText")
    if not pdf_text:
        raise HTTPException(status_code=400, detail="No PDF text provided")
    
    result = await generate_questions_from_text(pdf_text)
    
    questions = []
    for cat in ["technicalQuestions", "hrQuestions", "scenarioQuestions"]:
        if cat in result:
            for q in result[cat]:
                q["id"] = str(uuid.uuid4())
                questions.append(q)
    
    return {"questions": questions}

@app.post("/api/start-interview")
async def start_interview(body: dict = Body(...), current_user: dict = Depends(get_current_user)):
    interview_data = {
        "userId": current_user["userId"],
        "pdfText": body.get("pdfText"),
        "questions": body.get("questions"),
        "answers": [],
        "status": "pending",
        "createdAt": datetime.now(),
        "updatedAt": datetime.now()
    }
    result = await interviews_collection.insert_one(interview_data)
    interview_data["_id"] = str(result.inserted_id)
    return {"interview": interview_data}

@app.post("/api/evaluate-answer")
async def evaluate_chat(body: dict = Body(...), current_user: dict = Depends(get_current_user)):
    question = body.get("question")
    answer = body.get("answer")
    context = body.get("context", "")
    interview_id = body.get("interviewId")
    
    if not question or not answer or not interview_id:
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    evaluation = await evaluate_answer(question, answer, context)
    
    answer_obj = {
        "questionId": body.get("questionId"),
        "question": question,
        "answer": answer,
        "score": evaluation.get("score", 0),
        "feedback": evaluation.get("feedback", ""),
        "improvedAnswer": evaluation.get("improvedAnswer", ""),
        "strengths": evaluation.get("strengths", []),
        "weaknesses": evaluation.get("weaknesses", []),
        "improvementTips": evaluation.get("improvementTips", []),
        "answeredAt": datetime.now()
    }
    
    await interviews_collection.update_one(
        {"_id": ObjectId(interview_id)},
        {"$push": {"answers": answer_obj}, "$set": {"updatedAt": datetime.now()}}
    )
    
    # Fetch the updated interview to calculate summary
    interview = await interviews_collection.find_one({"_id": ObjectId(interview_id)})
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
        
    all_scores = [a["score"] for a in interview.get("answers", [])]
    avg_score = (sum(all_scores) / len(all_scores)) if all_scores else 0
    
    score_summary = {
        "averageScore": avg_score,
        "totalQuestions": len(interview.get("questions", [])),
        "completedQuestions": len(all_scores)
    }
    
    await interviews_collection.update_one(
        {"_id": ObjectId(interview_id)},
        {"$set": {"scoreSummary": score_summary, "updatedAt": datetime.now()}}
    )
    
    interview = await interviews_collection.find_one({"_id": ObjectId(interview_id)})
    interview["_id"] = str(interview["_id"])
    interview["scores"] = all_scores
    interview["scoreSummary"] = score_summary
    
    return {"evaluation": answer_obj, "interview": interview}

@app.get("/api/report/{user_id}")
async def get_report(user_id: str, current_user: dict = Depends(get_current_user)):
    cursor = interviews_collection.find({"userId": user_id}).sort("createdAt", -1)
    interviews = await cursor.to_list(length=100)
    
    all_scores, all_strengths, all_weaknesses, all_tips = [], [], [], []
    
    for interview in interviews:
        interview["_id"] = str(interview["_id"])
        if "answers" in interview:
            for answer in interview["answers"]:
                all_scores.append(answer.get("score", 0))
                all_strengths.extend(answer.get("strengths", []))
                all_weaknesses.extend(answer.get("weaknesses", []))
                all_tips.extend(answer.get("improvementTips", []))
    
    avg_score = (sum(all_scores) / len(all_scores)) if all_scores else 0
    
    return {
        "userId": user_id,
        "totalInterviews": len(interviews),
        "totalScore": sum(all_scores),
        "averageScore": avg_score,
        "strengths": list(set(all_strengths))[:5],
        "weaknesses": list(set(all_weaknesses))[:5],
        "improvementTips": list(set(all_tips))[:3],
        "interviews": interviews
    }

@app.post("/api/chat")
async def public_chat(body: dict = Body(...)):
    messages = body.get("messages", [])
    if not messages:
        raise HTTPException(status_code=400, detail="No messages provided")
    
    return await chat_with_ai(messages)

