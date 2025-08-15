from sqlalchemy import Column, Integer, String, Text, DateTime, Float
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    email = Column(String(100), unique=True, index=True)
    password_hash = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

class Submission(Base):
    __tablename__ = "submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    code = Column(Text)
    language = Column(String(20))
    output = Column(Text)
    error = Column(Text)
    execution_time = Column(Float)
    memory_used = Column(Float)
    test_cases = Column(Text)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)
