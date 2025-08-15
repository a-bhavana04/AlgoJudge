import os
import tempfile
import docker
import shutil
import time
from dotenv import load_dotenv

load_dotenv()

# Configuration from environment
SANDBOX_TIMEOUT = int(os.getenv("SANDBOX_TIMEOUT", "30"))
SANDBOX_MEMORY_LIMIT = os.getenv("SANDBOX_MEMORY_LIMIT", "128m")

LANGUAGE_IMAGE = {
    "python": "python:3.11-slim",
    "cpp": "gcc:latest",
    "c": "gcc:latest",
    "java": "openjdk:latest",
    "javascript": "node:latest",
    "go": "golang:latest"
}

EXEC_COMMAND = {
    "python": ["python", "code.py"],
    "cpp": ["sh", "-c", "g++ code.cpp -o code && ./code"],
    "c": ["sh", "-c", "gcc code.c -o code && ./code"],
    "java": ["sh", "-c", "javac Code.java && java Code"],
    "javascript": ["node", "code.js"],
    "go": ["sh", "-c", "go run code.go"]
}

EXTENSIONS = {
    "python": ".py",
    "cpp": ".cpp",
    "c": ".c",
    "java": ".java",
    "javascript": ".js",
    "go": ".go"
}

MAX_EXECUTION_TIME = 10
MEMORY_LIMIT = "256m"

client = docker.from_env()

def run_in_docker(language, code):
    image = LANGUAGE_IMAGE.get(language)
    ext = EXTENSIONS.get(language)
    if not image or not ext:
        return {"error": "Unsupported language"}
    
    # For Python, we can run code directly with -c flag
    if language == "python":
        command = ["python", "-c", code]
    else:
        # For other languages, we still need file approach but will fix it
        command = EXEC_COMMAND.get(language)
        if not command:
            return {"error": "Unsupported language"}
    
    container = None
    try:
        start_time = time.time()
        
        if language == "python":
            # Run Python code directly without file system
            container = client.containers.run(
                image,
                command,
                network_disabled=True,
                mem_limit=SANDBOX_MEMORY_LIMIT,
                stderr=True,
                stdout=True,
                remove=False,
                detach=True
            )
        else:
            # For other languages, create temp dir (to be fixed later)
            tmpdir = tempfile.mkdtemp()
            code_path = os.path.join(tmpdir, f"code{ext}")
            
            with open(code_path, "w", encoding="utf-8") as f:
                f.write(code)
            
            volume_mapping = {os.path.abspath(tmpdir): {'bind': '/workspace', 'mode': 'rw'}}
            
            container = client.containers.run(
                image,
                command,
                volumes=volume_mapping,
                working_dir="/workspace",
                network_disabled=True,
                mem_limit=SANDBOX_MEMORY_LIMIT,
                stderr=True,
                stdout=True,
                remove=False,
                detach=True
            )
        result = container.wait(timeout=SANDBOX_TIMEOUT)
        logs = container.logs(stdout=True, stderr=True).decode()
        elapsed = time.time() - start_time
        return {"output": logs, "status": result, "time": elapsed}
    except Exception as e:
        return {"error": str(e)}
    finally:
        if container:
            try:
                container.remove(force=True)
            except Exception:
                pass
        # Only remove temp directory if it was created (for non-Python languages)
        if language != "python" and 'tmpdir' in locals():
            shutil.rmtree(tmpdir, ignore_errors=True)
