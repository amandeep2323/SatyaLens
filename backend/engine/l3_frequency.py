import cv2
import numpy as np
from scipy import stats
from PIL import Image
import base64
from io import BytesIO

class FrequencyLayer:
    def __init__(self):
        self.layer_name = "L3_Frequency"
        self.weight = 0.25 

    def analyze(self, image_path):
        score = 0
        flags = []
        spectrum_b64 = None
        details = {} # <--- NEW

        try:
            # Load
            img = cv2.imread(image_path, 0)
            if img is None: 
                pil_img = Image.open(image_path).convert('L')
                img = np.array(pil_img)

            # --- CHECK 1: GAN Grid Detection ---
            # UPDATED: Returns peak_count now
            gan_score, spectrum_img, peak_count = self._detect_gan_artifacts_universal(img)
            spectrum_b64 = spectrum_img
            details['gan_peaks'] = peak_count

            if gan_score > 50:
                score += gan_score
                flags.append("Strong periodic artifacts (Unknown Grid Pattern)")

            # --- CHECK 2: Power Spectrum Slope ---
            # UPDATED: Returns slope value now
            slope_score, slope_val = self._check_power_spectrum_slope(img)
            details['spectral_slope'] = f"{slope_val:.3f}"

            if slope_score > 60:
                score += 30
                flags.append("Energy decay is unnatural (Violates 1/f law)")

            # --- CHECK 3: Spectral Flatness ---
            # UPDATED: Returns sfm value now
            sfm_score, sfm_val = self._calculate_spectral_flatness(img)
            details['spectral_flatness'] = f"{sfm_val:.4f}"

            if sfm_score > 50:
                score += 20
                flags.append("Abnormal Spectral Flatness (Synthetic Noise)")

        except Exception as e:
            print(f"L3 Error: {e}")
            return {"layer_name": self.layer_name, "score": 0, "verdict": "Error", "flags": [], "details": {}}

        final_score = min(score, 100)
        
        return {
            "layer_name": self.layer_name,
            "score": int(final_score),
            "verdict": "Synthetic" if final_score > 50 else "Natural",
            "flags": flags,
            "spectrum_image": spectrum_b64,
            "details": details
        }

    def _detect_gan_artifacts_universal(self, img):
        try:
            h, w = img.shape
            f = np.fft.fft2(img)
            fshift = np.fft.fftshift(f)
            magnitude = 20 * np.log(np.abs(fshift) + 1e-8)
            mag_norm = cv2.normalize(magnitude, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
            
            cy, cx = h // 2, w // 2
            
            # Mask DC & Axes
            cv2.circle(mag_norm, (cx, cy), 8, 0, -1)
            cv2.line(mag_norm, (cx, 0), (cx, h), 0, 2)
            cv2.line(mag_norm, (0, cy), (w, cy), 0, 2)

            # Mask JPEG Grid
            if h > 64 and w > 64:
                step_h = h // 8
                step_w = w // 8
                for i in range(1, 8):
                    for j in range(1, 8):
                        py = cy + (i - 4) * step_h
                        px = cx + (j - 4) * step_w
                        cv2.circle(mag_norm, (int(px), int(py)), 4, 0, -1)

            _, thresh = cv2.threshold(mag_norm, 210, 255, cv2.THRESH_BINARY)
            peaks = cv2.countNonZero(thresh)
            
            score = 0
            if peaks > 15:
                score = min(100, ((peaks - 15) / 40.0) * 100)

            heatmap = cv2.applyColorMap(mag_norm, cv2.COLORMAP_JET)
            _, buffer = cv2.imencode('.jpg', heatmap)
            img_str = base64.b64encode(buffer).decode("utf-8")

            return int(score), img_str, peaks
        except:
            return 0, None, 0

    def _check_power_spectrum_slope(self, img):
        try:
            f = np.fft.fft2(img)
            fshift = np.fft.fftshift(f)
            magnitude = np.abs(fshift) ** 2
            
            h, w = img.shape
            y, x = np.indices((h, w))
            center = (h//2, w//2)
            r = np.sqrt((x - center[1])**2 + (y - center[0])**2).astype(int)
            
            tbin = np.bincount(r.ravel(), magnitude.ravel())
            nr = np.bincount(r.ravel())
            radial_profile = tbin / (nr + 1e-8)
            
            start = 10
            end = min(len(radial_profile), min(h, w)//4)
            if end <= start: return 0, 0
            
            slope, _, _, _, _ = stats.linregress(np.log(np.arange(start, end)), np.log(radial_profile[start:end] + 1e-8))
            
            if slope > -1.6: 
                return 70, slope
            return 0, slope
        except:
            return 0, 0

    def _calculate_spectral_flatness(self, img):
        try:
            f = np.fft.fft2(img)
            magnitude = np.abs(f) ** 2
            ps_flat = magnitude.flatten() + 1e-10
            
            geo_mean = np.exp(np.mean(np.log(ps_flat)))
            ari_mean = np.mean(ps_flat)
            sfm = geo_mean / ari_mean
            
            if sfm > 0.25: 
                return 60, sfm
            return 0, sfm
        except:
            return 0, 0