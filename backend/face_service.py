import cv2
import numpy as np
import base64
import json
from deepface import DeepFace
from database import get_student_embeddings

MODEL_NAME = "ArcFace"
DETECTOR_BACKEND = "fastmtcnn"
DISTANCE_METRIC = "cosine"
THRESHOLD = 0.65


class FaceRecognitionService:
    def __init__(self):
        self.known_embeddings = {}
        print("Loading AI Models (ArcFace)...")
        DeepFace.build_model(MODEL_NAME)
        print("AI Models Loaded.")

    # LOAD STUDENTS DATA
    def load_class_data(self, session_id, division):

        if session_id in self.known_embeddings:
            return

        students = get_student_embeddings(division)

        processed_students = []

        for student in students:

            if student['face_descriptor']:

                emb = student['face_descriptor']

                if isinstance(emb, str):
                    try:
                        emb = json.loads(emb)
                    except:
                        continue

                processed_students.append({
                    "id": student['id'],
                    "name": student['name'],
                    "roll_no": student['roll_no'],
                    "embedding": emb
                })

        self.known_embeddings[session_id] = processed_students


    # PROCESS CAMERA FRAME
    def process_frame(self, session_id, base64_image):

        try:

            encoded_data = base64_image.split(',')[1]
            nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            results = DeepFace.represent(
                img_path=img,
                model_name=MODEL_NAME,
                detector_backend=DETECTOR_BACKEND,
                enforce_detection=False,
                align=True
            )

            if not results:
                return None

            face_data = results[0]

            target_embedding = face_data["embedding"]
            facial_area = face_data["facial_area"]

            img_h, img_w = img.shape[:2]

            normalized_facial_area = {
                "x": facial_area["x"] / img_w,
                "y": facial_area["y"] / img_h,
                "w": facial_area["w"] / img_w,
                "h": facial_area["h"] / img_h
            }

            students = self.known_embeddings.get(session_id, [])

            if not students:
                return {"match": None, "facial_area": normalized_facial_area}

            embeddings = np.array([s["embedding"] for s in students])
            target = np.array(target_embedding)

            dot_product = np.dot(embeddings, target)
            norms = np.linalg.norm(embeddings, axis=1) * np.linalg.norm(target)

            distances = 1 - (dot_product / norms)

            min_idx = np.argmin(distances)

            if distances[min_idx] < THRESHOLD:

                return {
                    "match": students[min_idx],
                    "facial_area": normalized_facial_area
                }

            return {"match": None, "facial_area": normalized_facial_area}

        except Exception as e:
            print("Frame error:", e)
            return None


    # GENERATE EMBEDDING WHEN REGISTERING STUDENT
    def generate_embedding(self, img_path):

        try:

            results = DeepFace.represent(
                img_path=img_path,
                model_name=MODEL_NAME,
                detector_backend=DETECTOR_BACKEND,
                enforce_detection=True,
                align=True
            )

            if results:
                return results[0]["embedding"]

        except Exception as e:
            print("Embedding error:", e)

        return None


    def cleanup_session(self, session_id):

        if session_id in self.known_embeddings:
            del self.known_embeddings[session_id]


face_service = FaceRecognitionService()