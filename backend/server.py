from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import re
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'pmr-education-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# LLM Configuration
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Create the main app
app = FastAPI(title="PMR Education Platform API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# ==================== MODELS ====================

class UserRole:
    ADMIN = "admin"
    EDITOR = "editor"
    STUDENT = "student"

class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str = UserRole.STUDENT

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: str = UserRole.STUDENT

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    role: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    icon: Optional[str] = "folder"
    order: Optional[int] = 0

class CategoryResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    description: str
    icon: str
    order: int
    disease_count: int = 0

class DiseaseCreate(BaseModel):
    name: str
    category_id: str
    tags: List[str] = []
    definition: str = ""
    epidemiology: str = ""
    pathophysiology: str = ""
    biomechanics: str = ""
    clinical_presentation: str = ""
    physical_examination: str = ""
    imaging_findings: str = ""
    differential_diagnosis: str = ""
    treatment_conservative: str = ""
    treatment_interventional: str = ""
    treatment_surgical: str = ""
    rehabilitation_protocol: str = ""
    prognosis: str = ""
    references: List[str] = []
    images: List[str] = []
    # Section-specific media
    definition_media: List[Dict[str, Any]] = []
    epidemiology_media: List[Dict[str, Any]] = []
    pathophysiology_media: List[Dict[str, Any]] = []
    biomechanics_media: List[Dict[str, Any]] = []
    clinical_presentation_media: List[Dict[str, Any]] = []
    physical_examination_media: List[Dict[str, Any]] = []
    imaging_findings_media: List[Dict[str, Any]] = []
    differential_diagnosis_media: List[Dict[str, Any]] = []
    treatment_conservative_media: List[Dict[str, Any]] = []
    treatment_interventional_media: List[Dict[str, Any]] = []
    treatment_surgical_media: List[Dict[str, Any]] = []
    rehabilitation_protocol_media: List[Dict[str, Any]] = []
    prognosis_media: List[Dict[str, Any]] = []
    references_media: List[Dict[str, Any]] = []

class DiseaseUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[str] = None
    tags: Optional[List[str]] = None
    definition: Optional[str] = None
    epidemiology: Optional[str] = None
    pathophysiology: Optional[str] = None
    biomechanics: Optional[str] = None
    clinical_presentation: Optional[str] = None
    physical_examination: Optional[str] = None
    imaging_findings: Optional[str] = None
    differential_diagnosis: Optional[str] = None
    treatment_conservative: Optional[str] = None
    treatment_interventional: Optional[str] = None
    treatment_surgical: Optional[str] = None
    rehabilitation_protocol: Optional[str] = None
    prognosis: Optional[str] = None
    references: Optional[List[str]] = None
    images: Optional[List[str]] = None
    # Section-specific media
    definition_media: Optional[List[Dict[str, Any]]] = None
    epidemiology_media: Optional[List[Dict[str, Any]]] = None
    pathophysiology_media: Optional[List[Dict[str, Any]]] = None
    biomechanics_media: Optional[List[Dict[str, Any]]] = None
    clinical_presentation_media: Optional[List[Dict[str, Any]]] = None
    physical_examination_media: Optional[List[Dict[str, Any]]] = None
    imaging_findings_media: Optional[List[Dict[str, Any]]] = None
    differential_diagnosis_media: Optional[List[Dict[str, Any]]] = None
    treatment_conservative_media: Optional[List[Dict[str, Any]]] = None
    treatment_interventional_media: Optional[List[Dict[str, Any]]] = None
    treatment_surgical_media: Optional[List[Dict[str, Any]]] = None
    rehabilitation_protocol_media: Optional[List[Dict[str, Any]]] = None
    prognosis_media: Optional[List[Dict[str, Any]]] = None
    references_media: Optional[List[Dict[str, Any]]] = None

class DiseaseResponse(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: str
    name: str
    category_id: str
    category_name: str = ""
    tags: List[str]
    definition: str
    epidemiology: str
    pathophysiology: str
    biomechanics: str
    clinical_presentation: str
    physical_examination: str
    imaging_findings: str
    differential_diagnosis: str
    treatment_conservative: str
    treatment_interventional: str
    treatment_surgical: str
    rehabilitation_protocol: str
    prognosis: str
    references: List[str]
    images: List[str]
    created_at: str
    updated_at: str
    created_by: str = ""
    version: int = 1
    # Translated fields (optional - dynamically added)
    name_pt: Optional[str] = None
    name_es: Optional[str] = None
    definition_pt: Optional[str] = None
    definition_es: Optional[str] = None
    epidemiology_pt: Optional[str] = None
    epidemiology_es: Optional[str] = None
    pathophysiology_pt: Optional[str] = None
    pathophysiology_es: Optional[str] = None
    biomechanics_pt: Optional[str] = None
    biomechanics_es: Optional[str] = None
    clinical_presentation_pt: Optional[str] = None
    clinical_presentation_es: Optional[str] = None
    physical_examination_pt: Optional[str] = None
    physical_examination_es: Optional[str] = None
    imaging_findings_pt: Optional[str] = None
    imaging_findings_es: Optional[str] = None
    differential_diagnosis_pt: Optional[str] = None
    differential_diagnosis_es: Optional[str] = None
    treatment_conservative_pt: Optional[str] = None
    treatment_conservative_es: Optional[str] = None
    treatment_interventional_pt: Optional[str] = None
    treatment_interventional_es: Optional[str] = None
    treatment_surgical_pt: Optional[str] = None
    treatment_surgical_es: Optional[str] = None
    rehabilitation_protocol_pt: Optional[str] = None
    rehabilitation_protocol_es: Optional[str] = None
    prognosis_pt: Optional[str] = None
    prognosis_es: Optional[str] = None

class BookmarkCreate(BaseModel):
    disease_id: str

class BookmarkResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    disease_id: str
    disease_name: str = ""
    created_at: str

class NoteCreate(BaseModel):
    disease_id: str
    content: str

class NoteUpdate(BaseModel):
    content: str

class NoteResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    disease_id: str
    disease_name: str = ""
    content: str
    created_at: str
    updated_at: str

class RecentViewResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    disease_id: str
    disease_name: str
    viewed_at: str

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def require_role(roles: List[str]):
    async def role_checker(user: dict = Depends(get_current_user)):
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password": hash_password(user_data.password),
        "role": user_data.role,
        "created_at": now,
        "email_verified": False
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, user_data.email, user_data.role)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            name=user_data.name,
            role=user_data.role,
            created_at=now
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["email"], user["role"])
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            role=user["role"],
            created_at=user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        created_at=user["created_at"]
    )

# ==================== CATEGORY ROUTES ====================

@api_router.get("/categories", response_model=List[CategoryResponse])
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    
    # Count diseases for each category
    for cat in categories:
        count = await db.diseases.count_documents({"category_id": cat["id"]})
        cat["disease_count"] = count
    
    return categories

@api_router.post("/categories", response_model=CategoryResponse)
async def create_category(
    category: CategoryCreate,
    user: dict = Depends(get_current_user)
):
    if user["role"] not in [UserRole.ADMIN, UserRole.EDITOR]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    cat_id = str(uuid.uuid4())
    cat_doc = {
        "id": cat_id,
        "name": category.name,
        "description": category.description or "",
        "icon": category.icon or "folder",
        "order": category.order or 0
    }
    
    await db.categories.insert_one(cat_doc)
    cat_doc["disease_count"] = 0
    return cat_doc

