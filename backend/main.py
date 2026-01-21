import uvicorn
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# --- IMPORTS ---
try:
    from engine.l0_bitstream import BitstreamAnalyzer
    from engine.l1_metadata import MetadataLayer
    from engine.l2_forensics import ForensicsLayer  # <--- NEW
except ImportError:
    from backend.engine.l0_bitstream import BitstreamAnalyzer
    from backend.engine.l1_metadata import MetadataLayer
    from backend.engine.l2_forensics import ForensicsLayer

app = FastAPI(title="SatyaLens Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- INITIALIZE LAYERS ---
l0_layer = BitstreamAnalyzer()
l1_layer = MetadataLayer()
l2_layer = ForensicsLayer()      # <--- NEW INIT

@app.get("/health")
def health_check():
    return {"status": "Online", "layers": ["L0", "L1", "L2"]}

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # --- RUN LAYERS ---
        r0 = l0_layer.analyze(temp_path)
        r1 = l1_layer.analyze(temp_path)
        r2 = l2_layer.analyze(temp_path) # <--- RUN L2

        # --- CLEANUP ---
        if os.path.exists(temp_path):
            os.remove(temp_path)

        # Simple Average Score
        avg_score = (r0['score'] + r1['score'] + r2['score']) / 3

        return {
            "filename": file.filename,
            "final_score": round(avg_score, 1),
            "final_verdict": "Suspicious" if avg_score > 40 else "Clean",
            "layers": {
                "l0_bitstream": r0,
                "l1_metadata": r1,
                "l2_forensics": r2 # <--- RETURN L2 DATA
            }
        }
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=4242)