import os
import shutil
from typing import List
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from bson import ObjectId
from datetime import datetime
import uuid

from database import users_collection, interviews_collection
from models import UserCreate, UserResponse, InterviewCreate, InterviewResponse
from auth import get_password_hash, verify_password, create_access_token, get_current_user
from utils.ai import generate_questions_from_text, evaluate_answer, analyze_resume
from utils.pdf import extract_text_from_pdf

app = FastAPI(title="IntervueAI FastAPI")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev, we can restrict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Uploads directory
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "IntervueAI FastAPI is running"}

# Auth Routes
@app.post("/api/auth/register")
async def register(user_data: UserCreate):
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = user_data.dict()
    user_dict["password"] = get_password_hash(user_dict["password"])
    result = await users_collection.insert_one(user_dict)
    
    user_dict["_id"] = str(result.inserted_id)
    del user_dict["password"]
    
    token = create_access_token(data={"userId": user_dict["_id"], "email": user_dict["email"], "name": user_dict["name"]})
    return {"token": token, "user": user_dict}

@app.post("/api/auth/login")
async def login(credentials: dict = Body(...)):
    email = credentials.get("email")
    password = credentials.get("password")
    
    user = await users_collection.find_one({"email": email})
    if not user or not verify_password(password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user["_id"] = str(user["_id"])
    del user["password"]
    
    token = create_access_token(data={"userId": user["_id"], "email": user["email"], "name": user["name"]})
    return {"token": token, "user": user}

@app.put("/api/auth/profile")
async def update_profile(body: dict = Body(...), current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user["userId"]
        name = body.get("name")
        avatar = body.get("avatar")
        
        if not name:
            raise HTTPException(status_code=400, detail="Name is required")
        
        # Prepare update data
        update_data = {"name": name}
        if avatar:
            update_data["avatar"] = avatar
        
        # Update user
        await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        # Fetch updated user
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        user["_id"] = str(user["_id"])
        del user["password"]
        
        # Generate new token with updated name
        token = create_access_token(data={"userId": user["_id"], "email": user["email"], "name": user["name"]})
        
        return {
            "message": "Profile updated successfully",
            "token": token,
            "user": user
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Profile update failed: {str(e)}")

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
    user["_id"] = str(user["_id"])
    del user["password"]
    return {"user": user}

# Upload Routes
@app.post("/api/upload-pdf")
async def upload_pdf(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    try:
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF upload failed: {str(e)}")

@app.post("/api/analyze-resume")
async def analyze_resume_route(body: dict = Body(...), current_user: dict = Depends(get_current_user)):
    try:
        pdf_text = body.get("pdfText")
        if not pdf_text:
            raise HTTPException(status_code=400, detail="No PDF text provided")
        
        analysis = await analyze_resume(pdf_text)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resume analysis failed: {str(e)}")

@app.post("/api/generate-questions")
async def generate_questions(body: dict = Body(...), current_user: dict = Depends(get_current_user)):
    try:
        pdf_text = body.get("pdfText")
        if not pdf_text:
            raise HTTPException(status_code=400, detail="No PDF text provided")
        
        result = await generate_questions_from_text(pdf_text)
        
        # Flatten questions into a single list for the frontend
        questions = []
        for cat in ["technicalQuestions", "hrQuestions", "scenarioQuestions"]:
            if cat in result:
                for q in result[cat]:
                    q["id"] = str(uuid.uuid4())
                    questions.append(q)
        
        return {"questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Question generation failed: {str(e)}")

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
    try:
        question = body.get("question")
        answer = body.get("answer")
        context = body.get("context", "")
        interview_id = body.get("interviewId")
        
        if not question or not answer or not interview_id:
            raise HTTPException(status_code=400, detail="Missing required fields: question, answer, or interviewId")
        
        evaluation = await evaluate_answer(question, answer, context)
        
        # Update interview in DB with the new answer
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
        
        # Fetch updated interview to return to frontend
        interview = await interviews_collection.find_one({"_id": ObjectId(interview_id)})
        interview["_id"] = str(interview["_id"])
        
        # Simple scores array for frontend
        interview["scores"] = [a["score"] for a in interview["answers"]]
        
        return {
            "evaluation": answer_obj,
            "interview": interview
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=f"Answer evaluation failed: {str(e)}")

@app.get("/api/report/{user_id}")
async def get_report(user_id: str, current_user: dict = Depends(get_current_user)):
    # Fetch all interviews for this user
    cursor = interviews_collection.find({"userId": user_id}).sort("createdAt", -1)
    interviews = await cursor.to_list(length=100)
    
    for interview in interviews:
        interview["_id"] = str(interview["_id"])
    
    # Calculate aggregated stats
    total_interviews = len(interviews)
    all_scores = []
    all_strengths = []
    all_weaknesses = []
    all_tips = []
    
    for interview in interviews:
        if "answers" in interview:
            for answer in interview["answers"]:
                if "score" in answer:
                    all_scores.append(answer["score"])
                if "strengths" in answer:
                    all_strengths.extend(answer["strengths"])
                if "weaknesses" in answer:
                    all_weaknesses.extend(answer["weaknesses"])
                if "improvementTips" in answer:
                    all_tips.extend(answer["improvementTips"])
    
    average_score = (sum(all_scores) / len(all_scores)) if all_scores else 0
    
    # Return properly formatted report
    return {
        "userId": user_id,
        "totalInterviews": total_interviews,
        "totalScore": sum(all_scores),
        "averageScore": average_score,
        "strengths": list(set(all_strengths))[:5],  # Top 5 unique
        "weaknesses": list(set(all_weaknesses))[:5],  # Top 5 unique
        "improvementTips": list(set(all_tips))[:3],  # Top 3 unique
        "interviews": interviews
    }

@app.post("/api/chat")
async def public_chat(body: dict = Body(...)):
    # Simple public chat fallback
    return {"message": "Public chat is currently simplified in FastAPI port"}