class CategoryOrderUpdate(BaseModel):
    category_ids: List[str]

@api_router.put("/categories/reorder")
async def reorder_categories(
    order_update: CategoryOrderUpdate,
    user: dict = Depends(get_current_user)
):
    """Update the order of categories (admin only)"""
    if user["role"] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can reorder categories")
    
    # Update order for each category
    for index, cat_id in enumerate(order_update.category_ids):
        await db.categories.update_one(
            {"id": cat_id},
            {"$set": {"order": index}}
        )
    
    return {"message": "Categories reordered", "new_order": order_update.category_ids}

@api_router.put("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: str,
    category: CategoryCreate,
    user: dict = Depends(get_current_user)
):
    if user["role"] not in [UserRole.ADMIN, UserRole.EDITOR]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    result = await db.categories.update_one(
        {"id": category_id},
        {"$set": {
            "name": category.name,
            "description": category.description or "",
            "icon": category.icon or "folder",
            "order": category.order or 0
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    cat = await db.categories.find_one({"id": category_id}, {"_id": 0})
    count = await db.diseases.count_documents({"category_id": category_id})
    cat["disease_count"] = count
    return cat

@api_router.delete("/categories/{category_id}")
async def delete_category(
    category_id: str,
    user: dict = Depends(get_current_user)
):
    if user["role"] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can delete categories")
    
    # Check if category has diseases
    count = await db.diseases.count_documents({"category_id": category_id})
    if count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete category with diseases")
    
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return {"message": "Category deleted"}

# ==================== DISEASE ROUTES ====================

@api_router.get("/diseases", response_model=List[DiseaseResponse])
async def get_diseases(
    category_id: Optional[str] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None
):
    query = {}
    
    if category_id:
        query["category_id"] = category_id
    if tag:
        query["tags"] = tag
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"definition": {"$regex": search, "$options": "i"}},
            {"clinical_presentation": {"$regex": search, "$options": "i"}}
        ]
    
    diseases = await db.diseases.find(query, {"_id": 0}).sort("name", 1).to_list(1000)
    
    # Add category names
    categories = {c["id"]: c["name"] for c in await db.categories.find({}, {"_id": 0, "id": 1, "name": 1}).to_list(100)}
    for disease in diseases:
        disease["category_name"] = categories.get(disease.get("category_id", ""), "")
    
    return diseases

@api_router.get("/diseases/{disease_id}", response_model=DiseaseResponse)
async def get_disease(disease_id: str):
    disease = await db.diseases.find_one({"id": disease_id}, {"_id": 0})
    if not disease:
        raise HTTPException(status_code=404, detail="Disease not found")
    
    # Get category name
    category = await db.categories.find_one({"id": disease.get("category_id", "")}, {"_id": 0})
    disease["category_name"] = category["name"] if category else ""
    
    return disease

@api_router.post("/diseases", response_model=DiseaseResponse)
async def create_disease(
    disease: DiseaseCreate,
    user: dict = Depends(get_current_user)
):
    if user["role"] not in [UserRole.ADMIN, UserRole.EDITOR]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Verify category exists
    category = await db.categories.find_one({"id": disease.category_id}, {"_id": 0})
    if not category:
        raise HTTPException(status_code=400, detail="Category not found")
    
    disease_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    disease_doc = {
        "id": disease_id,
        **disease.model_dump(),
        "created_at": now,
        "updated_at": now,
        "created_by": user["id"],
        "version": 1
    }
    
    await db.diseases.insert_one(disease_doc)
    
    # Store version history
    await db.disease_versions.insert_one({
        "disease_id": disease_id,
        "version": 1,
        "data": disease_doc,
        "created_by": user["id"],
        "created_at": now
    })
    
    disease_doc["category_name"] = category["name"]
    return disease_doc

@api_router.put("/diseases/{disease_id}", response_model=DiseaseResponse)
async def update_disease(
    disease_id: str,
    disease: DiseaseUpdate,
    user: dict = Depends(get_current_user)
):
    if user["role"] not in [UserRole.ADMIN, UserRole.EDITOR]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    existing = await db.diseases.find_one({"id": disease_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Disease not found")
    
    now = datetime.now(timezone.utc).isoformat()
    update_data = {k: v for k, v in disease.model_dump().items() if v is not None}
    update_data["updated_at"] = now
    update_data["version"] = existing.get("version", 1) + 1
    
    await db.diseases.update_one(
        {"id": disease_id},
        {"$set": update_data}
    )
    
    updated = await db.diseases.find_one({"id": disease_id}, {"_id": 0})
    
    # Store version history
    await db.disease_versions.insert_one({
        "disease_id": disease_id,
        "version": updated["version"],
        "data": updated,
        "created_by": user["id"],
        "created_at": now
    })
    
    # Get category name
    category = await db.categories.find_one({"id": updated.get("category_id", "")}, {"_id": 0})
    updated["category_name"] = category["name"] if category else ""
    
    return updated

@api_router.delete("/diseases/{disease_id}")
async def delete_disease(
    disease_id: str,
    user: dict = Depends(get_current_user)
):
    if user["role"] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can delete diseases")
    
    result = await db.diseases.delete_one({"id": disease_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Disease not found")
    
    # Clean up related data
    await db.bookmarks.delete_many({"disease_id": disease_id})
    await db.notes.delete_many({"disease_id": disease_id})
    await db.recent_views.delete_many({"disease_id": disease_id})
    
    return {"message": "Disease deleted"}

# ==================== INLINE EDITING ROUTES ====================

class InlineSaveRequest(BaseModel):
    """Request model for inline save - single section"""
    language: str = "en"
    section_id: str  # e.g., "definition", "epidemiology"
    content: str  # The content to save

class InlineSaveAndTranslateRequest(BaseModel):
    """Request model for save and translate - single section"""
    source_language: str = "en"
    section_id: str  # e.g., "definition", "epidemiology"
    content: str  # The content to save
    target_languages: List[str] = ["pt", "es"]

# Legacy support for bulk editing
class InlineSaveBulkRequest(BaseModel):
    """Request model for bulk inline save"""
    language: str = "en"
    fields: Dict[str, str]  # field_name -> content

@api_router.put("/diseases/{disease_id}/inline-save")
async def inline_save_single_language(
    disease_id: str,
    request: InlineSaveRequest,
    user: dict = Depends(get_current_user)
):
    """Save disease content for a single language only"""
    if user["role"] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can edit diseases")
    
    disease = await db.diseases.find_one({"id": disease_id}, {"_id": 0})
    if not disease:
        raise HTTPException(status_code=404, detail="Disease not found")
    
    now = datetime.now(timezone.utc).isoformat()
    update_data = {"updated_at": now}
    
    # Sanitize and prepare fields for update
    for field, content in request.fields.items():
        # Sanitize input - remove potentially dangerous content
        sanitized = re.sub(r'<script[^>]*>.*?</script>', '', content, flags=re.IGNORECASE | re.DOTALL)
        sanitized = re.sub(r'on\w+\s*=', '', sanitized, flags=re.IGNORECASE)
        
        if request.language == "en":
            # For English, save directly to the main field
            update_data[field] = sanitized
        else:
            # For other languages, save to field_{lang} format
            update_data[f"{field}_{request.language}"] = sanitized
    
    # Update metadata
    update_data["last_edited_language"] = request.language
    update_data["last_edited_at"] = now
    update_data["last_edited_by"] = user["id"]
    update_data["version"] = disease.get("version", 1) + 1
    
    await db.diseases.update_one(
        {"id": disease_id},
        {"$set": update_data}
    )
    
    # Store version history
    updated = await db.diseases.find_one({"id": disease_id}, {"_id": 0})
    await db.disease_versions.insert_one({
        "disease_id": disease_id,
        "version": updated["version"],
        "data": updated,
        "created_by": user["id"],
        "created_at": now,
        "edit_type": "single_language",
        "language": request.language
    })
    
    # Get category name
    category = await db.categories.find_one({"id": updated.get("category_id", "")}, {"_id": 0})
    updated["category_name"] = category["name"] if category else ""
    
    return {
        "message": f"Saved in {request.language}",
        "disease": updated
    }

@api_router.put("/diseases/{disease_id}/inline-save-translate")
async def inline_save_and_translate(
    disease_id: str,
    request: InlineSaveAndTranslateRequest,
    user: dict = Depends(get_current_user)
):
    """Save disease content and translate to other languages"""
    if user["role"] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can edit diseases")
    
    disease = await db.diseases.find_one({"id": disease_id}, {"_id": 0})
    if not disease:
        raise HTTPException(status_code=404, detail="Disease not found")
    
    now = datetime.now(timezone.utc).isoformat()
    update_data = {"updated_at": now}
    
    # First, save the source language content
    for field, content in request.fields.items():
        # Sanitize input
        sanitized = re.sub(r'<script[^>]*>.*?</script>', '', content, flags=re.IGNORECASE | re.DOTALL)
        sanitized = re.sub(r'on\w+\s*=', '', sanitized, flags=re.IGNORECASE)
        
        if request.source_language == "en":
            update_data[field] = sanitized
        else:
            update_data[f"{field}_{request.source_language}"] = sanitized
    
    # Translate to target languages
    source_lang_name = LANGUAGE_NAMES.get(request.source_language, 'English')
    translated_count = 0
    
    try:
        for target_lang in request.target_languages:
            if target_lang == request.source_language:
                continue
                
            target_lang_name = LANGUAGE_NAMES.get(target_lang, target_lang)
            
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"translate-inline-{uuid.uuid4()}",
                system_message=f"""You are a professional medical translator. Translate medical/clinical text from {source_lang_name} to {target_lang_name}. 

Rules:
- Preserve all medical terminology accurately
- Maintain the same formatting (bullet points, line breaks, markdown)
- Only output the translated text, nothing else"""
            ).with_model("openai", "gpt-4.1-mini")
            
            for field, content in request.fields.items():
                if content and content.strip():
                    user_message = UserMessage(text=content)
                    translated = await chat.send_message(user_message)
                    
                    if target_lang == "en":
                        update_data[field] = translated
                    else:
                        update_data[f"{field}_{target_lang}"] = translated
                    translated_count += 1
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        # Still save the source language even if translation fails
    
    # Update metadata
    update_data["last_edited_language"] = request.source_language
    update_data["last_edited_at"] = now
    update_data["last_edited_by"] = user["id"]
    update_data["last_translation_source"] = request.source_language
    update_data["last_translation_at"] = now
    update_data["version"] = disease.get("version", 1) + 1
    
    await db.diseases.update_one(
        {"id": disease_id},
        {"$set": update_data}
    )
    
    # Store version history
    updated = await db.diseases.find_one({"id": disease_id}, {"_id": 0})
    await db.disease_versions.insert_one({
        "disease_id": disease_id,
        "version": updated["version"],
        "data": updated,
        "created_by": user["id"],
        "created_at": now,
        "edit_type": "save_and_translate",
        "source_language": request.source_language,
        "target_languages": request.target_languages
    })
    
    # Get category name
    category = await db.categories.find_one({"id": updated.get("category_id", "")}, {"_id": 0})
    updated["category_name"] = category["name"] if category else ""
    
    return {
        "message": f"Saved in {request.source_language} and translated to {len(request.target_languages) - 1} languages",
        "disease": updated,
        "translations_count": translated_count
    }

@api_router.get("/diseases/{disease_id}/versions")
async def get_disease_versions(
    disease_id: str,
    user: dict = Depends(get_current_user)
):
    versions = await db.disease_versions.find(
        {"disease_id": disease_id},
        {"_id": 0}
    ).sort("version", -1).to_list(100)
    
    return versions

# ==================== BOOKMARK ROUTES ====================

@api_router.get("/bookmarks", response_model=List[BookmarkResponse])
async def get_bookmarks(user: dict = Depends(get_current_user)):
    bookmarks = await db.bookmarks.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Add disease names
    for bookmark in bookmarks:
        disease = await db.diseases.find_one({"id": bookmark["disease_id"]}, {"_id": 0, "name": 1})
        bookmark["disease_name"] = disease["name"] if disease else "Unknown"
    
    return bookmarks

@api_router.post("/bookmarks", response_model=BookmarkResponse)
async def create_bookmark(
    bookmark: BookmarkCreate,
    user: dict = Depends(get_current_user)
):
    # Check if disease exists
    disease = await db.diseases.find_one({"id": bookmark.disease_id}, {"_id": 0})
    if not disease:
        raise HTTPException(status_code=404, detail="Disease not found")
    
    # Check if already bookmarked
    existing = await db.bookmarks.find_one({
        "user_id": user["id"],
        "disease_id": bookmark.disease_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already bookmarked")
    
    bookmark_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    bookmark_doc = {
        "id": bookmark_id,
        "user_id": user["id"],
        "disease_id": bookmark.disease_id,
        "created_at": now
    }
    
    await db.bookmarks.insert_one(bookmark_doc)
    bookmark_doc["disease_name"] = disease["name"]
    
    return bookmark_doc

@api_router.delete("/bookmarks/{disease_id}")
async def delete_bookmark(
    disease_id: str,
    user: dict = Depends(get_current_user)
):
    result = await db.bookmarks.delete_one({
        "user_id": user["id"],
        "disease_id": disease_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    
    return {"message": "Bookmark removed"}

# ==================== NOTES ROUTES ====================

@api_router.get("/notes", response_model=List[NoteResponse])
async def get_notes(user: dict = Depends(get_current_user)):
    notes = await db.notes.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("updated_at", -1).to_list(100)
    
    # Add disease names
    for note in notes:
        disease = await db.diseases.find_one({"id": note["disease_id"]}, {"_id": 0, "name": 1})
        note["disease_name"] = disease["name"] if disease else "Unknown"
    
    return notes

@api_router.get("/notes/{disease_id}", response_model=Optional[NoteResponse])
async def get_note_for_disease(
    disease_id: str,
    user: dict = Depends(get_current_user)
):
    note = await db.notes.find_one({
        "user_id": user["id"],
        "disease_id": disease_id
    }, {"_id": 0})
    
    if note:
        disease = await db.diseases.find_one({"id": disease_id}, {"_id": 0, "name": 1})
        note["disease_name"] = disease["name"] if disease else "Unknown"
    
    return note

@api_router.post("/notes", response_model=NoteResponse)
async def create_or_update_note(
    note: NoteCreate,
    user: dict = Depends(get_current_user)
):
    # Check if disease exists
    disease = await db.diseases.find_one({"id": note.disease_id}, {"_id": 0})
    if not disease:
        raise HTTPException(status_code=404, detail="Disease not found")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Check if note exists
    existing = await db.notes.find_one({
        "user_id": user["id"],
        "disease_id": note.disease_id
    }, {"_id": 0})
    
    if existing:
        await db.notes.update_one(
            {"id": existing["id"]},
            {"$set": {"content": note.content, "updated_at": now}}
        )
        note_doc = await db.notes.find_one({"id": existing["id"]}, {"_id": 0})
    else:
        note_id = str(uuid.uuid4())
        note_doc = {
            "id": note_id,
            "user_id": user["id"],
            "disease_id": note.disease_id,
            "content": note.content,
            "created_at": now,
            "updated_at": now
        }
        await db.notes.insert_one(note_doc)
    
    note_doc["disease_name"] = disease["name"]
    return note_doc

@api_router.delete("/notes/{note_id}")
async def delete_note(
    note_id: str,
    user: dict = Depends(get_current_user)
):
    result = await db.notes.delete_one({
        "id": note_id,
        "user_id": user["id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return {"message": "Note deleted"}

# ==================== RECENT VIEWS ROUTES ====================

@api_router.get("/recent-views", response_model=List[RecentViewResponse])
async def get_recent_views(user: dict = Depends(get_current_user)):
    views = await db.recent_views.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("viewed_at", -1).to_list(20)
    
    return views

@api_router.post("/recent-views/{disease_id}")
async def add_recent_view(
    disease_id: str,
    user: dict = Depends(get_current_user)
):
    # Check if disease exists
    disease = await db.diseases.find_one({"id": disease_id}, {"_id": 0})
    if not disease:
        raise HTTPException(status_code=404, detail="Disease not found")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Remove existing view for this disease
    await db.recent_views.delete_one({
        "user_id": user["id"],
        "disease_id": disease_id
    })
    
    # Add new view
    view_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "disease_id": disease_id,
        "disease_name": disease["name"],
        "viewed_at": now
    }
    
    await db.recent_views.insert_one(view_doc)
    
    # Keep only last 20 views
    views = await db.recent_views.find(
        {"user_id": user["id"]},
        {"_id": 0, "id": 1}
    ).sort("viewed_at", -1).to_list(100)
    
    if len(views) > 20:
        old_ids = [v["id"] for v in views[20:]]
        await db.recent_views.delete_many({"id": {"$in": old_ids}})
    
    return {"message": "View recorded"}

# ==================== TAGS ROUTE ====================

@api_router.get("/tags")
async def get_tags():
    # Get all unique tags from diseases
    pipeline = [
        {"$unwind": "$tags"},
        {"$group": {"_id": "$tags", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    
    result = await db.diseases.aggregate(pipeline).to_list(100)
    return [{"tag": r["_id"], "count": r["count"]} for r in result]

# ==================== ADMIN ROUTES ====================

@api_router.get("/admin/users", response_model=List[UserResponse])
async def get_all_users(user: dict = Depends(get_current_user)):
    if user["role"] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can view all users")
    
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return users

@api_router.put("/admin/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    role: str,
    user: dict = Depends(get_current_user)
):
    if user["role"] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can change roles")
    
    if role not in [UserRole.ADMIN, UserRole.EDITOR, UserRole.STUDENT]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"role": role}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Role updated"}

@api_router.get("/admin/stats")
async def get_admin_stats(user: dict = Depends(get_current_user)):
    if user["role"] not in [UserRole.ADMIN, UserRole.EDITOR]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    stats = {
        "total_users": await db.users.count_documents({}),
        "total_diseases": await db.diseases.count_documents({}),
        "total_categories": await db.categories.count_documents({}),
        "total_bookmarks": await db.bookmarks.count_documents({}),
        "total_notes": await db.notes.count_documents({})
    }
    
    return stats

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_data():
    """Seed initial PMR data - only run once"""
    
    # Check if data already exists
    existing = await db.categories.count_documents({})
    if existing > 0:
        return {"message": "Data already seeded"}
    
    # Create categories
    categories_data = [
        {"id": str(uuid.uuid4()), "name": "Musculoskeletal Disorders", "description": "Conditions affecting muscles, bones, joints, and connective tissues", "icon": "bone", "order": 1},
        {"id": str(uuid.uuid4()), "name": "Neurological Rehabilitation", "description": "Rehabilitation for neurological conditions", "icon": "brain", "order": 2},
        {"id": str(uuid.uuid4()), "name": "Spine Disorders", "description": "Conditions affecting the spinal column", "icon": "activity", "order": 3},
        {"id": str(uuid.uuid4()), "name": "Sports Injuries", "description": "Injuries related to sports and physical activities", "icon": "trophy", "order": 4},
        {"id": str(uuid.uuid4()), "name": "Chronic Pain", "description": "Management of chronic pain conditions", "icon": "heart-pulse", "order": 5},
        {"id": str(uuid.uuid4()), "name": "Pediatric Rehabilitation", "description": "Rehabilitation for children and adolescents", "icon": "baby", "order": 6},
        {"id": str(uuid.uuid4()), "name": "Amputations and Prosthetics", "description": "Care for amputees and prosthetic management", "icon": "accessibility", "order": 7},
        {"id": str(uuid.uuid4()), "name": "Electrodiagnosis", "description": "Electrodiagnostic studies and findings", "icon": "zap", "order": 8}
    ]
    
    await db.categories.insert_many(categories_data)
    
    # Get category IDs
    cat_map = {c["name"]: c["id"] for c in categories_data}
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Sample diseases
    diseases_data = [
        {
            "id": str(uuid.uuid4()),
            "name": "Rotator Cuff Tear",
            "category_id": cat_map["Musculoskeletal Disorders"],
            "tags": ["acute", "chronic", "traumatic", "degenerative"],
            "definition": "A rotator cuff tear is a tear of one or more of the tendons of the four rotator cuff muscles: supraspinatus, infraspinatus, teres minor, and subscapularis. The supraspinatus is most commonly affected.",
            "epidemiology": "Prevalence increases with age, affecting up to 50% of individuals over 80 years. More common in dominant arm. Risk factors include repetitive overhead activities, smoking, and hypercholesterolemia.",
            "pathophysiology": "Tears can be degenerative or traumatic. Degenerative tears result from chronic tendinopathy with hypoxia, oxidative stress, and matrix metalloproteinase imbalance. Traumatic tears occur from acute injury to healthy tissue.",
            "biomechanics": "The rotator cuff provides dynamic stability to the glenohumeral joint by compressing the humeral head into the glenoid. Tears disrupt this force couple, leading to superior migration of the humeral head.",
            "clinical_presentation": "Patients present with shoulder pain, weakness, and decreased range of motion. Night pain is common. Acute tears may present with sudden onset of weakness after trauma.",
            "physical_examination": "- Empty can test (Jobe test) for supraspinatus\n- External rotation lag sign for infraspinatus\n- Lift-off test for subscapularis\n- Hornblower sign for teres minor\n- Drop arm test for massive tears",
            "imaging_findings": "MRI is gold standard showing tendon discontinuity, retraction, and muscle atrophy. Ultrasound has high sensitivity in experienced hands. X-ray may show superior migration of humeral head.",
            "differential_diagnosis": "- Adhesive capsulitis\n- Glenohumeral osteoarthritis\n- Cervical radiculopathy\n- Subacromial bursitis\n- Biceps tendinopathy",
            "treatment_conservative": "- NSAIDs for pain control\n- Physical therapy focusing on rotator cuff strengthening\n- Activity modification\n- Subacromial corticosteroid injection (limited to 3)",
            "treatment_interventional": "- Subacromial corticosteroid injection\n- PRP injection (emerging evidence)\n- Hydrodilatation for concurrent stiffness",
            "treatment_surgical": "- Arthroscopic repair for full-thickness tears\n- Open repair for massive tears\n- Superior capsular reconstruction\n- Reverse total shoulder arthroplasty for cuff tear arthropathy",
            "rehabilitation_protocol": "Phase 1 (0-6 weeks): Sling immobilization, passive ROM\nPhase 2 (6-12 weeks): Active-assisted ROM, isometrics\nPhase 3 (12-16 weeks): Progressive strengthening\nPhase 4 (16+ weeks): Sport/work-specific training",
            "prognosis": "Conservative management successful in 50-80% of partial tears. Surgical repair has 80-95% satisfaction. Factors affecting outcome: tear size, muscle atrophy, fatty infiltration, patient age.",
            "references": ["1. Codman EA. The Shoulder. 1934", "2. Neer CS. Impingement lesions. Clin Orthop. 1983", "3. Tashjian RZ. Epidemiology, natural history, and indications for treatment. Clin Sports Med. 2012"],
            "images": [],
            "created_at": now,
            "updated_at": now,
            "created_by": "system",
            "version": 1
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Stroke Rehabilitation",
            "category_id": cat_map["Neurological Rehabilitation"],
            "tags": ["acute", "chronic", "neurological"],
            "definition": "Stroke rehabilitation is a comprehensive program to help patients recover functional abilities lost after cerebrovascular accident (CVA), addressing motor, sensory, cognitive, and psychosocial impairments.",
            "epidemiology": "Stroke is the leading cause of adult disability. Approximately 795,000 strokes occur annually in the US. 80% are ischemic, 20% hemorrhagic. Risk factors include hypertension, diabetes, atrial fibrillation.",
            "pathophysiology": "Ischemic stroke results from arterial occlusion causing neuronal death in the core with potentially salvageable penumbra. Hemorrhagic stroke causes direct tissue damage and increased intracranial pressure.",
            "biomechanics": "Upper motor neuron damage leads to spasticity, weakness, and abnormal movement synergies. Common patterns include flexor synergy in upper extremity and extensor synergy in lower extremity.",
            "clinical_presentation": "Hemiparesis/hemiplegia, sensory deficits, aphasia, dysphagia, hemineglect, cognitive impairment, depression. Presentation varies based on stroke location and extent.",
            "physical_examination": "- NIH Stroke Scale for acute assessment\n- Modified Ashworth Scale for spasticity\n- Fugl-Meyer Assessment for motor function\n- Berg Balance Scale\n- 6-minute walk test\n- FIM score for functional independence",
            "imaging_findings": "CT for acute hemorrhage detection. MRI with DWI for early ischemic changes. CT/MR angiography for vascular assessment. Perfusion imaging for penumbra identification.",
            "differential_diagnosis": "- Transient ischemic attack\n- Todd's paralysis post-seizure\n- Hypoglycemia\n- Migraine with aura\n- Brain tumor\n- Multiple sclerosis",
            "treatment_conservative": "- Multidisciplinary rehabilitation team\n- Physical therapy for mobility\n- Occupational therapy for ADLs\n- Speech therapy for communication/swallowing\n- Neuropsychology for cognitive rehabilitation",
            "treatment_interventional": "- Botulinum toxin for focal spasticity\n- Intrathecal baclofen for severe spasticity\n- Nerve blocks\n- Constraint-induced movement therapy",
            "treatment_surgical": "- Selective dorsal rhizotomy (rare)\n- Tendon lengthening for fixed contractures\n- Deep brain stimulation (investigational)",
            "rehabilitation_protocol": "Acute phase: Prevention of complications, early mobilization\nSubacute (1-3 months): Intensive inpatient rehabilitation\nChronic (>3 months): Outpatient therapy, community reintegration\nContinuing: Home exercise program, adaptive equipment",
            "prognosis": "Greatest recovery in first 3-6 months. 70% achieve independence in ADLs. Predictors: initial severity, age, pre-stroke function, social support, early rehabilitation initiation.",
            "references": ["1. Winstein CJ, et al. Guidelines for Adult Stroke Rehabilitation. Stroke. 2016", "2. Langhorne P, et al. Stroke rehabilitation. Lancet. 2011"],
            "images": [],
            "created_at": now,
            "updated_at": now,
            "created_by": "system",
            "version": 1
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Lumbar Disc Herniation",
            "category_id": cat_map["Spine Disorders"],
            "tags": ["acute", "chronic", "degenerative"],
            "definition": "Lumbar disc herniation is the displacement of disc material (nucleus pulposus or annulus fibrosus) beyond the normal confines of the intervertebral disc space, potentially causing radicular symptoms.",
            "epidemiology": "Peak incidence 30-50 years. L4-L5 and L5-S1 levels account for 95% of cases. Annual incidence of symptomatic herniation is 5-20 per 1000 adults. Male predominance.",
            "pathophysiology": "Disc degeneration leads to annular tears allowing nucleus pulposus extrusion. Mechanical compression and inflammatory mediators (TNF-alpha, IL-1, PLA2) cause radicular pain.",
            "biomechanics": "The intervertebral disc acts as a shock absorber and allows spinal motion. Herniation disrupts load distribution and may compress neural elements in the spinal canal or neural foramen.",
            "clinical_presentation": "Radicular pain following dermatomal distribution (sciatica). Associated numbness, tingling, weakness. May have low back pain. Red flags: cauda equina syndrome, progressive neurological deficit.",
            "physical_examination": "- Straight leg raise (sensitivity 91% for L5/S1 radiculopathy)\n- Crossed straight leg raise (specificity 88%)\n- Dermatomal sensory testing\n- Myotomal strength testing\n- Deep tendon reflexes (ankle, knee)",
            "imaging_findings": "MRI is imaging of choice showing disc morphology, neural compression, and canal dimensions. CT myelography if MRI contraindicated. X-ray for alignment and instability.",
            "differential_diagnosis": "- Piriformis syndrome\n- Sacroiliac joint dysfunction\n- Hip pathology\n- Peripheral neuropathy\n- Spinal stenosis\n- Tumor or infection",
            "treatment_conservative": "- Activity modification (avoid prolonged sitting)\n- NSAIDs, muscle relaxants\n- Physical therapy: McKenzie method, core stabilization\n- Education on proper body mechanics",
            "treatment_interventional": "- Epidural steroid injection (interlaminar or transforaminal)\n- Selective nerve root block for diagnostic and therapeutic purposes",
            "treatment_surgical": "- Microdiscectomy for persistent radiculopathy >6-12 weeks\n- Endoscopic discectomy\n- Indications: cauda equina syndrome, progressive motor deficit, intractable pain",
            "rehabilitation_protocol": "Acute: Pain control, gentle ROM\nSubacute: Core stabilization, aerobic conditioning\nRecovery: Progressive strengthening, functional restoration\nMaintenance: Home exercise program, ergonomic modifications",
            "prognosis": "90% improve with conservative management. Surgery provides faster relief but similar long-term outcomes. Recurrence rate 5-15%. Risk factors for poor outcome: obesity, smoking, heavy labor.",
            "references": ["1. Kreiner DS, et al. Clinical Guidelines for Lumbar Disc Herniation. NASS. 2014", "2. Deyo RA, Mirza SK. Herniated Lumbar Disc. NEJM. 2016"],
            "images": [],
            "created_at": now,
            "updated_at": now,
            "created_by": "system",
            "version": 1
        },
        {
            "id": str(uuid.uuid4()),
            "name": "ACL Tear",
            "category_id": cat_map["Sports Injuries"],
            "tags": ["acute", "traumatic"],
            "definition": "Anterior cruciate ligament (ACL) tear is a complete or partial rupture of the ACL, one of the four major ligaments of the knee, crucial for rotational stability.",
            "epidemiology": "Approximately 200,000 ACL injuries occur annually in the US. Peak incidence in 15-25 age group. Female athletes 2-8 times higher risk than males in same sports.",
            "pathophysiology": "Mechanism typically involves non-contact pivoting, landing, or deceleration with valgus and external rotation stress. Contact injuries from direct blow to lateral knee.",
            "biomechanics": "The ACL prevents anterior tibial translation and provides rotational stability. It consists of anteromedial and posterolateral bundles with different tension patterns through ROM.",
            "clinical_presentation": "Acute: Pop sensation, immediate swelling (hemarthrosis), inability to continue activity. Chronic: Instability with pivoting activities, recurrent giving way episodes.",
            "physical_examination": "- Lachman test (most sensitive - 85%)\n- Anterior drawer test\n- Pivot shift test (most specific for instability)\n- Evaluate for associated meniscal and collateral ligament injuries\n- KT-1000 arthrometer for objective measurement",
            "imaging_findings": "MRI gold standard: T2 shows ligament discontinuity, edema. Secondary signs: bone bruise pattern, anterior tibial translation. X-ray for Segond fracture (lateral tibial plateau avulsion).",
            "differential_diagnosis": "- PCL tear\n- Meniscal tear\n- MCL/LCL injury\n- Patellofemoral instability\n- Tibial plateau fracture",
            "treatment_conservative": "- RICE protocol acutely\n- Rehabilitation focusing on quadriceps and hamstring strengthening\n- Functional bracing\n- Activity modification\n- Appropriate for low-demand patients or partial tears",
            "treatment_interventional": "PRP injections for partial tears (limited evidence)",
            "treatment_surgical": "- ACL reconstruction with autograft (BTB, hamstring, quad tendon) or allograft\n- Single vs double bundle techniques\n- Timing: typically 2-6 weeks post-injury after ROM restoration\n- Revision reconstruction for graft failure",
            "rehabilitation_protocol": "Phase 1 (0-2 weeks): Protect graft, reduce swelling, restore extension\nPhase 2 (2-6 weeks): Progressive weight bearing, ROM\nPhase 3 (6-12 weeks): Strengthening, neuromuscular control\nPhase 4 (3-6 months): Sport-specific training\nReturn to sport: 9-12 months with functional criteria met",
            "prognosis": "90-95% return to previous activity level after reconstruction. 10-15% re-tear rate. Risk of early-onset osteoarthritis regardless of treatment. Better outcomes with meniscal preservation.",
            "references": ["1. Fu FH, van Eck CF. ACL Reconstruction. JAAOS. 2012", "2. Hewett TE, et al. Anterior Cruciate Ligament Injuries in Female Athletes. Am J Sports Med. 2006"],
            "images": [],
            "created_at": now,
            "updated_at": now,
            "created_by": "system",
            "version": 1
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Complex Regional Pain Syndrome",
            "category_id": cat_map["Chronic Pain"],
            "tags": ["chronic", "neuropathic"],
            "definition": "Complex Regional Pain Syndrome (CRPS) is a chronic pain condition characterized by continuing regional pain disproportionate to inciting event, with sensory, vasomotor, sudomotor, and motor/trophic changes.",
            "epidemiology": "Incidence 5-26 per 100,000 person-years. Female predominance 3-4:1. Peak age 40-60 years. Upper extremity more common. Risk factors: fractures, surgery, immobilization.",
            "pathophysiology": "Multifactorial: peripheral and central sensitization, neurogenic inflammation, autonomic dysfunction, cortical reorganization, psychological factors. Type I (no nerve injury) vs Type II (with nerve injury).",
            "biomechanics": "Motor dysfunction includes weakness, tremor, dystonia, and decreased ROM. Bone demineralization from disuse and autonomic changes affects mechanical properties.",
            "clinical_presentation": "- Burning, continuous pain out of proportion\n- Allodynia and hyperalgesia\n- Edema, skin color/temperature changes\n- Sweating abnormalities\n- Dystrophic changes (hair, nail, skin)\n- Motor dysfunction",
            "physical_examination": "Budapest Criteria assessment:\n- Sensory: allodynia, hyperalgesia\n- Vasomotor: temperature asymmetry >1C, color changes\n- Sudomotor: edema, sweating changes\n- Motor/trophic: ROM decrease, weakness, tremor, dystonia, trophic changes",
            "imaging_findings": "Three-phase bone scan shows increased uptake (acute phase). X-ray shows patchy osteopenia. MRI may show soft tissue edema and bone marrow changes. Not required for diagnosis.",
            "differential_diagnosis": "- Peripheral nerve injury\n- Peripheral neuropathy\n- DVT\n- Cellulitis\n- Raynaud's phenomenon\n- Vascular insufficiency",
            "treatment_conservative": "- Multidisciplinary pain management\n- Physical therapy: desensitization, mirror therapy, graded motor imagery\n- Occupational therapy\n- Psychological support: CBT, biofeedback\n- Medications: gabapentinoids, TCAs, NSAIDs",
            "treatment_interventional": "- Sympathetic blocks (stellate ganglion, lumbar sympathetic)\n- Spinal cord stimulation\n- Intrathecal drug delivery\n- Ketamine infusions\n- IV immunoglobulin (experimental)",
            "treatment_surgical": "- Spinal cord stimulator implantation\n- Sympathectomy (rarely, controversial)\n- Amputation (very rare, last resort)",
            "rehabilitation_protocol": "Graded exposure approach:\n- Desensitization and edema management\n- Mirror therapy and motor imagery\n- Progressive loading and functional restoration\n- Stress loading program\n- Return to function and work",
            "prognosis": "Variable - early treatment improves outcomes. 70% show improvement with comprehensive treatment. Poor prognostic factors: delayed diagnosis, cold CRPS, spreading symptoms, psychological comorbidity.",
            "references": ["1. Harden RN, et al. Complex Regional Pain Syndrome. Pain Med. 2013", "2. Birklein F, et al. CRPS: updated pathophysiology. Pain. 2015"],
            "images": [],
            "created_at": now,
            "updated_at": now,
            "created_by": "system",
            "version": 1
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Cerebral Palsy",
            "category_id": cat_map["Pediatric Rehabilitation"],
            "tags": ["chronic", "developmental", "neurological"],
            "definition": "Cerebral palsy (CP) is a group of permanent disorders of movement and posture development, causing activity limitation, attributed to non-progressive disturbances in the developing fetal or infant brain.",
            "epidemiology": "Prevalence 2-3 per 1000 live births. Leading cause of childhood motor disability. Risk factors: prematurity, low birth weight, multiple gestation, perinatal asphyxia, infections.",
            "pathophysiology": "Results from injury to developing brain before, during, or shortly after birth. Common causes: periventricular leukomalacia (PVL), intraventricular hemorrhage (IVH), hypoxic-ischemic encephalopathy.",
            "biomechanics": "Spasticity, dyskinesia, and/or ataxia alter normal biomechanics. Muscle imbalances lead to bony deformities, joint contractures, and gait abnormalities over time.",
            "clinical_presentation": "- Motor impairment (spastic, dyskinetic, ataxic, mixed)\n- Topographic distribution (hemiplegia, diplegia, quadriplegia)\n- Associated conditions: intellectual disability, epilepsy, visual/hearing impairment, speech disorders",
            "physical_examination": "- Gross Motor Function Classification System (GMFCS I-V)\n- Manual Ability Classification System (MACS)\n- Modified Ashworth Scale for spasticity\n- Goniometry for ROM\n- Gait analysis\n- Reflex assessment",
            "imaging_findings": "Brain MRI shows underlying pathology: PVL (spastic diplegia), cortical malformations, stroke. May be normal in 10-15%. Not required for diagnosis but helps determine etiology.",
            "differential_diagnosis": "- Progressive neurological disorders\n- Spinal cord pathology\n- Neuromuscular diseases\n- Inborn errors of metabolism\n- Hereditary spastic paraplegia",
            "treatment_conservative": "- Physical therapy: stretching, strengthening, gait training\n- Occupational therapy: fine motor, ADLs\n- Speech therapy\n- Orthotics: AFOs, SMOs\n- Serial casting for contractures",
            "treatment_interventional": "- Botulinum toxin for focal spasticity\n- Intrathecal baclofen pump for generalized spasticity\n- Phenol nerve blocks",
            "treatment_surgical": "- Selective dorsal rhizotomy for spasticity\n- Single-event multilevel surgery (SEMLS) for gait abnormalities\n- Hip surveillance and reconstruction\n- Spine surgery for scoliosis",
            "rehabilitation_protocol": "Lifelong management:\n- Early intervention (0-3 years)\n- School-based services\n- Transition planning to adult services\n- Maintenance of function and prevention of secondary complications\n- Family education and support",
            "prognosis": "Life expectancy near normal for ambulatory children with mild involvement. GMFCS level strongly predicts functional outcome. Goals focus on maximizing independence and quality of life.",
            "references": ["1. Rosenbaum P, et al. The Definition and Classification of Cerebral Palsy. Dev Med Child Neurol. 2007", "2. Novak I, et al. Early, Accurate Diagnosis of Cerebral Palsy. JAMA Pediatr. 2017"],
            "images": [],
            "created_at": now,
            "updated_at": now,
            "created_by": "system",
            "version": 1
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Transtibial Amputation Rehabilitation",
            "category_id": cat_map["Amputations and Prosthetics"],
            "tags": ["chronic", "traumatic"],
            "definition": "Transtibial (below-knee) amputation rehabilitation is a comprehensive program to restore mobility and function following amputation between the knee and ankle, typically preserving the knee joint.",
            "epidemiology": "Approximately 185,000 amputations annually in US. 54% are transtibial. Vascular disease (diabetes, PVD) accounts for 82%. Trauma, cancer, and congenital causes make up remainder.",
            "pathophysiology": "Vascular: progressive atherosclerosis and microvascular disease leading to tissue ischemia. Traumatic: acute tissue destruction. Post-amputation: wound healing, phantom sensation development.",
            "biomechanics": "Loss of ankle joint eliminates push-off power and ankle strategy for balance. Prosthetic foot must provide stability, energy storage, and return. Knee preservation crucial for energy-efficient gait.",
            "clinical_presentation": "Post-operative: wound healing, edema management, pain control. Preprosthetic: residual limb shaping, desensitization. Prosthetic: gait training, functional restoration.",
            "physical_examination": "- Residual limb assessment: length, shape, skin integrity, sensitivity\n- ROM assessment (especially knee extension)\n- Strength testing\n- Contralateral limb evaluation\n- Cardiovascular status\n- Cognitive and psychological assessment",
            "imaging_findings": "X-ray for bone healing and length. Vascular studies (ABI, duplex) for healing potential. Not routinely needed for rehabilitation planning.",
            "differential_diagnosis": "N/A - This is a rehabilitation condition following amputation.",
            "treatment_conservative": "- Wound care and edema management\n- Residual limb shaping (elastic wrapping, shrinker)\n- Desensitization and phantom pain management\n- Strengthening and ROM exercises\n- Transfer and mobility training",
            "treatment_interventional": "- Mirror therapy for phantom pain\n- Targeted muscle reinnervation (TMR)\n- Nerve blocks for persistent pain",
            "treatment_surgical": "- Revision amputation for healing complications\n- TMR for neuroma prevention/treatment\n- Osseointegration (investigational)",
            "rehabilitation_protocol": "Phase 1 (Pre-prosthetic): Wound healing, strengthening, mobility\nPhase 2 (Prosthetic training): Socket fitting, gait training\nPhase 3 (Advanced): Community ambulation, stairs, uneven surfaces\nPhase 4 (Vocational/recreational): Return to work/sports\nLifelong: Prosthetic maintenance, skin care, fitness",
            "prognosis": "85-95% of transtibial amputees achieve functional ambulation. K-level determines prosthetic prescription. Factors: age, cause of amputation, comorbidities, motivation, social support.",
            "references": ["1. Esquenazi A. Amputation Rehabilitation. Phys Med Rehabil Clin N Am. 2019", "2. Kahle JT, et al. Transtibial Prosthetic Socket Designs. JPO. 2016"],
            "images": [],
            "created_at": now,
            "updated_at": now,
            "created_by": "system",
            "version": 1
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Carpal Tunnel Syndrome",
            "category_id": cat_map["Electrodiagnosis"],
            "tags": ["chronic", "compressive"],
            "definition": "Carpal tunnel syndrome (CTS) is the most common peripheral nerve entrapment, resulting from compression of the median nerve within the carpal tunnel at the wrist.",
            "epidemiology": "Prevalence 3-6% in general population. Female:male ratio 3:1. Peak age 40-60 years. Risk factors: obesity, diabetes, hypothyroidism, pregnancy, repetitive hand use, rheumatoid arthritis.",
            "pathophysiology": "Increased pressure within the carpal tunnel causes demyelination initially, then axonal loss with severe/prolonged compression. Threshold pressure >30 mmHg causes symptoms.",
            "biomechanics": "The carpal tunnel is a rigid fibro-osseous structure. Any increase in tunnel contents or decrease in tunnel size elevates pressure. Wrist flexion/extension further increases pressure.",
            "clinical_presentation": "- Numbness and tingling in median nerve distribution (thumb, index, middle, radial ring finger)\n- Night symptoms with awakening\n- Weakness and clumsiness\n- Thenar atrophy in severe cases",
            "physical_examination": "- Phalen test (wrist flexion for 60 sec)\n- Tinel sign at carpal tunnel\n- Carpal tunnel compression test\n- Thenar muscle strength and atrophy assessment\n- Sensory testing (two-point discrimination, monofilament)",
            "imaging_findings": "Electrodiagnostic studies are gold standard:\n- Prolonged distal sensory latency (>3.5 ms)\n- Prolonged distal motor latency (>4.2 ms)\n- Reduced CMAP amplitude (severe)\n- Fibrillations in thenar muscles (very severe)\n\nUltrasound: median nerve CSA >10-12 mm2",
            "differential_diagnosis": "- Cervical radiculopathy (C6-C7)\n- Pronator teres syndrome\n- Thoracic outlet syndrome\n- Peripheral polyneuropathy\n- De Quervain's tenosynovitis",
            "treatment_conservative": "- Neutral wrist splinting (especially at night)\n- Activity modification\n- NSAIDs\n- Nerve gliding exercises\n- Ergonomic modifications",
            "treatment_interventional": "- Corticosteroid injection into carpal tunnel\n- Ultrasound-guided injection improves accuracy",
            "treatment_surgical": "- Carpal tunnel release (open or endoscopic)\n- Indications: failure of conservative treatment, thenar atrophy, severe electrodiagnostic findings\n- 85-95% success rate",
            "rehabilitation_protocol": "Post-surgical:\n- Week 1-2: Wound care, finger ROM, light activities\n- Week 2-4: Progressive grip strengthening\n- Week 4-6: Full activities as tolerated\n- Return to work: 1-6 weeks depending on occupation",
            "prognosis": "Excellent with treatment. Conservative management effective in 50-70% of mild cases. Surgical success 85-95%. Poor prognostic factors: prolonged duration, severe EDX findings, workers' compensation.",
            "references": ["1. Werner RA, Andary M. Electrodiagnostic evaluation of CTS. Muscle Nerve. 2011", "2. Padua L, et al. Carpal tunnel syndrome: Updated guidelines. Clin Neurophysiol. 2018"],
            "images": [],
            "created_at": now,
            "updated_at": now,
            "created_by": "system",
            "version": 1
        }
    ]
    
    await db.diseases.insert_many(diseases_data)
    
    # Create admin user
    admin_id = str(uuid.uuid4())
    admin_doc = {
        "id": admin_id,
        "email": "admin@pmr.edu",
        "name": "Admin User",
        "password": hash_password("admin123"),
        "role": "admin",
        "created_at": now,
        "email_verified": True
    }
    await db.users.insert_one(admin_doc)
    
    return {"message": "Data seeded successfully", "categories": len(categories_data), "diseases": len(diseases_data)}

# ==================== STATUS ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "PMR Education Platform API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "database": "connected"}

# ==================== TRANSLATION ROUTES ====================

class TranslationRequest(BaseModel):
    text: str
    source_language: str
    target_language: str

class TranslationResponse(BaseModel):
    translated_text: str
    source_language: str
    target_language: str

LANGUAGE_NAMES = {
    'en': 'English',
    'pt': 'Portuguese (Portugal)',
    'es': 'Spanish'
}

@api_router.post("/translate", response_model=TranslationResponse)
async def translate_text(
    request: TranslationRequest,
    user: dict = Depends(get_current_user)
):
    """Translate medical content between languages"""
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="Translation service not configured")
    
    source_name = LANGUAGE_NAMES.get(request.source_language, request.source_language)
    target_name = LANGUAGE_NAMES.get(request.target_language, request.target_language)
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"translate-{uuid.uuid4()}",
            system_message=f"""You are a professional medical translator. Translate the following medical/clinical text from {source_name} to {target_name}. 
            
Rules:
- Preserve all medical terminology accurately
- Maintain the same formatting (bullet points, line breaks, etc.)
- Keep any markdown formatting intact
- Do not add explanations or notes
- Only output the translated text, nothing else"""
        ).with_model("openai", "gpt-4.1-mini")
        
        user_message = UserMessage(text=request.text)
        translated = await chat.send_message(user_message)
        
        return TranslationResponse(
            translated_text=translated,
            source_language=request.source_language,
            target_language=request.target_language
        )
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")

@api_router.post("/translate-disease/{disease_id}")
async def translate_disease(
    disease_id: str,
    target_language: str,
    user: dict = Depends(get_current_user)
):
    """Translate all text fields of a disease to target language"""
    if user["role"] not in [UserRole.ADMIN, UserRole.EDITOR]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    disease = await db.diseases.find_one({"id": disease_id}, {"_id": 0})
    if not disease:
        raise HTTPException(status_code=404, detail="Disease not found")
    
    # Fields to translate
    text_fields = [
        'definition', 'epidemiology', 'pathophysiology', 'biomechanics',
        'clinical_presentation', 'physical_examination', 'imaging_findings',
        'differential_diagnosis', 'treatment_conservative', 'treatment_interventional',
        'treatment_surgical', 'rehabilitation_protocol', 'prognosis'
    ]
    
    source_lang = disease.get('language', 'en')
    translations = {}
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"translate-disease-{uuid.uuid4()}",
            system_message=f"""You are a professional medical translator. Translate medical/clinical text from {LANGUAGE_NAMES.get(source_lang, 'English')} to {LANGUAGE_NAMES.get(target_language, target_language)}. 
            
Rules:
- Preserve all medical terminology accurately
- Maintain the same formatting (bullet points, line breaks, etc.)
- Keep any markdown formatting intact
- Only output the translated text, nothing else"""
        ).with_model("openai", "gpt-4.1-mini")
        
        for field in text_fields:
            content = disease.get(field, '')
            if content and content.strip():
                user_message = UserMessage(text=content)
                translated = await chat.send_message(user_message)
                translations[f"{field}_{target_language}"] = translated
        
        # Also translate name
        if disease.get('name'):
            user_message = UserMessage(text=disease['name'])
            translations[f"name_{target_language}"] = await chat.send_message(user_message)
        
        # Update disease with translations
        await db.diseases.update_one(
            {"id": disease_id},
            {"$set": translations}
        )
        
        return {"message": f"Translated to {target_language}", "fields_translated": len(translations)}
    except Exception as e:
        logger.error(f"Disease translation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
