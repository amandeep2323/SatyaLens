import struct
from PIL import Image
import os
import numpy as np

class BitstreamAnalyzer:
    def __init__(self):
        self.layer_name = "L0_Bitstream"
        self.weight = 0.15 

    def analyze(self, file_path):
        score = 0
        flags = []
        details = {} # <--- NEW: Telemetry

        try:
            # 1. Basic Telemetry
            file_size = os.path.getsize(file_path)
            details['file_size'] = f"{file_size / 1024:.2f} KB"
            
            img = Image.open(file_path)
            details['resolution'] = f"{img.width}x{img.height}"
            details['format'] = img.format or "Unknown"
            
            # Check file format first
            if img.format not in ['JPEG', 'JPG']:
                return {
                    "layer_name": self.layer_name,
                    "score": 0,
                    "verdict": "Skipped",
                    "flags": [f"Format is {img.format} (Not JPEG) - Structure checks skipped"],
                    "details": details
                }

            # 2. Quantization Table Check
            q_score, q_flags = self._check_quantization(file_path)
            score += q_score
            flags.extend(q_flags)
            details['quantization_check'] = "Pass" if q_score == 0 else "Fail"
            
            # 3. Double Compression / Ghosting
            c_score = self._detect_double_compression(file_path)
            if c_score > 50:
                score += 30
                flags.append("High likelihood of re-saving/editing (Double Compression)")
                details['compression_anomalies'] = "High"
            else:
                details['compression_anomalies'] = "Low"

        except Exception as e:
            print(f"L0 Error: {e}")
            return {
                "layer_name": self.layer_name,
                "score": 0,
                "verdict": "Error",
                "flags": [],
                "details": details
            }

        final_score = min(score, 100)
        
        return {
            "layer_name": self.layer_name,
            "score": final_score,
            "verdict": "Suspicious" if final_score > 50 else "Clean",
            "flags": flags,
            "details": details
        }

    def _check_quantization(self, path):
        score = 0
        flags = []
        try:
            img = Image.open(path)
            if img.format != 'JPEG': return 0, []
            
            qtables = img.quantization
            if not qtables: return 0, []

            first_table = qtables[0]
            if all(x == 1 for x in first_table):
                score += 40
                flags.append("Suspicious Quantization: All values are 1 (Synthetic/Upscaled)")
            
            return score, flags
        except:
            return 0, []

    def _detect_double_compression(self, path):
        try:
            img = Image.open(path).convert('RGB')
            from io import BytesIO
            buf = BytesIO()
            img.save(buf, 'JPEG', quality=95)
            original_size = os.path.getsize(path)
            new_size = buf.tell()
            ratio = new_size / original_size
            if ratio > 1.5: return 60 
            return 0
        except:
            return 0