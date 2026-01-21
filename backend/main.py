import uvicorn
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import sys

# --- PATH SETUP ---
# Ensure Python can find the 'engine' folder regardless of where you run the script from
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# --- IMPORTS ---
try:
    from engine.l0_bitstream import BitstreamAnalyzer
    from engine.l1_metadata import MetadataLayer
    from engine.l2_forensics import ForensicsLayer
    from engine.l3_frequency import FrequencyLayer
except ImportError:
    # Fallback for running from root directory
    from backend.engine.l0_bitstream import BitstreamAnalyzer
    from backend.engine.l1_metadata import MetadataLayer
    from backend.engine.l2_forensics import ForensicsLayer
    from backend.engine.l3_frequency import FrequencyLayer

app = FastAPI(title="SatyaLens Engine")

# Allow Frontend (React/Electron) to access this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- INITIALIZE LAYERS ---
print("--- SatyaLens Engine Starting ---")
print("Loading L0: Bitstream...")
l0_layer = BitstreamAnalyzer()
print("Loading L1: Metadata...")
l1_layer = MetadataLayer()
print("Loading L2: Forensics (Physics/Noise)...")
l2_layer = ForensicsLayer()
print("Loading L3: Frequency (Spectral/GAN)...")
l3_layer = FrequencyLayer()
print("--- All Layers Online ---")

@app.get("/health")
def health_check():
    return {"status": "Online", "layers_active": ["L0", "L1", "L2", "L3"]}

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    # 1. Save file locally to temp
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # 2. Run All Layers in Sequence
        # (In the future, we can run these in parallel using asyncio for speed)
        r0 = l0_layer.analyze(temp_path)
        r1 = l1_layer.analyze(temp_path)
        r2 = l2_layer.analyze(temp_path)
        r3 = l3_layer.analyze(temp_path)

        # 3. Cleanup (Delete temp file)
        if os.path.exists(temp_path):
            os.remove(temp_path)

        # 4. Calculate Weighted Average Score
        # We assign weights based on how "reliable" each layer is.
        # L0 (File): 10% - Useful but can be scrubbed.
        # L1 (Meta): 10% - Useful but easy to fake.
        # L2 (Phys): 25% - Hard to fake physics (Noise/CFA).
        # L3 (Freq): 25% - Very strong against GANs/Upscalers.
        # (L4 and L5 will take the remaining 30% later)
        
        w0, w1, w2, w3 = 0.10, 0.10, 0.25, 0.25
        total_weight_used = w0 + w1 + w2 + w3 # Currently 0.70
        
        raw_score = (
            (r0['score'] * w0) + 
            (r1['score'] * w1) + 
            (r2['score'] * w2) + 
            (r3['score'] * w3)
        )
        
        # Normalize to 0-100 scale based on used weights
        final_score = round(raw_score / total_weight_used, 1)

        # 5. Generate Human Verdict
        if final_score > 75: verdict = "Likely AI-Generated"
        elif final_score > 50: verdict = "Suspicious / Edited"
        elif final_score > 25: verdict = "Inconclusive / Mixed Signals"
        else: verdict = "Consistent with Real Camera"

        # 6. Return JSON
        return {
            "filename": file.filename,
            "final_score": final_score,
            "final_verdict": verdict,
            "layers": {
                "l0_bitstream": r0,
                "l1_metadata": r1,
                "l2_forensics": r2,
                "l3_frequency": r3
            }
        }

    except Exception as e:
        # Cleanup even if crash
        if os.path.exists(temp_path):
            os.remove(temp_path)
        print(f"Analysis Critical Failure: {e}")
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=4242)