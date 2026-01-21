import cv2
import numpy as np
import math

class SemanticLayer:
    def __init__(self):
        self.layer_name = "L4_Semantic"
        self.weight = 0.20 
        
        # Load Haar Cascades (Lightweight, built-in to OpenCV)
        # We try to use the ones included in cv2.data
        try:
            self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            self.eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')
        except:
            print("L4 Warning: Haar Cascades not found. Face checks will be skipped.")
            self.face_cascade = None

    def analyze(self, image_path):
        score = 0
        flags = []
        details = {}
        
        try:
            img = cv2.imread(image_path)
            if img is None: return {"layer_name": self.layer_name, "score": 0, "verdict": "Error", "flags": [], "details": {}}
            
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            h, w = gray.shape

            # --- CHECK 1: Face & Eye Physics (Geometry + Symmetry) ---
            if self.face_cascade:
                face_score, face_flags, face_data = self._analyze_face_physics(gray)
                score += face_score
                flags.extend(face_flags)
                details.update(face_data)
            
            # --- CHECK 2: Shadow/Lighting Consistency ---
            # Checks if light comes from a consistent direction
            light_score, light_data = self._check_lighting_consistency(gray)
            score += light_score
            if light_score > 0:
                flags.append("Inconsistent Lighting Direction (Shadows don't match)")
            details.update(light_data)

            # --- CHECK 3: Perspective/Line Consistency ---
            # Checks if straight lines are actually straight (AI often wobbles)
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

    def _analyze_face_physics(self, gray):
        score = 0
        flags = []
        data = {'faces_detected': 0}
        
        faces = self.face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(30, 30))
        data['faces_detected'] = len(faces)
        
        if len(faces) == 0: return 0, [], data

        # Analyze largest face
        faces = sorted(faces, key=lambda x: x[2]*x[3], reverse=True)
        x, y, w, h = faces[0]
        roi_gray = gray[y:y+h, x:x+w]
        
        # 1. Geometry Check (Aspect Ratio)
        # Human faces usually have a ratio ~1.3 to 1.6 (Height/Width) excluding hair
        face_ratio = h / w
        data['face_aspect_ratio'] = f"{face_ratio:.2f}"
        
        # AI often generates perfectly square faces (1.0) or too long (1.8)
        if face_ratio < 1.05 or face_ratio > 1.8:
            score += 20
            flags.append(f"Abnormal Face Geometry (Ratio {face_ratio:.2f})")

        # 2. Eye Symmetry Check
        eyes = self.eye_cascade.detectMultiScale(roi_gray, 1.1, 5)
        data['eyes_detected'] = len(eyes)
        
        if len(eyes) >= 2:
            # Find the two largest eyes (likely the main pair)
            eyes = sorted(eyes, key=lambda e: e[2]*e[3], reverse=True)[:2]
            # Sort by X position (Left, Right)
            eyes = sorted(eyes, key=lambda e: e[0])
            
            e1, e2 = eyes[0], eyes[1]
            eye1_img = roi_gray[e1[1]:e1[1]+e1[3], e1[0]:e1[0]+e1[2]]
            eye2_img = roi_gray[e2[1]:e2[1]+e2[3], e2[0]:e2[0]+e2[2]]
            
            # Resize for comparison
            target_size = (64, 64)
            try:
                e1_s = cv2.resize(eye1_img, target_size)
                e2_s = cv2.resize(eye2_img, target_size)
                e2_flipped = cv2.flip(e2_s, 1) # Mirror right eye to match left
                
                # Correlation
                res = cv2.matchTemplate(e1_s, e2_flipped, cv2.TM_CCOEFF_NORMED)
                symmetry = res[0][0]
                data['eye_symmetry_corr'] = f"{symmetry:.3f}"
                
                # Real eyes have HIGH symmetry in shape, but NOT perfect pixel match.
                # Low (< 0.2) = GAN failure (Monstrous eyes)
                # Super High (> 0.95) = Copy-Paste Edit
                if symmetry < 0.25:
                    score += 50
                    flags.append("Asymmetric Eyes (Highlight/Shape mismatch)")
                elif symmetry > 0.98:
                    score += 40
                    flags.append("Eyes are cloned (Pixel-perfect match)")
                    
            except:
                pass

        return score, flags, data

    def _check_lighting_consistency(self, gray):
        """
        Uses Gradient Histograms to find light direction.
        Real photos have 1 dominant peak (Sun/Lamp).
        AI often has diffuse/conflicting shadows.
        """
        try:
            # Sobel Gradients
            gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
            gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
            
            mag, angle = cv2.cartToPolar(gx, gy, angleInDegrees=True)
            
            # Only consider strong edges (shadows/structure)
            threshold = np.mean(mag) * 1.5
            mask = mag > threshold
            
            if np.sum(mask) < 100: return 0, {'lighting_variance': 'N/A'}
            
            valid_angles = angle[mask]
            
            # Histogram of angles (36 bins = 10 degrees each)
            hist, _ = np.histogram(valid_angles, bins=36, range=(0, 360))
            
            # Normalize
            hist = hist / np.sum(hist)
            
            # Entropy: Low entropy = Consistent light (Peaks). High entropy = Chaos.
            # However, simpler is "Peak Prominence".
            # Sort bins
            sorted_bins = np.sort(hist)[::-1]
            primary = sorted_bins[0]
            secondary = sorted_bins[1]
            
            ratio = primary / (secondary + 1e-5)
            data = {'light_direction_dominance': f"{ratio:.2f}"}
            
            # If the primary light direction is weak (ratio near 1.0), lighting is diffuse/flat/confused
            # Strong light source usually gives ratio > 1.5
            if ratio < 1.1:
                return 30, data # Diffuse/Inconsistent
            
            return 0, data
        except:
            return 0, {}

    def _check_perspective_lines(self, gray):
        """
        Uses Hough Transform to detect lines.
        Checks for "Wobble" - do parallel lines stay parallel?
        """
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
                
            detected = len(angles)
            
            # Calculate Variance of line angles in the dominant buckets
            # (Buildings usually have lines at 90 and 0 degrees)
            # AI often generates lines at random 87, 92, 4, -3 degrees.
            
            # Bin angles into 5-degree buckets
            hist, _ = np.histogram(angles, bins=36, range=(0, 180))
            
            # Count how many "Noise" lines exist (lines that aren't part of the main 2-3 clusters)
            threshold = max(hist) * 0.2
            noise_lines = np.sum(hist[hist < threshold])
            
            noise_ratio = noise_lines / (detected + 1e-5)
            data = {'perspective_noise_ratio': f"{noise_ratio:.2f}", 'detected_lines': detected}
            
            # If > 60% of lines are "random" (not aligning to main axes), perspective is chaotic
            if detected > 10 and noise_ratio > 0.6:
                return 30, data
                
            return 0, data
        except:
            return 0, {}