import torch
from torchvision import transforms
from torchvision.models import efficientnet_b0
from PIL import Image
import os
import numpy as np

class AIModelLayer:
    def __init__(self):
        self.layer_name = "L5_DeepLearning"
        self.weight = 0.30
        
        # --- SMART HARDWARE DETECTION ---
        self.device = self._get_optimal_device()
        
        self.model = None
        self.initialized = False
        
        self.model_path = os.path.join(os.path.dirname(__file__), "..", "models", "best_efficientnet_b0.pth")
        self._load_model()

    def _get_optimal_device(self):
        """
        Determines the best device, avoiding old GPUs that crash PyTorch.
        """
        if torch.cuda.is_available():
            try:
                # Check Compute Capability
                # Modern PyTorch requires 3.7+. GT 710 is 3.5 (Too old).
                cap = torch.cuda.get_device_capability(0)
                major, minor = cap
                cc = float(f"{major}.{minor}")
                
                if cc < 3.7:
                    print(f"L5: GPU Detected but too old (Compute {cc}). Falling back to CPU.")
                    return "cpu"
                
                print(f"L5: CUDA GPU Verified (Compute {cc}). Using High Performance Mode.")
                return "cuda"
            except:
                # If checking capability fails, play it safe with CPU
                return "cpu"
                
        elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
            print("L5: Apple Silicon MPS Detected")
            return "mps"
            
        print("L5: Running on CPU (Standard Mode)")
        return "cpu"

    def _load_model(self):
        try:
            if not os.path.exists(self.model_path):
                print(f"L5 Warning: Model not found at {self.model_path}")
                return

            self.model = efficientnet_b0(weights=None)
            in_features = self.model.classifier[1].in_features
            self.model.classifier[1] = torch.nn.Linear(in_features, 2)
            
            # Load & Fix Keys
            checkpoint = torch.load(self.model_path, map_location=self.device)
            state_dict = checkpoint.get('model_state_dict', checkpoint)
            
            new_state_dict = {}
            for key, value in state_dict.items():
                new_key = key.replace("classifier.1.1.", "classifier.1.")
                new_state_dict[new_key] = value
            
            self.model.load_state_dict(new_state_dict, strict=False)
            self.model.to(self.device)
            self.model.eval()
            self.initialized = True
            print("L5: EfficientNet-B0 Loaded & Patched")

        except RuntimeError as e:
            if "CUDA" in str(e):
                print("L5: GPU Memory/Kernel Error during load. Switching to CPU.")
                self.device = "cpu"
                self._load_model() # Retry on CPU
            else:
                print(f"L5 Init Error: {e}")

    def analyze(self, image_path):
        if not self.initialized:
            return {"layer_name": self.layer_name, "score": 0, "verdict": "Skipped", "flags": [], "details": {}}

        try:
            return self._perform_inference(image_path)
        except RuntimeError as e:
            if "CUDA" in str(e):
                print("L5: GPU Crash detected during inference. Switching to CPU for stability.")
                self.device = "cpu"
                self.model.to("cpu")
                return self._perform_inference(image_path) # Retry
            else:
                print(f"L5 Error: {e}")
                return {"layer_name": self.layer_name, "score": 0, "verdict": "Error", "flags": [], "details": {}}
    
    def _perform_inference(self, image_path):
        img = Image.open(image_path).convert("RGB")
        w, h = img.size
        
        patches = []
        normalize = transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        to_tensor = transforms.ToTensor()
        
        # Patch Strategy
        if w > 1000 or h > 1000:
            crop_size = 224
            coords = [
                ((h - crop_size)//2, (w - crop_size)//2), # Center
                (0, 0), (0, w - crop_size), # Top Corners
                (h - crop_size, 0), (h - crop_size, w - crop_size) # Bottom Corners
            ]
            for (y, x) in coords:
                patch = img.crop((x, y, x + crop_size, y + crop_size))
                patches.append(normalize(to_tensor(patch)))
        else:
            resize_t = transforms.Resize((224, 224))
            patches.append(normalize(to_tensor(resize_t(img))))

        batch_t = torch.stack(patches).to(self.device)
        
        with torch.no_grad():
            outputs = self.model(batch_t)
            probs = torch.softmax(outputs, dim=1)
            
            ai_probs = probs[:, 0].cpu().numpy()
            avg_ai_prob = float(np.mean(ai_probs))
            max_ai_prob = float(np.max(ai_probs))

        final_prob = (avg_ai_prob + max_ai_prob) / 2
        score = int(final_prob * 100)
        
        flags = []
        if score > 50:
            flags.append(f"AI Detected in {len(patches)} zones (Prob: {final_prob:.2f})")

        return {
            "layer_name": self.layer_name,
            "score": score,
            "verdict": "AI Generated" if score > 50 else "Real",
            "flags": flags,
            "details": {
                "ai_probability": f"{final_prob:.4f}",
                "scan_method": f"{len(patches)}-Patch Analysis",
                "device": self.device
            }
        }