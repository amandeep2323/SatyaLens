import cv2
import numpy as np
import torch
import math
from PIL import Image

try:
    from facenet_pytorch import MTCNN
    AI_FACE_AVAILABLE = True
except ImportError:
    print("L4 Warning: facenet-pytorch not installed.")
    AI_FACE_AVAILABLE = False

class SemanticLayer:
    def __init__(self):
        self.layer_name = "L4_Semantic"
        self.weight = 0.20 
        self.device = self._determine_device()
        if AI_FACE_AVAILABLE:
            try:
                self.mtcnn = MTCNN(keep_all=True, device=self.device, thresholds=[0.6, 0.7, 0.7])
            except:
                self.mtcnn = MTCNN(keep_all=True, device='cpu', thresholds=[0.6, 0.7, 0.7])
        else:
            self.mtcnn = None

    def _determine_device(self):
        if torch.cuda.is_available():
            try:
                cap = torch.cuda.get_device_capability(0)
                if float(f"{cap[0]}.{cap[1]}") < 3.7: return 'cpu'
                return 'cuda'
            except: return 'cpu'
        return 'cpu'

    def analyze(self, image_path):
        # ACCUMULATOR LOGIC: Start at 0. Add points for failures.
        # Verdict is based on TOTAL risk, not individual checks.
        total_risk = 0
        flags = []
        details = {}
        
        try:
            img = Image.open(image_path).convert('RGB')
            cv_img = np.array(img)[:, :, ::-1].copy() 
            gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)

            # --- CHECK 1: Face Physics ---
            if self.mtcnn:
                try:
                    risk, f_flags, f_data = self._analyze_face_physics_ai(img, cv_img)
                    total_risk += risk
                    flags.extend(f_flags)
                    details.update(f_data)
                except Exception: pass
            
            # --- CHECK 2: Lighting ---
            l_risk, l_data = self._check_lighting_consistency(gray)
            total_risk += l_risk
            if l_risk > 0: flags.append("Inconsistent Lighting")
            details.update(l_data)

            # --- CHECK 3: Perspective ---
            p_risk, p_data = self._check_perspective_lines(gray)
            total_risk += p_risk
            if p_risk > 0: flags.append("Chaotic Perspective")
            details.update(p_data)

        except: return {"layer_name": self.layer_name, "score": 0, "verdict": "Error", "flags": [], "details": {}}

        # Normalize Score: It takes ~60 risk points to be "100% Fake"
        final_score = min(total_risk, 100)
        
        return {
            "layer_name": self.layer_name,
            "score": int(final_score),
            "verdict": "Synthetic" if final_score > 50 else "Natural",
            "flags": flags,
            "details": details
        }

    def _analyze_face_physics_ai(self, pil_img, cv_img):
        risk = 0
        flags = []
        data = {'faces_detected': 0}
        
        boxes, probs, landmarks = self.mtcnn.detect(pil_img, landmarks=True)
        if boxes is None: return 0, [], data
            
        data['faces_detected'] = len(boxes)
        largest_idx = np.argmax([(b[2]-b[0]) * (b[3]-b[1]) for b in boxes])
        box = boxes[largest_idx]
        marks = landmarks[largest_idx] 
        
        x1, y1, x2, y2 = map(int, box)
        w, h = x2-x1, y2-y1
        
        # 1. Geometry Risk (Small weight)
        face_ratio = h / (w + 1e-5)
        data['face_aspect_ratio'] = f"{face_ratio:.2f}"
        if face_ratio < 0.8 or face_ratio > 2.2:
            risk += 15 # Small penalty
            flags.append(f"Abnormal Face Geometry")

        # 2. Eye Symmetry Risk
        left_eye, right_eye = marks[0], marks[1]
        eye_size = int(w * 0.18)
        
        def get_eye_chip(center):
            cx, cy = int(center[0]), int(center[1])
            es = eye_size // 2
            y1, y2 = max(0, cy-es), min(cv_img.shape[0], cy+es)
            x1, x2 = max(0, cx-es), min(cv_img.shape[1], cx+es)
            return cv_img[y1:y2, x1:x2]
        
        le_img = get_eye_chip(left_eye)
        re_img = get_eye_chip(right_eye)
        
        if le_img.size > 0 and re_img.size > 0 and le_img.shape == re_img.shape:
            re_flipped = cv2.flip(re_img, 1)
            l_g = cv2.cvtColor(le_img, cv2.COLOR_BGR2GRAY)
            r_g = cv2.cvtColor(re_flipped, cv2.COLOR_BGR2GRAY)
            
            res = cv2.matchTemplate(l_g, r_g, cv2.TM_CCOEFF_NORMED)
            symmetry = res[0][0]
            data['eye_symmetry_corr'] = f"{symmetry:.3f}"
            
            # Weighted Risk:
            if symmetry < 0.15:
                risk += 25 # Medium Penalty (Needs another failure to trigger verdict)
                flags.append("Asymmetric Eyes")
            elif symmetry > 0.98:
                risk += 30
                flags.append("Cloned Eyes")

        return risk, flags, data

    def _check_lighting_consistency(self, gray):
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
            
            # Only punish CHAOS (very low ratio)
            if ratio < 1.01: 
                return 0, data # Diffuse light is okay
            
            return 0, data
        except: return 0, {}

    def _check_perspective_lines(self, gray):
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
            if len(angles) > 10 and ratio > 0.7: # Raised threshold to 0.7
                return 25, data # Medium penalty
            return 0, data
        except: return 0, {}