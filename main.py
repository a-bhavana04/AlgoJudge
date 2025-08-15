from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

@app.post("/submit/")
def submit(problem: str = Form(...), language: str = Form(...), file: UploadFile = File(...)):
    code = file.file.read().decode()
    return {"problem": problem, "language": language, "code": code}

@app.get("/")
def root():
    return {"status": "ok"}
