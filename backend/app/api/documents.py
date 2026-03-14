from fastapi import APIRouter, UploadFile, File
import shutil

from app.ml.ocr.document_pipeline import DocumentPipeline

router = APIRouter(prefix="/documents", tags=["Documents"])

pipeline = DocumentPipeline()


@router.post("/verify")
async def verify_document(file: UploadFile = File(...)):

    file_path = f"temp_{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Pass "unknown" as the second argument to match the signature in DocumentPipeline
    result = pipeline.process_document(file_path, "unknown")

    return result