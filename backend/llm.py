import os
import asyncio
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
from dotenv import load_dotenv

load_dotenv()

# Phi-4 Mini Flash Reasoning (3.85B params)
PHI4_MODEL_NAME = "microsoft/Phi-4-mini-flash-reasoning"

_model = None
_tokenizer = None
_pipe = None

# rate limiting
_last_request_time = 0
MIN_REQUEST_INTERVAL = 0.2  

async def _initialize_model():
    """Initialize Phi-4 model once on first use"""
    global _model, _tokenizer, _pipe
    
    if _pipe is None:
        print("Loading Phi-4-mini-flash-reasoning model (3.85B params)...")
        try:
            _pipe = pipeline(
                "text-generation", 
                model=PHI4_MODEL_NAME, 
                trust_remote_code=True,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                device_map="auto" if torch.cuda.is_available() else "cpu"
            )
            print("Phi-4 model loaded successfully!")
        except Exception as e:
            print(f"Error loading Phi-4 model: {e}")
            _pipe = None

async def _rate_limit():
    """Simple rate limiting for local inference"""
    global _last_request_time
    current_time = asyncio.get_event_loop().time()
    time_since_last = current_time - _last_request_time
    
    if time_since_last < MIN_REQUEST_INTERVAL:
        await asyncio.sleep(MIN_REQUEST_INTERVAL - time_since_last)
    
    _last_request_time = asyncio.get_event_loop().time()

async def get_code_analysis(code: str, language: str, execution_time: float = 0) -> str:
    """
    Get code analysis using Phi-4-mini-flash-reasoning (3.85B params)
    """
    await _initialize_model()
    
    if _pipe is None:
        return "Phi-4 model failed to load. Please check if transformers and torch are installed."
    
    await _rate_limit()
    
    messages = [
        {
            "role": "user", 
            "content": f"""Analyze this {language} code for optimization:

```{language}
{code}
```

Execution time: {execution_time:.3f}s

You are an expert competitive programming mentor. Be brutally honest:

1. **IS THIS OPTIMIZED?** Answer YES or NO clearly
2. **TIME COMPLEXITY:** Current algorithm complexity 
3. **SPACE COMPLEXITY:** Current memory usage
4. **MAJOR ISSUE:** What's the main inefficiency? (if any)
5. **OPTIMIZATION:** What technique can improve it?
6. **OPTIMIZED CODE:** Show the better version

Focus especially on:
- Nested loops → Hash tables/sets (O(n²) → O(n))  
- Linear search → Binary search
- Redundant operations

Be direct - don't say inefficient code is "optimized"!"""
        }
    ]
    
    try:
        # inference
        result = await asyncio.get_event_loop().run_in_executor(
            None, 
            lambda: _pipe(messages, max_new_tokens=1000, do_sample=True, temperature=0.3)
        )
        
        if result and len(result) > 0:
            return result[0]['generated_text'][-1]['content'] 
        else:
            return "No response generated from Phi-4 model"
            
    except Exception as e:
        return f"Error during Phi-4 inference: {str(e)}"

async def analyze_with_llm(message: str, context: str = ""):
    """
    Stream analysis from Phi-4 for chat responses
    """
    await _initialize_model()
    
    if _pipe is None:
        yield "Phi-4 model failed to load. Please check if transformers and torch are installed."
        return
        
    await _rate_limit()
    
    messages = [
        {
            "role": "user",
            "content": f"""You are an expert programming mentor analyzing code submissions.

Context: {context}

User Question: {message}

Please provide helpful analysis covering:
- Code quality and best practices
- Time/space complexity
- Potential optimizations
- Alternative approaches
- Bug identification

Be constructive and educational in your feedback."""
        }
    ]
    
    try:
        #inference in executor to avoid blocking
        result = await asyncio.get_event_loop().run_in_executor(
            None, 
            lambda: _pipe(messages, max_new_tokens=1500, do_sample=True, temperature=0.3)
        )
        
        if result and len(result) > 0:
            response_text = result[0]['generated_text'][-1]['content']
            
            #streaming in chunks
            words = response_text.split()
            for i in range(0, len(words), 8): 
                chunk = " ".join(words[i:i+8]) + " "
                yield chunk
                await asyncio.sleep(0.1)  # Small delay for streaming effect
        else:
            yield "No response generated from Phi-4 model"
            
    except Exception as e:
        yield f"Error during Phi-4 inference: {str(e)}"
