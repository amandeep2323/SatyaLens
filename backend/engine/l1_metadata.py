import os
from PIL import Image, ExifTags
import piexif
import io

class MetadataLayer:
    def __init__(self):
        self.layer_name = "L1_Metadata"
        self.weight = 0.15 

    def analyze(self, image_path):
        score = 0
        flags = []
        details = {} 

        try:
            img = Image.open(image_path)
            
            # --- 1. DEEP EXTRACTION (The "Private" Details) ---
            # We extract everything first, so it appears in the dashboard
            raw_meta = self._extract_all_metadata(img)
            details.update(raw_meta)

            # --- 2. AI & EDITING DETECTION (Scoring Logic) ---
            
            # Check for Explicit AI Signatures (PNG Info / Text Chunks)
            ai_score, ai_flags = self._check_ai_tags(img)
            score += ai_score
            flags.extend(ai_flags)

            # Check for Editing Software (Photoshop, GIMP)
            if 'exif' in img.info:
                try:
                    exif_dict = piexif.load(img.info['exif'])
                    soft_score, soft_flags, soft_name = self._check_software_tag(exif_dict)
                    score += soft_score
                    flags.extend(soft_flags)
                    
                    # Check Thumbnail Mismatch (Ghost Detection)
                    thumb_score, thumb_flags = self._check_thumbnail_mismatch(img, exif_dict)
                    score += thumb_score
                    flags.extend(thumb_flags)
                except:
                    details['exif_integrity'] = "Corrupt/Unreadable"
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

    def _extract_all_metadata(self, img):
        """
        Extracts absolutely every piece of readable metadata.
        Includes GPS, Serial Numbers, Lens Info, and Maker Notes.
        """
        data = {}
        
        # A. Basic Info
        data['format'] = img.format
        data['mode'] = img.mode
        data['size'] = f"{img.width}x{img.height}"
        
        # B. EXIF Deep Dive
        if hasattr(img, '_getexif') and img._getexif():
            exif = img._getexif()
            for tag_id, value in exif.items():
                tag_name = ExifTags.TAGS.get(tag_id, tag_id)
                
                # Filter out massive binary blobs (like MakerNotes) to keep JSON clean
                if tag_name == "MakerNote" or tag_name == "UserComment":
                    data[str(tag_name)] = "Binary Data (Hidden)"
                    continue
                
                # Decode bytes to string if possible
                if isinstance(value, bytes):
                    try:
                        value = value.decode('utf-8', 'ignore').strip().replace('\x00', '')
                    except:
                        value = "<Binary Data>"
                        
                # CAPTURE PRIVATE DETAILS
                if tag_name == "BodySerialNumber": data['Camera Serial Number'] = str(value)
                if tag_name == "LensModel": data['Lens Model'] = str(value)
                if tag_name == "LensSerialNumber": data['Lens Serial Number'] = str(value)
                if tag_name == "Artist": data['Artist/Owner'] = str(value)
                if tag_name == "Copyright": data['Copyright'] = str(value)
                if tag_name == "DateTimeOriginal": data['Capture Time'] = str(value)
                if tag_name == "Model": data['Camera Model'] = str(value)
                if tag_name == "Software": data['Software Used'] = str(value)
                
                # GPS Logic
                if tag_name == "GPSInfo":
                    gps_data = self._parse_gps(value)
                    if gps_data:
                        data['GPS Location'] = gps_data

        # C. PNG/Text Chunks (Common in AI)
        if img.info:
            for k, v in img.info.items():
                if k not in ['exif', 'icc_profile']: # Skip binary blobs
                    # Parameters/Prompt is often massive, so we truncate for display
                    val_str = str(v)
                    if len(val_str) > 100:
                        data[f"Metadata_{k}"] = val_str[:100] + "..."
                    else:
                        data[f"Metadata_{k}"] = val_str

        return data

    def _parse_gps(self, gps_info):
        """
        Converts raw EXIF GPS DMS (Degrees, Minutes, Seconds) to Decimal.
        """
        try:
            def convert_to_degrees(value):
                d = value[0]
                m = value[1]
                s = value[2]
                return d + (m / 60.0) + (s / 3600.0)

            # GPS keys: 1=LatRef, 2=Lat, 3=LonRef, 4=Lon
            if 2 in gps_info and 4 in gps_info:
                lat = convert_to_degrees(gps_info[2])
                lon = convert_to_degrees(gps_info[4])
                
                if gps_info.get(1) == 'S': lat = -lat
                if gps_info.get(3) == 'W': lon = -lon
                
                return f"{lat:.6f}, {lon:.6f}"
        except:
            return None
        return None

    def _check_ai_tags(self, img):
        score = 0
        flags = []
        info = img.info
        ai_keywords = ["stable diffusion", "midjourney", "dall-e", "comfyui", "automatic1111", "parameters"]
        
        for key, value in info.items():
            val_str = str(value).lower()
            if any(k in val_str for k in ai_keywords):
                score = 100
                flags.append(f"Explicit AI Signature found in '{key}' tag")
                
        return score, flags

    def _check_software_tag(self, exif_dict):
        score = 0
        flags = []
        software_found = "None"
        
        if 0 in exif_dict and 305 in exif_dict[0]:
            try:
                software = exif_dict[0][305].decode('utf-8', 'ignore').lower()
                software_found = software 
                
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