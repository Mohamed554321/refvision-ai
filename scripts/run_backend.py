import os
import sys

# Ensure backend directory is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

if __name__ == "__main__":
    import uvicorn
    print("==================================================================")
    print(" RefVision AI — Officiating & Fan Intelligence Platform (2026)")
    print(" Microsoft Premier League Hackathon Edition")
    print("==================================================================")
    print(" Starting FastAPI server at http://127.0.0.1:8000 ...")
    print(" Interactive API Docs: http://127.0.0.1:8000/docs")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)
