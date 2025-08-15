from sqlalchemy.orm import Session
from . import models
from .database import SessionLocal

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_id(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def create_user(db: Session, username: str, email: str, password_hash: str):
    db_user = models.User(username=username, email=email, password_hash=password_hash)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_submission(db: Session, user_id: int, code: str, language: str, output: str = "", 
                     error: str = "", execution_time: float = 0, memory_used: float = 0, test_cases: str = None):
    db_submission = models.Submission(
        user_id=user_id,
        code=code,
        language=language,
        output=output,
        error=error,
        execution_time=execution_time,
        memory_used=memory_used,
        test_cases=test_cases
    )
    db.add(db_submission)
    db.commit()
    db.refresh(db_submission)
    return db_submission

def get_submission(db: Session, submission_id: int):
    return db.query(models.Submission).filter(models.Submission.id == submission_id).first()

def get_user_submissions(db: Session, user_id: int):
    return db.query(models.Submission).filter(models.Submission.user_id == user_id).order_by(models.Submission.created_at.desc()).all()
