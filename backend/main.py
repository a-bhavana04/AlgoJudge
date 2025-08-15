"""
AlgoJudge Backend - Main FastAPI Application
Provides code analysis with AI feedback using CodeLlama 7B
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import bcrypt
import jwt
import datetime
import asyncio
import json
import os

from db.database import get_db, engine
from db import models, crud
from sandbox import run_in_docker
from llm import analyze_with_llm, get_code_analysis

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AlgoJudge API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
security = HTTPBearer()

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class CodeSubmission(BaseModel):
    code: str
    language: str
    test_cases: List[dict] = []

class ChatMessage(BaseModel):
    message: str
    submission_id: Optional[int] = None

# Helper Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: int, username: str) -> str:
    payload = {
        "user_id": user_id,
        "username": username,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def verify_jwt_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    payload = verify_jwt_token(credentials.credentials)
    user = crud.get_user_by_id(db, payload["user_id"])
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Routes
@app.get("/")
async def root():
    return {"message": "AlgoJudge API v1.0.0", "status": "running"}

@app.get("/healthz")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.datetime.utcnow()}

@app.post("/auth/register")
async def register(user_data: UserCreate, db: Session = Depends(get_db)):

    if crud.get_user_by_username(db, user_data.username):
        raise HTTPException(status_code=400, detail="Username already exists")
    if crud.get_user_by_email(db, user_data.email):
        raise HTTPException(status_code=400, detail="Email already exists")
    

    hashed_password = hash_password(user_data.password)
    user = crud.create_user(db, user_data.username, user_data.email, hashed_password)
    token = create_jwt_token(user.id, user.username)
    
    return {
        "message": "User registered successfully",
        "user": {"id": user.id, "username": user.username, "email": user.email},
        "token": token
    }

@app.post("/auth/login")
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, login_data.username)
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user.id, user.username)
    return {
        "message": "Login successful",
        "user": {"id": user.id, "username": user.username, "email": user.email},
        "token": token
    }

@app.post("/submit")
async def submit_code(
    submission: CodeSubmission,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # run code in sandbox
        sandbox_result = run_in_docker(submission.language, submission.code)

        execution_result = {
            "output": sandbox_result.get("output", ""),
            "error": sandbox_result.get("error", ""),
            "execution_time": sandbox_result.get("time", 0),
            "memory_used": 0.0  
        }


        db_submission = crud.create_submission(
            db=db,
            user_id=current_user.id,
            code=submission.code,
            language=submission.language,
            output=execution_result.get("output", ""),
            error=execution_result.get("error", ""),
            execution_time=execution_result.get("execution_time", 0),
            memory_used=execution_result.get("memory_used", 0),
            test_cases=json.dumps(submission.test_cases) if submission.test_cases else None
        )

        ai_analysis = None
        try:
            from backend.llm import get_code_analysis
            ai_analysis = await get_code_analysis(
                submission.code,
                submission.language,
                execution_result.get("execution_time", 0)
            )
        except Exception as e:
            ai_analysis = f"AI analysis failed: {str(e)}"

        return {
            "submission_id": db_submission.id,
            "execution_result": execution_result,
            "ai_analysis": ai_analysis,
            "message": "Code executed successfully"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Execution failed: {str(e)}")

@app.get("/dashboard")
async def get_dashboard(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    submissions = crud.get_user_submissions(db, current_user.id)
    return {
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email
        },
        "submissions": [
            {
                "id": sub.id,
                "language": sub.language,
                "created_at": sub.created_at,
                "execution_time": sub.execution_time,
                "memory_used": sub.memory_used,
                "has_error": bool(sub.error)
            }
            for sub in submissions
        ]
    }

@app.post("/chat")
async def chat_stream(
    chat_msg: ChatMessage,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Stream AI analysis responses"""
    
    async def generate_response():
        try:
            context = ""
            if chat_msg.submission_id:
                submission = crud.get_submission(db, chat_msg.submission_id)
                if submission and submission.user_id == current_user.id:
                    context = f"Code: {submission.code}\nLanguage: {submission.language}\nOutput: {submission.output}\nError: {submission.error}"
            
            async for chunk in analyze_with_llm(chat_msg.message, context):
                yield f"data: {json.dumps({'content': chunk})}\n\n"
            
            yield f"data: {json.dumps({'done': True})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(
        generate_response(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
