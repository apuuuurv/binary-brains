from deepface import DeepFace
import numpy as np
from scipy.spatial import distance
from fastapi import HTTPException
import os

class FaceService:
    @staticmethod
    def get_face_embedding(image_path: str):
        """Extracts face embedding from an image using DeepFace."""
        try:
            # Enforce face detection and extraction
            # deepface represent returns a list of dictionaries for each face detected
            resp = DeepFace.represent(img_path=image_path, model_name="Facenet", enforce_detection=True)
            
            if not resp or len(resp) == 0:
                raise HTTPException(status_code=400, detail="No face detected in the image.")
            
            if len(resp) > 1:
                raise HTTPException(status_code=400, detail="Multiple faces detected. Please upload an image with only your face.")
            
            return resp[0]["embedding"]
            
        except ValueError as e:
            if "Face could not be detected" in str(e):
                raise HTTPException(status_code=400, detail="No face detected in the image.")
            raise HTTPException(status_code=500, detail=f"Face processing error: {str(e)}")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Face processing error: {str(e)}")

    @staticmethod
    def is_duplicate(new_embedding, all_farmers, current_user_id, threshold=10.0):
        """Compares the new embedding against all existing ones using Euclidean distance."""
        # Facenet typically uses a threshold near 10 for euclidean distance, depending on metric.
        # Alternatively we can use cosine distance which has a threshold of 0.40. Let's stick with Euclidean < 10 or Cosine < 0.4
        new_vec = np.array(new_embedding)
        
        for farmer in all_farmers:
            # Skip the current user (if they are updating their own profile)
            if str(farmer.get("_id")) == str(current_user_id):
                continue
            
            stored_embedding = farmer.get("face_embedding")
            if stored_embedding:
                stored_vec = np.array(stored_embedding)
                # Cosine distance
                dist = distance.cosine(new_vec, stored_vec)
                # For Facenet, cosine distance threshold is typically 0.40
                if dist < 0.40:
                    return True
        return False
