import cv2
import numpy as np
import torch
import math
from PIL import Image

# Try importing MTCNN (Deep Learning Face Detection)
try:
    from facenet_pytorch import MTCNN
    AI_FACE_AVAILABLE = True
except ImportError:
    print("L4 Warning: facenet-pytorch not installed. Falling back to simple logic.")
    AI_FACE_AVAILABLE = False

class SemanticLayer:
    def __init__(self):
        self.layer_name = "L4_Semantic"
        self.weight = 0.20 
        
        # Select Device
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        
        # Initialize MTCNN (Deep Learning)
        if AI_FACE_AVAILABLE:
            try:
                self.mtcnn = MTCNN(keep_all=True, device=self.device, thresholds=[0.6, 0.7, 0.7])
                print(f"L4: MTCNN Face Detector Loaded on {self.device}")
            except Exception as e:
                print(f"L4 Error loading MTCNN: {e}")
                self.mtcnn = None
        else:
            self.mtcnn = None

    def analyze(self, image_path):
        score = 0
        flags = []
        details = {}
        
        try:
            img = Image.open(image_path).convert('RGB')
            # Convert to CV2 for geometry/lighting checks
            cv_img = np.array(img)[:, :, ::-1].copy() 
            gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)

            # --- CHECK 1: Deep Learning Face Physics ---
            if self.mtcnn:
                face_score, face_flags, face_data = self._analyze_face_physics_ai(img, cv_img)
                score += face_score
                flags.extend(face_flags)
                details.update(face_data)
            
            # --- CHECK 2: Lighting Consistency ---
            light_score, light_data = self._check_lighting_consistency(gray)
            score += light_score
            if light_score > 0:
                flags.append("Inconsistent Lighting Direction (Shadows don't match)")
            details.update(light_data)

            # --- CHECK 3: Perspective Consistency ---
            persp_score, persp_data = self._check_perspective_lines(gray)
            score += persp_score
            if persp_score > 0:
                flags.append("Chaotic Perspective Lines (Structural warping)")
            details.update(persp_data)

        except Exception as e:
            print(f"L4 Error: {e}")
            return {"layer_name": self.layer_name, "score": 0, "verdict": "Error", "flags": [], "details": {}}

        final_score = min(score, 100)
        
        return {
            "layer_name": self.layer_name,
            "score": int(final_score),
            "verdict": "Synthetic" if final_score > 50 else "Natural",
            "flags": flags,
            "details": details
        }

    def _analyze_face_physics_ai(self, pil_img, cv_img):
        """
        Uses MTCNN to detect faces and precise landmarks (Eyes, Nose, Mouth).
        Deep Learning is far more robust than Haar Cascades.
        """
        score = 0
        flags = []
        data = {'faces_detected': 0}
        
        try:
            # Detect
            boxes, probs, landmarks = self.mtcnn.detect(pil_img, landmarks=True)
            
            if boxes is None: 
                return 0, [], data
                
            data['faces_detected'] = len(boxes)
            
            # Analyze largest face
            # Box format: [x1, y1, x2, y2]
            largest_idx = np.argmax([(b[2]-b[0]) * (b[3]-b[1]) for b in boxes])
            box = boxes[largest_idx]
            marks = landmarks[largest_idx] # 5 points: L_Eye, R_Eye, Nose, L_Mouth, R_Mouth
            
            x1, y1, x2, y2 = map(int, box)
            w, h = x2-x1, y2-y1
            
            # 1. Geometry Check
            face_ratio = h / (w + 1e-5)
            data['face_aspect_ratio'] = f"{face_ratio:.2f}"
            
            # Relaxed thresholds for AI detection vs Real Camera
            if face_ratio < 0.85 or face_ratio > 2.2:
                score += 20
                flags.append(f"Abnormal Face Geometry (Ratio {face_ratio:.2f})")

            # 2. Precise Eye Symmetry (Using Neural Landmarks)
            # MTCNN gives exact pupil centers.
            left_eye = marks[0]
            right_eye = marks[1]
            
            # Extract eye chips
            eye_size = int(w * 0.18) # Eyes are roughly 18% of face width
            
            def get_eye_chip(center):
                cx, cy = int(center[0]), int(center[1])
                es = eye_size // 2
                return cv_img[cy-es:cy+es, cx-es:cx+es]
            
            le_img = get_eye_chip(left_eye)
            re_img = get_eye_chip(right_eye)
            
            if le_img.size > 0 and re_img.size > 0 and le_img.shape == re_img.shape:
                # Mirror right eye
                re_flipped = cv2.flip(re_img, 1)
                
                # Convert to grayscale for correlation
                l_g = cv2.cvtColor(le_img, cv2.COLOR_BGR2GRAY)
                r_g = cv2.cvtColor(re_flipped, cv2.COLOR_BGR2GRAY)
                
                res = cv2.matchTemplate(l_g, r_g, cv2.TM_CCOEFF_NORMED)
                symmetry = res[0][0]
                data['eye_symmetry_corr'] = f"{symmetry:.3f}"
                
                # AI Eyes are often:
                # 1. Too different (different reflections) -> Low score
                # 2. Identical (copy-paste) -> High score
                
                if symmetry < 0.20:
                    score += 50
                    flags.append("Asymmetric Eyes (Highlight/Shape mismatch)")
                elif symmetry > 0.95:
                    score += 40
                    flags.append("Eyes are pixel-perfect clones (Synthetic/Edit)")

        except Exception as e:
            print(f"L4 AI Scan Error: {e}")
            pass

        return score, flags, data

    def _check_lighting_consistency(self, gray):
        # (Same logic as before, just kept for completeness)
        try:
            gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
            gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
            mag, angle = cv2.cartToPolar(gx, gy, angleInDegrees=True)
            threshold = np.mean(mag) * 1.5
            mask = mag > threshold
            if np.sum(mask) < 100: return 0, {}
            
            valid_angles = angle[mask]
            hist, _ = np.histogram(valid_angles, bins=36, range=(0, 360))
            sorted_bins = np.sort(hist)[::-1]
            ratio = sorted_bins[0] / (sorted_bins[1] + 1e-5)
            
            data = {'light_direction_dominance': f"{ratio:.2f}"}
            if ratio < 1.1: return 30, data
            return 0, data
        except: return 0, {}

    def _check_perspective_lines(self, gray):
        # (Same logic as before)
        try:
            edges = cv2.Canny(gray, 50, 150, apertureSize=3)
            lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=100, minLineLength=100, maxLineGap=10)
            if lines is None: return 0, {'detected_lines': 0}
            
            angles = []
            for line in lines:
                x1, y1, x2, y2 = line[0]
                angle = math.degrees(math.atan2(y2 - y1, x2 - x1))
                if angle < 0: angle += 180
                angles.append(angle)
            
            hist, _ = np.histogram(angles, bins=36, range=(0, 180))
            threshold = max(hist) * 0.2
            noise = np.sum(hist[hist < threshold])
            ratio = noise / (len(angles) + 1e-5)
            
            data = {'perspective_noise_ratio': f"{ratio:.2f}", 'detected_lines': len(angles)}
            if len(angles) > 10 and ratio > 0.6: return 30, data
            return 0, data
        except: return 0, {}