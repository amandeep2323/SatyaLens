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
            # Load Grayscale
            img = cv2.imread(image_path, 0)
            if img is None: 
                pil_img = Image.open(image_path).convert('L')
                img = np.array(pil_img)

            # 1. GAN Periodicity (Aliasing & Upsampling detection)
            gan_score, spectrum_img = self._detect_gan_artifacts(img)
            spectrum_b64 = spectrum_img
            if gan_score > 50:
                score += gan_score
                flags.append("Strong periodic artifacts (GAN Grid/Aliasing detected)")

            # 2. Power Spectrum Slope (Physics check)
            slope_score = self._check_power_spectrum_slope(img)
            if slope_score > 60:
                score += 30
                flags.append("Unnatural energy decay (Violates 1/f power law)")

            # 3. [NEW] Spectral Flatness Measure (SFM)
            # Checks if image is too "noise-like" (high flatness) or too "tone-like"
            sfm_score = self._calculate_spectral_flatness(img)
            if sfm_score > 50:
                score += 20
                flags.append("Abnormal Spectral Flatness (Likely Diffusion/Noise synthesis)")

            # 4. [NEW] Multi-Scale Frequency Consistency
            # Checks if artifacts persist when resized (a common trait of Deepfakes)
            scale_score = self._check_multiscale_consistency(img)
            if scale_score > 50:
                score += 20
                flags.append("Frequency artifacts persist across scales (Deepfake trait)")

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

    def _detect_gan_artifacts(self, img):
        try:
            f = np.fft.fft2(img)
            fshift = np.fft.fftshift(f)
            magnitude_spectrum = 20 * np.log(np.abs(fshift) + 1e-8)

            # Normalize
            mag_norm = cv2.normalize(magnitude_spectrum, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
            
            # Mask center
            h, w = mag_norm.shape
            cv2.circle(mag_norm, (w//2, h//2), min(h,w)//8, 0, -1)

            # Threshold for peaks
            _, thresh = cv2.threshold(mag_norm, 210, 255, cv2.THRESH_BINARY)
            peaks = cv2.countNonZero(thresh)
            
            score = min(100, (peaks / 50.0) * 100)

            # Visualization
            heatmap = cv2.applyColorMap(mag_norm, cv2.COLORMAP_JET)
            _, buffer = cv2.imencode('.jpg', heatmap)
            img_str = base64.b64encode(buffer).decode("utf-8")

            return score, img_str
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
            
            start, end = 10, min(len(radial_profile), min(h, w)//4)
            if end <= start: return 0
            
            slope, _, _, _, _ = stats.linregress(np.log(np.arange(start, end)), np.log(radial_profile[start:end] + 1e-8))
            
            if slope > -1.6: return 70 # Too noisy/harsh
            if slope < -3.5: return 40 # Too blurry
            return 0
        except:
            return 0

    def _calculate_spectral_flatness(self, img):
        """
        Computes Geometric Mean / Arithmetic Mean of the power spectrum.
        SFM = 1.0 (White Noise), SFM ~ 0 (Pure Sine Wave).
        Real images have low SFM. Diffusion models often have higher SFM due to noise injection.
        """
        try:
            f = np.fft.fft2(img)
            magnitude = np.abs(f) ** 2 # Power spectrum
            
            # Avoid log(0)
            ps_flat = magnitude.flatten() + 1e-10
            
            # Geometric mean = exp(mean(log(x)))
            geo_mean = np.exp(np.mean(np.log(ps_flat)))
            ari_mean = np.mean(ps_flat)
            
            sfm = geo_mean / ari_mean
            
            # Real photos typically have VERY low SFM (structured). 
            # High SFM indicates randomness/noise.
            # Threshold varies, but sudden spikes in SFM are suspicious.
            if sfm > 0.1: # Threshold for "Too Noisy/Diffusion-like"
                return 60
            return 0
        except:
            return 0

    def _check_multiscale_consistency(self, img):
        """
        Checks if frequency artifacts persist when the image is downscaled.
        Real details usually smooth out. GAN artifacts (checkerboards) often persist or alias worse.
        """
        try:
            # 1. Analyze original
            score_orig, _ = self._detect_gan_artifacts(img)
            
            # 2. Downscale by 50%
            h, w = img.shape
            resized = cv2.resize(img, (w//2, h//2), interpolation=cv2.INTER_LINEAR)
            
            # 3. Analyze resized
            score_resized, _ = self._detect_gan_artifacts(resized)
            
            # If the image was high-scored originally, and the score STAYS high 
            # or increases after resizing, it's likely a rigid grid artifact.
            # Real texture details usually drop in high-freq energy when downscaled.
            if score_orig > 30 and score_resized > 30:
                return 60
            
            return 0
        except:
            return 0