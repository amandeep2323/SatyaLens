import cv2
import numpy as np
from scipy.signal import convolve2d
from scipy.ndimage import uniform_filter
from PIL import Image, ImageChops, ImageEnhance
import io
import base64

class ForensicsLayer:
    def __init__(self):
        self.layer_name = "L2_Forensics"
        self.weight = 0.20 

    def analyze(self, image_path):
        score = 0
        flags = []
        debug_ela = None
        
        try:
            # Load basic images
            pil_img = Image.open(image_path).convert('RGB')
            cv_img = cv2.imread(image_path)
            
            if cv_img is None:
                # Fallback for formats cv2 might miss
                cv_img = np.array(pil_img)[:, :, ::-1].copy() 

            # --- CHECK 1: CFA (Color Filter Array) Artifacts [FROM cfa_artifact.py] ---
            # Real cameras interpolate colors (demosaicing). AI generates them directly.
            # If the "Variance Ratio" is close to 1.0, it lacks the camera signature.
            cfa_score = self._check_cfa_artifacts(cv_img)
            if cfa_score > 0.6:
                score += 30
                flags.append(f"Missing Camera Sensor Pattern (CFA Score: {cfa_score:.2f})")

            # --- CHECK 2: Advanced Noise Consistency [FROM noise_consistency.py] ---
            # Checks if noise is Gaussian (Real) or too clean/structured (AI)
            noise_score, noise_flags = self._analyze_noise_statistics(cv_img)
            score += noise_score
            flags.extend(noise_flags)

            # --- CHECK 3: Multi-Quality ELA + Block Variance [FROM ela.py] ---
            ela_score, ela_b64 = self._perform_advanced_ela(pil_img)
            score += ela_score
            debug_ela = ela_b64
            if ela_score > 40:
                flags.append(f"High Compression Artifacts (ELA Score: {ela_score}%)")

        except Exception as e:
            print(f"L2 Forensic Error: {e}")
            return {"layer_name": self.layer_name, "score": 0, "verdict": "Error", "flags": [], "ela_image": None}

        # Cap score at 100
        final_score = min(score, 100)
        
        return {
            "layer_name": self.layer_name,
            "score": int(final_score),
            "verdict": "Suspicious" if final_score > 50 else "Clean",
            "flags": flags,
            "ela_image": debug_ela
        }

    def _check_cfa_artifacts(self, img):
        """
        Calculates the variance ratio between sampled and interpolated pixels.
        Real cameras have specific statistical differences between neighbor pixels.
        AI images often have a ratio ~ 1.0 (Perfectly smooth relationships).
        """
        try:
            # Analyze Green channel (usually carries the most structure)
            if img.shape[2] == 3:
                green = img[:, :, 1].astype(np.float32)
            else:
                return 0 # Skip if grayscale

            h, w = green.shape
            
            # Kernel to estimate local mean
            kernel = np.ones((3, 3)) / 9.0
            
            # Get local statistics
            local_mean = convolve2d(green, kernel, mode='same', boundary='symm')
            local_var = convolve2d((green - local_mean)**2, kernel, mode='same', boundary='symm')
            
            # Simple Bayer estimation: 
            # In RGGB, Green is at (0,1), (1,0), etc.
            # We compare variance at these "interpolated" spots vs "sampled" spots.
            
            # Create masks (Simplified for general Bayer)
            mask_a = np.zeros((h, w), dtype=bool)
            mask_a[0::2, 0::2] = True
            
            mask_b = np.zeros((h, w), dtype=bool)
            mask_b[0::2, 1::2] = True
            
            var_a = np.mean(local_var[mask_a])
            var_b = np.mean(local_var[mask_b])
            
            if var_b == 0: return 0
            
            ratio = var_a / var_b
            
            # If ratio is very close to 1.0, it means the pixel relationship 
            # is "too perfect" (AI generated or resized). 
            # Real cameras usually have a ratio != 1.0 due to interpolation.
            diff_from_one = abs(ratio - 1.0)
            
            # Score: High if close to 1.0 (Fake), Low if far (Real)
            # Threshold: < 0.05 diff is suspicious
            if diff_from_one < 0.05:
                return 0.8 # High probability of AI/Resizing
            
            return 0
        except Exception:
            return 0

    def _analyze_noise_statistics(self, img):
        """
        Extracts noise and checks its statistical distribution (Skewness/Kurtosis).
        """
        score = 0
        flags = []
        try:
            # Convert to grayscale for noise analysis
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
            
            # Extract noise (Original - Smoothed)
            smoothed = uniform_filter(gray, size=3)
            noise = gray - smoothed
            
            # 1. Variance Check (Plasticity)
            noise_var = np.var(noise)
            if noise_var < 2.0:
                score += 30
                flags.append("Surface texture is suspiciously smooth (Plastic/AI)")
            
            # 2. Kurtosis Check (Distribution Shape)
            # Real sensor noise is Gaussian. AI noise often has weird tails.
            noise_flat = noise.flatten()
            if len(noise_flat) > 0:
                mean_n = np.mean(noise_flat)
                std_n = np.std(noise_flat)
                if std_n > 0:
                    normalized = (noise_flat - mean_n) / std_n
                    # Fourth moment (Kurtosis)
                    kurtosis = np.mean(normalized ** 4) - 3.0
                    
                    if abs(kurtosis) > 1.0: # High deviation from Gaussian
                        score += 20
                        flags.append("Noise distribution is unnatural (Non-Gaussian)")

            return score, flags
        except:
            return 0, []

    def _perform_advanced_ela(self, pil_img):
        """
        Multi-quality ELA with Block-based analysis to reduce false positives.
        """
        try:
            original = pil_img.convert('RGB')
            best_diff = None
            max_score = 0
            
            # Check 90% and 95%
            for quality in [90, 95]:
                buffer = io.BytesIO()
                original.save(buffer, 'JPEG', quality=quality)
                buffer.seek(0)
                resaved = Image.open(buffer)
                
                diff = ImageChops.difference(original, resaved)
                extrema = diff.getextrema()
                max_diff = max([ex[1] for ex in extrema])
                if max_diff == 0: max_diff = 1
                scale = 255.0 / max_diff
                diff = ImageEnhance.Brightness(diff).enhance(scale)
                
                # --- BLOCK ANALYSIS (From ela.py) ---
                # Instead of just average brightness, we check for high-variance blocks
                # This highlights edited regions while ignoring general noise.
                diff_np = np.array(diff)
                
                # Split into 16x16 blocks
                h, w, _ = diff_np.shape
                block_vars = []
                for y in range(0, h-15, 16):
                    for x in range(0, w-15, 16):
                        block = diff_np[y:y+16, x:x+16]
                        block_vars.append(np.var(block))
                
                if not block_vars: continue
                
                # Calculate ratio of "high error" blocks
                threshold = np.percentile(block_vars, 95) # Top 5% of variance
                high_var_blocks = sum(1 for v in block_vars if v > threshold)
                
                # Heuristic score
                # If variance is spread evenly, score is low.
                # If variance is concentrated (edits), score is high.
                score = min(100, (np.mean(block_vars) / 10.0) * 100)
                
                if score > max_score:
                    max_score = score
                    best_diff = diff

            # Return image
            buffered_out = io.BytesIO()
            best_diff.save(buffered_out, format="JPEG")
            img_str = base64.b64encode(buffered_out.getvalue()).decode("utf-8")
            
            return int(max_score), img_str
            
        except Exception:
            return 0, None