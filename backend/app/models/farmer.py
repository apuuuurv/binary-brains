from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import List, Optional
import re


class SchemeRecommendation(BaseModel):
    scheme_id: str
    scheme_name: str
    success_probability: float
    explanation: List[str] = []
    predicted_financial_value: int = 0
    benefit_type: str = ""
    prediction_explanation: str = ""
    # For the Apply Modal — documents to gather and step-by-step application guide
    documents_required: Optional[List[str]] = []
    application_process: Optional[List[str]] = []


class IneligibleScheme(BaseModel):
    scheme_id: str
    scheme_name: str
    explanation: List[str] = []


class PredictiveAlert(BaseModel):
    alert_type: str = Field(description="e.g., 'weather_risk', 'pest_warning'")
    severity: str = Field(description="'low', 'medium', 'high', 'critical'")
    message: str = Field(description="Detailed alert message")
    timestamp: str = Field(description="When this alert was generated")
    recommended_action: Optional[str] = Field(None, description="What the farmer should do")


class SchemeBundle(BaseModel):
    bundle_id: str
    total_benefit_value: int = 0
    total_benefit: str = ""
    schemes: List[SchemeRecommendation] = []
    graph_explanation: str = ""


class FarmerProfile(BaseModel):
    # Basic Info (Required immediately)
    full_name: str = Field(..., example="Ramesh Kumar")
    email: EmailStr = Field(..., example="ramesh@example.com")
    
    # Everything below is Optional (Filled out later!)
    phone_number: Optional[str] = Field(None, example="+919876543210")
    age: Optional[int] = Field(None, ge=18)
    gender: Optional[str] = Field(None, example="Male")
    category: Optional[str] = Field(None, example="OBC")
    is_differently_abled: Optional[bool] = Field(default=False)
    highest_qualification: Optional[str] = Field(None, example="10th Pass")
    
    # Contact & Location
    state: Optional[str] = Field(None, example="Maharashtra")
    district: Optional[str] = Field(None, example="Pune")
    pincode: Optional[str] = Field(None, example="411001")
    
    # Identity & Financial
    is_verified: Optional[bool] = Field(default=False, description="Whether the farmer is verified to post stories")
    aadhar_number: Optional[str] = Field(None, example="123456789012")
    pan_number: Optional[str] = Field(None, example="ABCDE1234F")
    is_aadhar_verified: bool = Field(default=False)
    is_pan_verified: bool = Field(default=False)
    annual_income: Optional[float] = Field(None, example=60000.0)
    bank_account_linked: Optional[bool] = Field(default=False)
    
    # Agricultural Data
    land_size_hectares: Optional[float] = Field(None, example=1.5)
    farmer_type: Optional[str] = Field(None, example="Small")
    irrigation_type: Optional[str] = Field(None, example="Rainfed")
    soil_type: Optional[str] = Field(None, example="Alluvial")
    crop_season: Optional[str] = Field(None, example="Kharif")
    water_source: Optional[str] = Field(None, example="Well")
    land_ownership: Optional[str] = Field(None, example="Owned")
    primary_crops: List[str] = Field(default=[])
    preferred_language: str = Field(default="en", description="User's preferred UI language")
    role: str = Field(default="farmer", description="User role: farmer or admin")
    
    # ML specific fields
    crop: Optional[str] = Field(None, example="Rice")
    temperature: Optional[float] = Field(None, example=28.5)
    rainfall: Optional[float] = Field(None, example=1200.0)
    soil: Optional[str] = Field(None, example="Loamy")
    season: Optional[str] = Field(None, example="Kharif")
    
    documents_uploaded: List[str] = Field(default=[])
    face_embedding: Optional[List[float]] = Field(None, description="128D face embedding for duplicate check")
    
    # OCR Extracted structured data
    aadhaar_data: Optional[dict] = Field(default=None)
    pan_data: Optional[dict] = Field(default=None)
    land_document_data: Optional[dict] = Field(default=None)
    verification_status: str = Field(default="pending")

    @field_validator("aadhar_number")
    @classmethod
    def validate_aadhar(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return v
        # Accept masked format stored by OCR verification (XXXX-XXXX-1234)
        if re.match(r"^XXXX-XXXX-\d{4}$", v):
            return v
        # Remove spaces for raw 12-digit input
        v = v.replace(" ", "").replace("-", "")
        if not re.match(r"^\d{12}$", v):
            raise ValueError("Aadhaar number must be exactly 12 digits")
        return v

    @field_validator("pan_number")
    @classmethod
    def validate_pan(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return v
        # Accept placeholder stored when OCR could not extract PAN
        if v == "PAN_DOC":
            return v
        v = v.upper()
        if not re.match(r"^[A-Z]{5}[0-9]{4}[A-Z]$", v):
            raise ValueError("Invalid PAN card format (e.g., ABCDE1234F)")
        return v


class FarmerDB(FarmerProfile):
    hashed_password: str


class FarmerResponse(FarmerProfile):
    id: str = Field(..., alias="_id")
    recommended_schemes: Optional[List[SchemeRecommendation]] = []
    recommended_bundles: Optional[List[SchemeBundle]] = []
    ineligible_schemes: Optional[List[IneligibleScheme]] = []
    predictive_alerts: Optional[List[PredictiveAlert]] = []

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "full_name": "Ramesh Kumar",
                "email": "ramesh@example.com",
                "_id": "507f1f77bcf86cd799439011"
            }
        }
    }


# --- AUTH MODELS ---

class FarmerSignup(BaseModel):
    # Strictly just the essentials for creating an account
    full_name: str = Field(..., example="Ramesh Kumar")
    email: EmailStr = Field(..., example="ramesh@example.com")
    password: str = Field(..., example="SecurePassword123!")


class Token(BaseModel):
    access_token: str
    token_type: str
