import uvicorn
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import sys

# Ensure backend directory is in python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# --- IMPORTS ---
try:
    from engine.l0_bitstream import BitstreamAnalyzer
    from engine.l1_metadata import MetadataLayer
    from engine.l2_forensics import ForensicsLayer
    from engine.l3_frequency import FrequencyLayer
    from engine.l4_semantic import SemanticLayer
    from engine.l5_ai_model import AIModelLayer
except ImportError:
    # Fallback for running from root directory
    from backend.engine.l0_bitstream import BitstreamAnalyzer
    from backend.engine.l1_metadata import MetadataLayer
    from backend.engine.l2_forensics import ForensicsLayer
    from backend.engine.l3_frequency import FrequencyLayer
    from backend.engine.l4_semantic import SemanticLayer
    from backend.engine.l5_ai_model import AIModelLayer

app = FastAPI(title="SatyaLens Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- INITIALIZE LAYERS ---
print("--- SatyaLens Engine Starting ---")
l0 = BitstreamAnalyzer()
l1 = MetadataLayer()
l2 = ForensicsLayer()
l3 = FrequencyLayer()
l4 = SemanticLayer()
l5 = AIModelLayer()
print(f"--- All Layers Online. L5 Status: {'Ready' if l5.initialized else 'Offline (Model Missing)'} ---")

@app.get("/health")
def health_check():
    l5_status = "Online" if l5.initialized else "Offline (Model Missing)"
    return {
        "status": "Online", 
        "layers_active": ["L0", "L1", "L2", "L3", "L4", f"L5 ({l5_status})"]
    }

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # 1. Run All Layers
        r0 = l0.analyze(temp_path)
        r1 = l1.analyze(temp_path)
        r2 = l2.analyze(temp_path)
        r3 = l3.analyze(temp_path)
        r4 = l4.analyze(temp_path)
        r5 = l5.analyze(temp_path)

        # 2. Cleanup
        if os.path.exists(temp_path):
            os.remove(temp_path)

        # 3. Weighted Scoring Algorithm
        
        # Base Weights (Standard Mode)
        # L5 (AI) is usually the strongest (30%)
        w0, w1, w2, w3, w4, w5 = 0.10, 0.10, 0.20, 0.20, 0.20, 0.30

        # --- SMART WEIGHTING LOGIC ---
        
        if not l5.initialized:
            # Fallback: Model missing -> Trust Physics
            w5 = 0.00
            w2 += 0.10 
            w3 += 0.10 
            w4 += 0.10

        # REALITY CHECK: If L0 (File) and L1 (Meta) are 100% Clean...
        # It strongly suggests a real camera source. We dampen L5 to prevent false positives.
        elif r0['score'] == 0 and r1['score'] == 0:
            w5 = 0.15  # Reduce AI Authority (was 0.30)
            w2 = 0.25  # Boost Forensics
            w3 = 0.25  # Boost Frequency

        # Calculate Final Weighted Score
        total_w = w0 + w1 + w2 + w3 + w4 + w5
        
        raw_score = (
            (r0['score'] * w0) + 
            (r1['score'] * w1) + 
            (r2['score'] * w2) + 
            (r3['score'] * w3) +
            (r4['score'] * w4) +
            (r5['score'] * w5)
        )
        
        final_score = round(raw_score / total_w, 1)

        # 4. Verdict Thresholds (Calibrated for Real World)
        if final_score > 75: verdict = "Likely AI-Generated"
        elif final_score > 45: verdict = "Suspicious / Edited"
        elif final_score > 20: verdict = "Inconclusive / Mixed Signals"
        else: verdict = "Consistent with Real Camera"

        return {
            "filename": file.filename,
            "final_score": final_score,
            "final_verdict": verdict,
            "layers": {
                "l0_bitstream": r0,
                "l1_metadata": r1,
                "l2_forensics": r2,
                "l3_frequency": r3,
                "l4_semantic": r4,
                "l5_ai_model": r5
            }
        }

    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        print(f"Analysis Error: {e}")
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=4242)