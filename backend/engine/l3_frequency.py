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
        
        try:
            # Load
            img = cv2.imread(image_path, 0)
            if img is None: 
                pil_img = Image.open(image_path).convert('L')
                img = np.array(pil_img)

            # --- CHECK 1: GAN Grid Detection ---
            # Catches rigid checkerboard patterns common in Deepfakes.
            # Uses masking to ignore valid JPEG grids.
            gan_score, spectrum_img = self._detect_gan_artifacts_universal(img)
            spectrum_b64 = spectrum_img
            if gan_score > 50:
                score += gan_score
                flags.append("Strong periodic artifacts (Unknown Grid Pattern)")

            # --- CHECK 2: Power Spectrum Slope ---
            # Real optics (Drone/DSLR) fall off naturally.
            # AI often has too much high-freq energy (Slope > -1.5).
            slope_score = self._check_power_spectrum_slope(img)
            if slope_score > 60:
                score += 30
                flags.append("Energy decay is unnatural (Violates 1/f law)")

            # --- CHECK 3: Spectral Flatness ---
            # Catches synthetic noise injection (Diffusion models).
            sfm_score = self._calculate_spectral_flatness(img)
            if sfm_score > 50:
                score += 20
                flags.append("Abnormal Spectral Flatness (Synthetic Noise)")

        except Exception as e:
            print(f"L3 Error: {e}")
            return {"layer_name": self.layer_name, "score": 0, "verdict": "Error", "flags": []}

        final_score = min(score, 100)
        
        return {
            "layer_name": self.layer_name,
            "score": int(final_score),
            "verdict": "Synthetic" if final_score > 50 else "Natural",
            "flags": flags,
            "spectrum_image": spectrum_b64
        }

    def _detect_gan_artifacts_universal(self, img):
        """
        Universal Grid Detector.
        Masks out center (Structure) and axes (Edges).
        Masks out JPEG harmonics (8x8 grid).
        Flags anything else (GANs).
        """
        try:
            h, w = img.shape
            f = np.fft.fft2(img)
            fshift = np.fft.fftshift(f)
            magnitude = 20 * np.log(np.abs(fshift) + 1e-8)
            mag_norm = cv2.normalize(magnitude, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
            
            cy, cx = h // 2, w // 2
            
            # 1. Mask DC & Axes (Real Structure)
            cv2.circle(mag_norm, (cx, cy), 8, 0, -1)
            cv2.line(mag_norm, (cx, 0), (cx, h), 0, 2)
            cv2.line(mag_norm, (0, cy), (w, cy), 0, 2)

            # 2. Mask JPEG Grid (8x8)
            # This protects WhatsApp/Web images from being flagged.
            if h > 64 and w > 64:
                step_h = h // 8
                step_w = w // 8
                for i in range(1, 8):
                    for j in range(1, 8):
                        py = cy + (i - 4) * step_h
                        px = cx + (j - 4) * step_w
                        # Mask a 5x5 area around expected JPEG spots
                        cv2.circle(mag_norm, (int(px), int(py)), 4, 0, -1)

            # 3. Detect Anomalies
            _, thresh = cv2.threshold(mag_norm, 210, 255, cv2.THRESH_BINARY)
            peaks = cv2.countNonZero(thresh)
            
            # Thresholds tuned for Universal
            score = 0
            if peaks > 15: # Strict but fair
                score = min(100, ((peaks - 15) / 40.0) * 100)

            # Visualization
            heatmap = cv2.applyColorMap(mag_norm, cv2.COLORMAP_JET)
            _, buffer = cv2.imencode('.jpg', heatmap)
            img_str = base64.b64encode(buffer).decode("utf-8")

            return int(score), img_str
        except:
            return 0, None

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
            if end <= start: return 0
            
            slope, _, _, _, _ = stats.linregress(np.log(np.arange(start, end)), np.log(radial_profile[start:end] + 1e-8))
            
            # > -1.6 is too "flat" (White Noise / GANs)
            # We allow steep slopes (< -3.0) because blur (Bokeh) is natural.
            if slope > -1.6: 
                return 70
            return 0
        except:
            return 0

    def _calculate_spectral_flatness(self, img):
        try:
            f = np.fft.fft2(img)
            magnitude = np.abs(f) ** 2
            ps_flat = magnitude.flatten() + 1e-10
            
            geo_mean = np.exp(np.mean(np.log(ps_flat)))
            ari_mean = np.mean(ps_flat)
            sfm = geo_mean / ari_mean
            
            # > 0.25 is very noisy (High ISO or Diffusion Noise)
            if sfm > 0.25: 
                return 60
            return 0
        except:
            return 0