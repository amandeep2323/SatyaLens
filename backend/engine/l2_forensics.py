import cv2
import numpy as np
from scipy.signal import convolve2d
from scipy.ndimage import uniform_filter
from scipy.stats import kurtosis
from PIL import Image, ImageChops, ImageEnhance
import io
import base64

class ForensicsLayer:
    def __init__(self):
        self.layer_name = "L2_Forensics"
        self.weight = 0.30  # Increased weight: Physics don't lie.

    def analyze(self, image_path):
        score = 0
        flags = []
        debug_ela = None
        
        try:
            pil_img = Image.open(image_path).convert('RGB')
            cv_img = np.array(pil_img)[:, :, ::-1].copy() # BGR
            h, w, _ = cv_img.shape
            
            # --- CONTEXT DETECTION ---
            # 1. Resolution Check
            pixel_count = h * w
            is_high_res = pixel_count > (800 * 800) # ~0.6MP
            
            # 2. Noise Floor Check
            gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
            noise_var = np.var(gray - uniform_filter(gray, size=3))
            is_noisy = noise_var > 10.0 # ISO Grain or Webcam noise

            # --- CHECK 1: CFA (Bayer Pattern) - The "Optics" Check ---
            # DSLR/Drone/High-End Mobile MUST have this.
            # AI (Imagen/Midjourney) NEVER has this.
            # WhatsApp/Webcam might lose it due to compression.
            cfa_score = self._check_cfa_variance(cv_img)
            
            if cfa_score > 50:
                if is_high_res:
                    # If it's big and sharp but has no optics trace -> It's likely AI.
                    score += 80 
                    flags.append(f"Missing Camera Sensor Trace (High Confidence - {cfa_score}%)")
                elif not is_noisy:
                    # If it's small, smooth, and missing CFA -> Suspicious (could be AI or bad compression)
                    score += 40
                    flags.append(f"Missing Camera Sensor Trace (Low Confidence)")
                else:
                    # Small + Noisy (Webcam/WhatsApp) -> Ignore CFA (it's destroyed by noise)
                    pass

            # --- CHECK 2: Noise Statistics - The "Math" Check ---
            # AI noise is often mathematically "weird" (Non-Gaussian).
            # Real noise (DSLR/Drone/Webcam) is Poisson-Gaussian.
            stat_score, stat_flags = self._analyze_noise_distribution(cv_img, is_noisy)
            score += stat_score
            flags.extend(stat_flags)

            # --- CHECK 3: Block ELA - The "Edit" Check ---
            # Catches Photoshop splicing or In-painting.
            ela_score, ela_b64 = self._perform_block_ela(pil_img)
            score += ela_score
            debug_ela = ela_b64
            if ela_score > 40:
                flags.append(f"Inconsistent Compression Blocks (ELA Score: {ela_score}%)")

        except Exception as e:
            print(f"L2 Error: {e}")
            return {"layer_name": self.layer_name, "score": 0, "verdict": "Error", "flags": [], "ela_image": None}

        final_score = min(score, 100)
        
        return {
            "layer_name": self.layer_name,
            "score": int(final_score),
            "verdict": "Suspicious" if final_score > 50 else "Clean",
            "flags": flags,
            "ela_image": debug_ela
        }

    def _check_cfa_variance(self, img):
        """
        Universal CFA Check:
        Real sensors interpolate colors (Green is sampled 50%, Red/Blue 25%).
        AI generates RGB pixels independently.
        We check the statistical relationship between neighbors.
        """
        try:
            if img.shape[2] != 3: return 0
            green = img[:, :, 1].astype(np.float32)
            
            # Local variance
            kernel = np.ones((3, 3)) / 9.0
            local_mean = convolve2d(green, kernel, mode='same', boundary='symm')
            local_var = convolve2d((green - local_mean)**2, kernel, mode='same', boundary='symm')
            
            # Bayer Mask Simulation
            mask_s = np.zeros(green.shape, dtype=bool)
            mask_s[0::2, 0::2] = True # Top-Left
            mask_s[1::2, 1::2] = True # Bottom-Right
            
            var_s = np.mean(local_var[mask_s])
            var_i = np.mean(local_var[~mask_s])
            
            if var_i == 0: return 0
            
            ratio = var_s / var_i
            diff = abs(ratio - 1.0)
            
            # AI often has Perfect Ratio (1.0).
            # Real Cameras (even DSLR) have Imperfect Ratio (>1.0 or <1.0).
            if diff < 0.005: 
                return 95 # Artificial Perfection
            if diff < 0.01:
                return 50 # Suspiciously Clean
                
            return 0
        except:
            return 0

    def _analyze_noise_distribution(self, img, is_noisy):
        """
        Universal Noise Check:
        Distinguishes "Grainy Real" (Drone/Webcam) from "Grainy Fake" (Diffusion Noise).
        """
        score = 0
        flags = []
        try:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
            smoothed = uniform_filter(gray, size=3)
            noise = gray - smoothed
            
            noise_flat = noise.flatten()
            noise_kurt = kurtosis(noise_flat)
            noise_var = np.var(noise_flat)
            
            # Scenario A: Smooth Image (DSLR Sky / Mobile Skin / AI)
            if noise_var < 2.0:
                if abs(noise_kurt) > 1.0:
                    # Smooth + Weird Shape = AI (Synthetic Texture)
                    score += 50
                    flags.append(f"Synthetic Texture (High Kurtosis {noise_kurt:.2f})")
                else:
                    # Smooth + Normal Shape = Mobile/DSLR Denoising
                    pass

            # Scenario B: Noisy Image (Webcam / Night Shot / Diffusion Grain)
            else:
                # Real high-ISO noise is Gaussian (Kurtosis near 0).
                # Diffusion noise often has outliers (High Kurtosis).
                if abs(noise_kurt) > 2.5:
                    score += 40
                    flags.append(f"Unnatural Noise Pattern (Grain is non-Gaussian)")
            
            return score, flags
        except:
            return 0, []

    def _perform_block_ela(self, pil_img):
        """
        Universal ELA:
        Detects splicing/editing regardless of source.
        """
        try:
            original = pil_img.convert('RGB')
            buffer = io.BytesIO()
            original.save(buffer, 'JPEG', quality=90)
            buffer.seek(0)
            resaved = Image.open(buffer)
            
            diff = ImageChops.difference(original, resaved)
            
            # Visual Prep
            extrema = diff.getextrema()
            max_diff = max([ex[1] for ex in extrema])
            if max_diff == 0: max_diff = 1
            scale = 255.0 / max_diff
            visual_diff = ImageEnhance.Brightness(diff).enhance(scale)
            
            # Analysis
            diff_np = np.array(diff).astype(np.float32)
            diff_lum = np.mean(diff_np, axis=2)
            
            # Check 16x16 blocks
            block_vars = []
            h, w = diff_lum.shape
            for y in range(0, h, 16):
                for x in range(0, w, 16):
                    block = diff_lum[y:y+16, x:x+16]
                    if block.size > 0:
                        block_vars.append(np.mean(block))
            
            if not block_vars: return 0, None
            
            vars_np = np.array(block_vars)
            threshold = np.percentile(vars_np, 98) # Top 2%
            mean_error = np.mean(vars_np)
            
            score = 0
            # If the spikes are massive compared to the average noise
            if mean_error > 0.5 and threshold > (mean_error * 4.0):
                score = 50
                
            # Base64
            buffered_out = io.BytesIO()
            visual_diff.save(buffered_out, format="JPEG")
            img_str = base64.b64encode(buffered_out.getvalue()).decode("utf-8")
            
            return score, img_str
        except:
            return 0, None