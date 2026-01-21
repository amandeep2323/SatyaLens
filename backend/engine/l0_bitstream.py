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
        
        try:
            # Check file format first
            img = Image.open(file_path)
            if img.format not in ['JPEG', 'JPG']:
                # If it's a PNG/WEBP, we can't run JPEG marker checks.
                # Return a neutral result instead of 100% Fake.
                return {
                    "layer_name": self.layer_name,
                    "score": 0,
                    "verdict": "Skipped",
                    "flags": [f"Format is {img.format} (Not JPEG) - Structure checks skipped"]
                }

            # 2. Quantization Table Check
            q_score, q_flags = self._check_quantization(file_path)
            score += q_score
            flags.extend(q_flags)
            
            # 3. Double Compression / Ghosting
            c_score = self._detect_double_compression(file_path)
            if c_score > 50:
                score += 30
                flags.append("High likelihood of re-saving/editing (Double Compression)")

        except Exception as e:
            print(f"Bitstream Warning: {e}")
            return {"layer_name": self.layer_name, "score": 0, "verdict": "Skipped", "flags": []}

        final_score = min(score, 100)
        return {
            "layer_name": self.layer_name,
            "score": final_score,
            "verdict": "Suspicious" if final_score > 50 else "Clean",
            "flags": flags
        }

    def _analyze_structure(self, path):
        """
        Scans for specific JPEG markers: 
        SOI (FFD8), SOF2 (Progressive), DHT (Huffman), APP1 (EXIF)
        """
        score = 0
        flags = []
        
        with open(path, 'rb') as f:
            data = f.read()

        # Check for Start of Image (SOI) - Basic Validity
        if not data.startswith(b'\xFF\xD8'):
            return 100, ["Invalid JPEG: Missing SOI Marker"]

        # Check for Progressive JPEG (SOF2 - 0xFFC2)
        # AI Generators (Midjourney/DALL-E) usually output Baseline (SOF0), NOT Progressive.
        # Real web images are often Progressive.
        if b'\xFF\xC2' in data:
            # Not a penalty, just an observation. 
            # If it claims to be a raw camera image but is progressive, that's suspicious.
            flags.append("Format: Progressive JPEG (Web Optimized)")
        
        # Check for Huffman Tables (DHT - 0xFFC4)
        if b'\xFF\xC4' not in data:
            score += 20
            flags.append("Missing Huffman Table (Unusual Encoding)")

        # Check: Missing EXIF (APP1 - 0xFFE1) but present JFIF (APP0 - 0xFFE0)
        has_exif = b'\xFF\xE1' in data
        has_jfif = b'\xFF\xE0' in data
        
        if not has_exif and has_jfif:
            score += 10 
            flags.append("No Camera EXIF data found (Software Saved)")

        # Check: Photoshop Signature
        if b'Photoshop' in data or b'Adobe' in data:
            score += 5
            flags.append("Adobe/Editor metadata signature found")

        return score, flags

    def _check_quantization(self, path):
        score = 0
        flags = []
        try:
            img = Image.open(path)
            if img.format != 'JPEG': return 0, []
            
            qtables = img.quantization
            if not qtables: return 0, []

            # Heuristic: Check if tables are "all 1s" (Synthetic/Upscaled signature)
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