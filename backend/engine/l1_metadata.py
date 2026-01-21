import os
from PIL import Image
import piexif
import io

class MetadataLayer:
    def __init__(self):
        self.layer_name = "L1_Metadata"
        # Metadata is a strong indicator, but can be stripped, so we give it 15% weight
        self.weight = 0.15 

    def analyze(self, image_path):
        score = 0
        flags = []
        
        try:
            img = Image.open(image_path)
            
            # 1. Check for Explicit AI Signatures (PNG Info / Text Chunks)
            # Many AI tools leave "parameters", "workflow", or "prompt" in the file header.
            ai_score, ai_flags = self._check_ai_tags(img)
            score += ai_score
            flags.extend(ai_flags)

            # 2. EXIF Data Analysis (Software Tags)
            if 'exif' in img.info:
                try:
                    exif_dict = piexif.load(img.info['exif'])
                    
                    # Check "Software" tag (Tag ID 305)
                    soft_score, soft_flags = self._check_software_tag(exif_dict)
                    score += soft_score
                    flags.extend(soft_flags)
                    
                    # Check if Thumbnail matches Image (Ghost Detection)
                    # If you crop an image in Photoshop, the thumbnail sometimes stays original.
                    thumb_score, thumb_flags = self._check_thumbnail_mismatch(img, exif_dict)
                    score += thumb_score
                    flags.extend(thumb_flags)
                except:
                    # Corrupt EXIF is suspicious but not proof
                    pass 
            else:
                # Missing EXIF is common in AI, but also in web images (stripped).
                # We flag it lightly.
                score += 10
                flags.append("No EXIF Metadata found (Metadata stripped or synthetic)")

        except Exception as e:
            print(f"L1 Error: {e}")
            return {"layer_name": self.layer_name, "score": 0, "verdict": "Error", "flags": []}

        final_score = min(score, 100)
        
        return {
            "layer_name": self.layer_name,
            "score": final_score,
            "verdict": "Suspicious" if final_score > 50 else "Clean",
            "flags": flags
        }

    def _check_ai_tags(self, img):
        """
        Scans image info for keys like 'parameters' (Stable Diffusion) or 'Software'.
        """
        score = 0
        flags = []
        info = img.info
        
        # Keywords that indicate AI generation
        ai_keywords = ["stable diffusion", "midjourney", "dall-e", "comfyui", "automatic1111"]
        # Keywords that indicate Editing
        edit_keywords = ["photoshop", "gimp", "adobe", "paint.net"]

        for key, value in info.items():
            val_str = str(value).lower()
            
            # Check for AI
            if any(k in val_str for k in ai_keywords):
                score = 100
                flags.append(f"Explicit AI Signature found in '{key}': {val_str[:20]}...")
            
            # Check for Editing
            elif any(k in val_str for k in edit_keywords):
                score += 30
                flags.append(f"Editing Software Signature: {val_str[:20]}...")

        return score, flags

    def _check_software_tag(self, exif_dict):
        """
        Checks the standard EXIF 'Software' tag (ID 305).
        """
        score = 0
        flags = []
        # 0th IFD, Tag 305 is 'Software'
        if 0 in exif_dict and 305 in exif_dict[0]:
            try:
                software = exif_dict[0][305].decode('utf-8', 'ignore').lower()
                
                if "adobe" in software or "photoshop" in software:
                    score += 40
                    flags.append(f"EXIF Software Tag: {software} (Edited)")
                elif "gimp" in software:
                    score += 40
                    flags.append(f"EXIF Software Tag: {software} (Edited)")
            except:
                pass
        return score, flags

    def _check_thumbnail_mismatch(self, img, exif_dict):
        """
        Compares the aspect ratio of the embedded thumbnail vs the main image.
        If they don't match, the image was likely cropped/edited but thumbnail wasn't updated.
        """
        score = 0
        flags = []
        
        if 'thumbnail' in exif_dict and exif_dict['thumbnail'] is not None:
            try:
                thumb_data = exif_dict['thumbnail']
                thumb_img = Image.open(io.BytesIO(thumb_data))
                
                main_aspect = img.width / img.height
                thumb_aspect = thumb_img.width / thumb_img.height
                
                # Allow small floating point error (0.1)
                if abs(main_aspect - thumb_aspect) > 0.15:
                    score += 50
                    flags.append("Thumbnail aspect ratio mismatch (Image likely cropped/edited)")
            except:
                pass 
                
        return score, flags