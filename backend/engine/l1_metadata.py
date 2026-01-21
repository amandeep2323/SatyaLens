import os
from PIL import Image
import piexif
import io

class MetadataLayer:
    def __init__(self):
        self.layer_name = "L1_Metadata"
        self.weight = 0.15 

    def analyze(self, image_path):
        score = 0
        flags = []
        details = {} # <--- NEW

        try:
            img = Image.open(image_path)
            
            # Telemetry
            if img.info:
                details['metadata_count'] = len(img.info)
            else:
                details['metadata_count'] = 0

            # 1. Check for Explicit AI Signatures
            ai_score, ai_flags = self._check_ai_tags(img)
            score += ai_score
            flags.extend(ai_flags)

            # 2. EXIF Data Analysis
            if 'exif' in img.info:
                try:
                    exif_dict = piexif.load(img.info['exif'])
                    
                    # UPDATED: Returns software name now
                    soft_score, soft_flags, soft_name = self._check_software_tag(exif_dict)
                    score += soft_score
                    flags.extend(soft_flags)
                    details['software_signature'] = soft_name
                    
                    # Check Thumbnail
                    thumb_score, thumb_flags = self._check_thumbnail_mismatch(img, exif_dict)
                    score += thumb_score
                    flags.extend(thumb_flags)
                except:
                    details['exif_status'] = "Corrupt"
            else:
                score += 10
                flags.append("No EXIF Metadata found (Metadata stripped or synthetic)")
                details['exif_status'] = "Missing"

        except Exception as e:
            print(f"L1 Error: {e}")
            return {"layer_name": self.layer_name, "score": 0, "verdict": "Error", "flags": [], "details": {}}

        final_score = min(score, 100)
        
        return {
            "layer_name": self.layer_name,
            "score": final_score,
            "verdict": "Suspicious" if final_score > 50 else "Clean",
            "flags": flags,
            "details": details
        }

    def _check_ai_tags(self, img):
        score = 0
        flags = []
        info = img.info
        ai_keywords = ["stable diffusion", "midjourney", "dall-e", "comfyui", "automatic1111"]
        edit_keywords = ["photoshop", "gimp", "adobe", "paint.net"]

        for key, value in info.items():
            val_str = str(value).lower()
            if any(k in val_str for k in ai_keywords):
                score = 100
                flags.append(f"Explicit AI Signature found in '{key}': {val_str[:20]}...")
            elif any(k in val_str for k in edit_keywords):
                score += 30
                flags.append(f"Editing Software Signature: {val_str[:20]}...")
        return score, flags

    def _check_software_tag(self, exif_dict):
        score = 0
        flags = []
        software_found = "None"
        if 0 in exif_dict and 305 in exif_dict[0]:
            try:
                software = exif_dict[0][305].decode('utf-8', 'ignore').lower()
                software_found = software # Capture name
                if "adobe" in software or "photoshop" in software:
                    score += 40
                    flags.append(f"EXIF Software Tag: {software} (Edited)")
                elif "gimp" in software:
                    score += 40
                    flags.append(f"EXIF Software Tag: {software} (Edited)")
            except:
                pass
        return score, flags, software_found

    def _check_thumbnail_mismatch(self, img, exif_dict):
        score = 0
        flags = []
        if 'thumbnail' in exif_dict and exif_dict['thumbnail'] is not None:
            try:
                thumb_data = exif_dict['thumbnail']
                thumb_img = Image.open(io.BytesIO(thumb_data))
                main_aspect = img.width / img.height
                thumb_aspect = thumb_img.width / thumb_img.height
                if abs(main_aspect - thumb_aspect) > 0.15:
                    score += 50
                    flags.append("Thumbnail aspect ratio mismatch (Image likely cropped/edited)")
            except:
                pass 
        return score, flags