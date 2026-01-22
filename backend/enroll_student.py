from face_service import face_service
from database import update_student_face, supabase
import os

def enroll_student(roll_no, image_path):
    if not os.path.exists(image_path):
        print(f"Error: Image {image_path} not found.")
        return

    print(f"Generating embedding for Roll No {roll_no} from {image_path}...")
    embedding = face_service.generate_embedding(image_path)
    
    if embedding:
        print(f"Embedding generated. Updating database...")
        # Ensure roll_no is 3 digits (e.g. 30 -> 030) to match seed data
        formatted_roll = f"{int(roll_no):03}"
        print(f"Updating for Roll No: {formatted_roll} (Input: {roll_no})")
        
        # 1. Update database with embedding
        success = update_student_face(formatted_roll, embedding)
        
        if success:
            print(f"Successfully updated embedding in database.")
            
            # 2. Upload to Supabase Storage
            try:
                BUCKET_NAME = "student_faces"
                BASE_PATH = "COMPUTER/TE 2025-26/A"
                supabase_path = f"{BASE_PATH}/{formatted_roll}/{formatted_roll}.jpg"
                
                with open(image_path, 'rb') as f:
                    supabase.storage.from_(BUCKET_NAME).upload(
                        path=supabase_path,
                        file=f,
                        file_options={"content-type": "image/jpeg", "x-upsert": "true"}
                    )
                print(f"Successfully uploaded photo to Supabase Storage at {supabase_path}")
            except Exception as e:
                print(f"Error uploading photo to Supabase: {e}")
                
            print(f"Enrollment complete for student {formatted_roll}.")
        else:
            print(f"Failed to update database for student {formatted_roll}.")
    else:
        print(f"Failed to generate embedding (no face detected?).")

if __name__ == "__main__":
    # Ensure the directory exists
    os.makedirs("student_faces", exist_ok=True)
    
    # Path to the image
    image_path = os.path.join("student_faces", "30.jpg")
    
    # Pass 30, logic will format it to 030
    enroll_student(30, image_path)
