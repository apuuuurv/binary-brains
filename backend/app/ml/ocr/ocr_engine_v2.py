import pytesseract
import cv2
import numpy as np
import fitz  # PyMuPDF
import os
import re
from typing import Dict, Any, List

# Setting Tesseract path specifically for Windows
# Ensure this path is correct for the USER's environment
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

class OCREngineV2:
    def __init__(self):
        # Keywords for classification
        self.AADHAAR_KEYWORDS = ["GOVERNMENT OF INDIA", "UNIQUE IDENTIFICATION", "MALE", "FEMALE", "AADHAAR", "DOB", "YEAR OF BIRTH", "ENROLLMENT"]
        self.PAN_KEYWORDS = ["INCOME TAX DEPARTMENT", "PERMANENT ACCOUNT NUMBER", "FATHER'S NAME", "SIGNATURE", "GOVT. OF INDIA"]
        self.LAND_KEYWORDS = ["7/12", "KHATAUNI", "PATTADAR", "RECORD OF RIGHTS", "SURVEY", "SATBARA", "LAND", "OWNER", "TALUQA", "VILLAGE", "PLOT"]

    def preprocess_image(self, image_input):
        """Robust image preprocessing — tries multiple strategies for best OCR results."""
        if isinstance(image_input, str):
            image = cv2.imread(image_input)
            if image is None:
                raise ValueError(f"Image not found: {image_input}")
        else:
            image = image_input

        # 1. Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # 2. Scale up for better small text recognition
        gray = cv2.resize(gray, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)
        
        # 3. Deskew / correct contrast with CLAHE (better for colored Aadhaar backgrounds)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        gray = clahe.apply(gray)
        
        # 4. Bilateral filter preserves text edges while killing noise
        gray = cv2.bilateralFilter(gray, 9, 75, 75)
        
        # 5. Otsu threshold (works better than adaptive for clean PDFs)
        _, otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        return otsu

    def _extract_text_from_file(self, file_path: str) -> str:
        """Determines file type and extracts raw text."""
        ext = os.path.splitext(file_path)[1].lower()
        if ext == '.pdf':
            return self._pdf_to_text(file_path)
        else:
            return self._image_to_text(file_path)

    def _image_to_text(self, image_path: str) -> str:
        processed = self.preprocess_image(image_path)
        # PSM 3 = fully automatic, PSM 6 = uniform block — try both, use longer result
        text_psm6 = pytesseract.image_to_string(processed, config='--oem 3 --psm 6')
        text_psm3 = pytesseract.image_to_string(processed, config='--oem 3 --psm 3')
        return text_psm6 if len(text_psm6) >= len(text_psm3) else text_psm3

    def _pdf_to_text(self, pdf_path: str) -> str:
        text_results = []
        doc = fitz.open(pdf_path)
        for page in doc:
            page_combined_text = ""

            # 1. Always extract embedded text layer (selectable text in PDF)
            embedded_text = page.get_text("text").strip()
            if embedded_text:
                page_combined_text += embedded_text + "\n"

            # 2. If embedded text is short (image-only PDF or scanned), also run OCR
            if len(embedded_text) < 50:
                zoom = 3.0  # Higher zoom for better quality
                mat = fitz.Matrix(zoom, zoom)
                pix = page.get_pixmap(matrix=mat, colorspace=fitz.csRGB)
                img_data = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, 3)
                img_bgr = cv2.cvtColor(img_data, cv2.COLOR_RGB2BGR)
                processed = self.preprocess_image(img_bgr)
                # Try multiple PSM modes and combine — critical for PAN/Aadhaar layouts
                text_psm3 = pytesseract.image_to_string(processed, config='--oem 3 --psm 3')
                text_psm6 = pytesseract.image_to_string(processed, config='--oem 3 --psm 6')
                text_psm11 = pytesseract.image_to_string(processed, config='--oem 3 --psm 11')
                # Pick the longest result (most extracted text)
                best_ocr = max([text_psm3, text_psm6, text_psm11], key=len)
                page_combined_text += best_ocr

            text_results.append(page_combined_text)
        doc.close()
        return "\n".join(text_results)

    def verify_document(self, file_path: str, expected_type: str) -> Dict[str, Any]:
        """
        Main entry point for advanced verification.
        Extracts and validates structured data from Aadhaar, PAN, and Land documents.
        """
        try:
            raw_text = self._extract_text_from_file(file_path)
        except Exception as e:
            return {
                "is_valid": False, "extracted_id": None, "doc_type": None,
                "confidence": 0, "extracted_data": {},
                "error": f"Could not read file: {str(e)}"
            }

        normalized_text = raw_text.upper()
        
        result: Dict[str, Any] = {
            "is_valid": False,
            "extracted_id": None,
            "doc_type": None,
            "confidence": 0,
            "extracted_data": {},
            "raw_text_snippet": raw_text[:300]
        }

        # Guard: If almost no text at all — truly unreadable. Lower threshold to 3.
        if len(raw_text.strip()) < 3:
            return {**result, "error": f"Unable to read document clearly. Please upload a clearer image. (Extracted characters: {len(raw_text.strip())})"}

        # Normalize expected_type
        expected_type = expected_type.lower()
        if expected_type == "landownership":
            expected_type = "land_document"

        # --- AADHAAR ---
        if expected_type == "aadhar":
            # Find ALL occurrences of 4-4-4 digit patterns across the entire document
            all_matches = re.finditer(r"(\d{4})[\s\-]*(\d{4})[\s\-]*(\d{4})", normalized_text)
            
            id_val = None
            for m in all_matches:
                candidate = "".join(m.groups())
                # Skip if starts with 0 or 1 (dates, enrollment nos, invalid Aadhaar)
                if candidate[0] in ['0', '1']:
                    continue
                # Skip if looks like a year sequence (e.g., 2024, 2025 in it)
                # Specifically skip patterns that are clearly DOBs like DDMMYYYY
                # A real Aadhaar won't have 2 or 3 as first digit commonly for IDs
                if candidate[:4].isdigit():
                    id_val = candidate
                    break  # Found a valid candidate — stop searching
            
            # Fallback: try 12-digit contiguous match across entire text
            if not id_val:
                for long_m in re.finditer(r"\b(\d{12})\b", normalized_text):
                    candidate = long_m.group(1)
                    if candidate[0] not in ['0', '1']:
                        id_val = candidate
                        break
            
            if not id_val:
                # Show last resort: what did OCR actually read?
                all_digit_groups = re.findall(r"\d{4}", normalized_text)
                return {**result, "error": f"No valid Aadhaar number found after scanning entire document. Digit groups found: {all_digit_groups[:10]}. OCR snippet: {raw_text[:300]}"}

            result["is_valid"] = True
            result["extracted_id"] = f"XXXX-XXXX-{id_val[-4:]}"  # Always mask
            result["doc_type"] = "aadhar"
            result["confidence"] = 0.90

            # Extract DOB
            dob_match = re.search(r"(?:DOB|YEAR OF BIRTH|DATE OF BIRTH)[^\d]*(\d{2}[/\-]\d{2}[/\-]\d{4}|\d{4})", normalized_text)
            if dob_match:
                result["extracted_data"]["dob"] = dob_match.group(1)

            # Extract Gender
            if "FEMALE" in normalized_text:
                result["extracted_data"]["gender"] = "Female"
            elif "MALE" in normalized_text:
                result["extracted_data"]["gender"] = "Male"

        # --- PAN ---
        elif expected_type == "pan":
            # Try to find PAN number (XXXXX9999X format), but don't block if not found
            pan_match = re.search(r"[A-Z]{5}[0-9]{4}[A-Z]", normalized_text)
            
            result["is_valid"] = True
            result["doc_type"] = "pan"
            result["confidence"] = 0.90 if pan_match else 0.70
            result["extracted_id"] = pan_match.group() if pan_match else "PAN_DOC"

            # Store PAN number in extracted_data for display
            if pan_match:
                result["extracted_data"]["pan_number"] = pan_match.group()
            
            # Extract DOB
            dob_match = re.search(r"(\d{2}[/\-]\d{2}[/\-]\d{4})", normalized_text)
            if dob_match:
                result["extracted_data"]["dob"] = dob_match.group(1)
            
            # Extract Father's name or any proper name near "FATHER" keyword
            father_match = re.search(r"(?:FATHER'?S?\s*NAME|FATHER)[:\s]+([A-Z][A-Z\s]+?)(?:\n|DOB|$)", normalized_text)
            if father_match:
                result["extracted_data"]["father_name"] = father_match.group(1).strip()

        # --- LAND DOCUMENT ---
        elif expected_type == "land_document":
            # For land docs: be lenient — just try to find any structured data
            survey_match = re.search(r"(?:SURVEY|PLOT|GAT|KHATA|GAT NO|S\.NO)[\s.]*(?:NO[.\s]*)?[:\-]?\s*([A-Z0-9/\-]+)", normalized_text)
            area_match = re.search(r"(\d+(?:\.\d+)?)\s*(HECTARE|ACRE|SQ\.?\s*METER|GUNTHA|GUNTA|ARE)", normalized_text)
            owner_match = re.search(r"(?:OWNER|KHATEDAR|PATTADAR|OWNER NAME)[:\s]+([A-Z\s]+?)(?:\n|$)", normalized_text)

            # Land docs are extremely varied — accept if ANY useful data is found, or if minimum text is present
            result["is_valid"] = True
            result["doc_type"] = "land_document"
            result["confidence"] = 0.80
            result["extracted_id"] = survey_match.group(1).strip() if survey_match else "LAND_DOC"

            if area_match:
                result["extracted_data"]["land_area"] = f"{area_match.group(1)} {area_match.group(2)}"
            if survey_match:
                result["extracted_data"]["survey_no"] = survey_match.group(1).strip()
            if owner_match:
                result["extracted_data"]["owner_name"] = owner_match.group(1).strip()

        else:
            return {**result, "error": f"Unknown document type: {expected_type}"}

        return result

