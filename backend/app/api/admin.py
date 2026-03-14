# backend/app/api/admin.py
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.scheme import Scheme
from app.core.database import get_db
from app.core.security import get_current_admin
from bson import ObjectId

router = APIRouter(tags=["Admin"])

@router.post("/schemes/add", status_code=status.HTTP_201_CREATED)
async def add_scheme(scheme: Scheme, admin: dict = Depends(get_current_admin)):
    """
    Manually add a new agricultural scheme. 
    Only accessible by users with the 'admin' role.
    """
    db = get_db()
    
    # Check for duplicate scheme name
    existing = await db["schemes"].find_one({"scheme_name": scheme.scheme_name})
    if existing:
        raise HTTPException(
            status_code=400, 
            detail=f"A scheme with the name '{scheme.scheme_name}' already exists."
        )
    
    scheme_dict = scheme.model_dump()
    result = await db["schemes"].insert_one(scheme_dict)
    
    return {
        "message": "Scheme integrated successfully",
        "scheme_id": str(result.inserted_id),
        "scheme_name": scheme.scheme_name
    }

@router.get("/check-admin")
async def check_admin_status(admin: dict = Depends(get_current_admin)):
    """
    Simple endpoint to verify if the requester has admin privileges.
    """
    return {"is_admin": True, "admin_user": admin["full_name"]}
