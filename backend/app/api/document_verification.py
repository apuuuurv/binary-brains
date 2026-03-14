from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
import os
import uuid
import shutil
from app.core.security import get_current_user
from app.core.database import get_db
from bson import ObjectId

router = APIRouter(prefix="/verify", tags=["Document Verification"])

# Ensure the uploads directory exists
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def _process_and_verify(file: UploadFile, doc_type: str, current_user: dict):
    db = get_db()
    
    # 1. Validate file type
    allowed_types = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDFs and Images allowed.")
    
    # 2. Secure filename
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{current_user['_id']}_{doc_type}_{uuid.uuid4().hex[:8]}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 3. OCR Verification Pipeline - call the engine directly to get full structured result
        from app.ml.ocr.ocr_engine_v2 import OCREngineV2
        engine = OCREngineV2()
        engine_v2_res = engine.verify_document(file_path, doc_type)

        # Remove the file locally after processing to save space (Security/Cleanup)
        if os.path.exists(file_path):
            os.remove(file_path)

        if not engine_v2_res.get("is_valid"):
            raise HTTPException(status_code=400, detail=engine_v2_res.get("error", "Document verification failed. Please try a clearer image."))
            
        extracted_data = engine_v2_res.get("extracted_data", {}) or {}
        extracted_id = engine_v2_res.get("extracted_id")

        return extracted_id, extracted_data
        
    except HTTPException:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")


@router.post("/aadhaar")
async def verify_aadhaar(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    extracted_id, extracted_data = await _process_and_verify(file, "aadhar", current_user)
    
    db = get_db()
    update_data = {
        "is_aadhar_verified": True,
        "aadhar_number": extracted_id,
        "aadhaar_data": extracted_data,
        "verification_status": "verified"
    }
    
    await db["farmers"].update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": update_data}
    )
    
    return {"message": "Aadhaar verified successfully", "extracted_id": extracted_id, "data": extracted_data}


@router.post("/pan")
async def verify_pan(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    extracted_id, extracted_data = await _process_and_verify(file, "pan", current_user)
    
    db = get_db()
    update_data = {
        "is_pan_verified": True,
        "pan_number": extracted_id,
        "pan_data": extracted_data
    }
    
    await db["farmers"].update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": update_data}
    )
    
    return {"message": "PAN verified successfully", "extracted_id": extracted_id, "data": extracted_data}


@router.post("/land-document")
async def verify_land_doc(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    extracted_id, extracted_data = await _process_and_verify(file, "land_document", current_user)
    
    db = get_db()
    
    # Check if a custom document string was uploaded (usually state specific)
    doc_str = f"landownership:OCR_Verified_{extracted_id}"
    
    update_data = {
        "land_document_data": extracted_data
    }
    
    await db["farmers"].update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": update_data, "$addToSet": {"documents_uploaded": doc_str}}
    )
    
    return {"message": "Land document verified successfully", "extracted_id": extracted_id, "data": extracted_data}
