from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class UserBase(BaseModel):
    name: str
    email: EmailStr
    avatar: Optional[str] = None
    resumeScore: Optional[int] = 0
    resumeAnalysis: Optional[dict] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str = Field(alias="_id")

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class Question(BaseModel):
    id: str
    question: str
    idealAnswer: str
    tips: List[str]
    category: Optional[str] = None

class Answer(BaseModel):
    questionId: str
    question: str
    answer: str
    score: float
    feedback: str
    improvedAnswer: str
    strengths: List[str]
    weaknesses: List[str]
    improvementTips: List[str]
    answeredAt: datetime = Field(default_factory=datetime.now)

class InterviewBase(BaseModel):
    userId: str
    pdfText: str
    questions: List[Question]
    answers: List[Answer] = []
    status: str = "pending" # pending, completed
    scoreSummary: Optional[dict] = None

class InterviewCreate(InterviewBase):
    pass

class InterviewResponse(InterviewBase):
    id: str = Field(alias="_id")
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
