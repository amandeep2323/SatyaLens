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
        self.weight = 0.20 

    def analyze(self, image_path):
        score = 0
        flags = []
        debug_ela = None
        details = {} 

        try:
            pil_img = Image.open(image_path).convert('RGB')
            cv_img = np.array(pil_img)[:, :, ::-1].copy() # BGR
            h, w, _ = cv_img.shape
            
            # --- CONTEXT DETECTION ---
            pixel_count = h * w
            is_high_res = pixel_count > (800 * 800)
            details['high_res_check'] = str(is_high_res)
            
            gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
            noise_var_raw = np.var(gray - uniform_filter(gray, size=3))
            is_noisy = noise_var_raw > 10.0
            details['base_noise_level'] = f"{noise_var_raw:.2f}"

            # --- CHECK 1: CFA (Bayer Pattern) ---
            cfa_score, cfa_ratio = self._check_cfa_variance(cv_img)
            details['cfa_ratio'] = f"{cfa_ratio:.5f}"

            if cfa_score > 50:
                if is_high_res:
                    score += 80 
                    flags.append(f"Missing Camera Sensor Trace (High Confidence - {cfa_score}%)")
                elif not is_noisy:
                    score += 40
                    flags.append(f"Missing Camera Sensor Trace (Low Confidence)")

            # --- CHECK 2: Noise Statistics ---
            stat_score, stat_flags, stat_details = self._analyze_noise_distribution(cv_img, is_noisy)
            score += stat_score
            flags.extend(stat_flags)
            details.update(stat_details)

            # --- CHECK 3: Block ELA ---
            ela_score, ela_b64, ela_val = self._perform_block_ela(pil_img)
            score += ela_score
            debug_ela = ela_b64
            details['ela_error_rate'] = f"{ela_val:.2f}"
            
            if ela_score > 40:
                flags.append(f"Inconsistent Compression Blocks (ELA Score: {ela_score}%)")

            # --- CHECK 4: Min/Max Deviation (Sherloq Style) ---
            # Detects anomalies in local dynamic range (Splicing/Blurring)
            mm_score, mm_val = self._check_min_max_deviation(gray)
            details['min_max_deviation'] = f"{mm_val:.4f}"
            
            if mm_score > 50:
                score += mm_score
                flags.append("Abnormal Local Dynamic Range (Min/Max Deviation)")

        except Exception as e:
            print(f"L2 Error: {e}")
            return {"layer_name": self.layer_name, "score": 0, "verdict": "Error", "flags": [], "ela_image": None, "details": {}}

        final_score = min(score, 100)
        
        return {
            "layer_name": self.layer_name,
            "score": int(final_score),
            "verdict": "Suspicious" if final_score > 50 else "Clean",
            "flags": flags,
            "ela_image": debug_ela,
            "details": details
        }


    def _check_cfa_variance(self, img):
        try:
            if img.shape[2] != 3: return 0, 0
            green = img[:, :, 1].astype(np.float32)
            
            # Standard CFA Variance Logic
            kernel = np.ones((3, 3)) / 9.0
            local_mean = convolve2d(green, kernel, mode='same', boundary='symm')
            local_var = convolve2d((green - local_mean)**2, kernel, mode='same', boundary='symm')
            
            mask_s = np.zeros(green.shape, dtype=bool)
            mask_s[0::2, 0::2] = True 
            mask_s[1::2, 1::2] = True
            var_s = np.mean(local_var[mask_s])
            var_i = np.mean(local_var[~mask_s])
            
            if var_i == 0: return 0, 0
            ratio = var_s / var_i
            diff = abs(ratio - 1.0)
            
            score = 0
            # --- FIX IS HERE ---
            # Use 'elif' to prevent overwriting the higher score
            if diff < 0.005: 
                score = 95
            elif diff < 0.01: 
                score = 50
                
            return score, ratio
        except:
            return 0, 0

    def _analyze_noise_distribution(self, img, is_noisy):
        score = 0
        flags = []
        stats = {}
        try:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
            smoothed = uniform_filter(gray, size=3)
            noise = gray - smoothed
            noise_flat = noise.flatten()
            noise_kurt = kurtosis(noise_flat)
            noise_var = np.var(noise_flat)
            
            stats['noise_var'] = f"{noise_var:.4f}"
            stats['noise_kurtosis'] = f"{noise_kurt:.4f}"
            
            if noise_var < 2.0:
                if abs(noise_kurt) > 1.0:
                    score += 50
                    flags.append(f"Synthetic Texture (High Kurtosis {noise_kurt:.2f})")
            else:
                if abs(noise_kurt) > 2.5:
                    score += 40
                    flags.append(f"Unnatural Noise Pattern (Grain is non-Gaussian)")
            return score, flags, stats
        except:
            return 0, [], {}

    def _perform_block_ela(self, pil_img):
        try:
            original = pil_img.convert('RGB')
            buffer = io.BytesIO()
            original.save(buffer, 'JPEG', quality=90)
            buffer.seek(0)
            resaved = Image.open(buffer)
            diff = ImageChops.difference(original, resaved)
            
            extrema = diff.getextrema()
            max_diff = max([ex[1] for ex in extrema])
            if max_diff == 0: max_diff = 1
            scale = 255.0 / max_diff
            visual_diff = ImageEnhance.Brightness(diff).enhance(scale)
            
            diff_np = np.array(diff).astype(np.float32)
            diff_lum = np.mean(diff_np, axis=2)
            
            block_vars = []
            h, w = diff_lum.shape
            for y in range(0, h, 16):
                for x in range(0, w, 16):
                    block = diff_lum[y:y+16, x:x+16]
                    if block.size > 0:
                        block_vars.append(np.mean(block))
            
            if not block_vars: return 0, None, 0
            vars_np = np.array(block_vars)
            threshold = np.percentile(vars_np, 98)
            mean_error = np.mean(vars_np)
            
            score = 0
            if mean_error > 0.5 and threshold > (mean_error * 4.0):
                score = 50
                
            buffered_out = io.BytesIO()
            visual_diff.save(buffered_out, format="JPEG")
            img_str = base64.b64encode(buffered_out.getvalue()).decode("utf-8")
            return score, img_str, mean_error
        except:
            return 0, None, 0

    def _check_min_max_deviation(self, gray):
        """
        Sherloq-inspired Min/Max Deviation.
        Calculates local dynamic range (Max - Min) in 5x5 blocks.
        High deviation in range suggests manipulation (splicing/blurring).
        """
        try:
            kernel = np.ones((5,5), np.uint8)
            # Morphological filters find local Min and Max
            local_min = cv2.erode(gray, kernel)
            local_max = cv2.dilate(gray, kernel)
            
            # Local Dynamic Range
            local_range = cv2.absdiff(local_max, local_min).astype(np.float32)
            
            # Global mean of the range
            avg_range = np.mean(local_range)
            
            # Calculate Deviation: How far is the local range from the global average?
            # We look for "Quiet" spots in "Noisy" images (blurring)
            # Or "Loud" spots in "Quiet" images (splicing)
            deviation_map = np.abs(local_range - avg_range)
            
            # Score: Ratio of high deviation pixels
            threshold = avg_range * 2.0 
            outliers = np.sum(deviation_map > threshold)
            total_pixels = gray.shape[0] * gray.shape[1]
            
            ratio = outliers / total_pixels
            
            # If > 10% of image has abnormal dynamic range, it's likely edited
            score = 0
            if ratio > 0.10:
                score = min(100, ratio * 400)
                
            return int(score), ratio
        except:
            return 0, 0