from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
import models, database
from pydantic import BaseModel
from database import get_password_hash, verify_password, encrypt_password, decrypt_password
from datetime import datetime, timedelta
from jose import JWTError, jwt
from typing import Union
import secrets
import base64

# JWT settings
SECRET_KEY = secrets.token_hex(32)  # Generate a secure random key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # Extended to 24 hours

# OAuth2 password bearer for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Create database tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
    expose_headers=["Authorization"],
    max_age=3600
)

# Dependency to get the database session
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic models for request/response
class UserCreate(BaseModel):
    email: str
    password: str  # This will be the master password

class UserResponse(BaseModel):
    id: int
    email: str
    is_active: bool

    class Config:
        orm_mode = True

class PasswordCreate(BaseModel):
    title: str
    username: str
    password: str
    website: Optional[str] = None
    notes: Optional[str] = None
    master_password: str  # Master password for encryption

class PasswordResponse(BaseModel):
    id: int
    title: str
    username: str
    website: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        orm_mode = True

class PasswordDecryptRequest(BaseModel):
    master_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

@app.get("/")
async def root():
    return {"message": "Password Manager API"}

# Functions for JWT token handling
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user

# User registration and authentication endpoints
@app.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Password management endpoints
@app.post("/passwords", response_model=PasswordResponse)
async def create_password(
    password: PasswordCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    encrypted_password, salt = encrypt_password(password.password, password.master_password)
    db_password = models.Password(
        title=password.title,
        username=password.username,
        encrypted_password=encrypted_password,
        password_salt=salt,
        website=password.website,
        notes=password.notes,
        user_id=current_user.id
    )
    db.add(db_password)
    db.commit()
    db.refresh(db_password)
    return db_password

@app.get("/passwords", response_model=List[PasswordResponse])
async def get_passwords(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    passwords = db.query(models.Password).filter(models.Password.user_id == current_user.id).all()
    return passwords

@app.get("/passwords/{password_id}", response_model=PasswordResponse)
async def get_password(
    password_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    password = db.query(models.Password).filter(
        models.Password.id == password_id,
        models.Password.user_id == current_user.id
    ).first()
    if not password:
        raise HTTPException(status_code=404, detail="Password not found")
    return password

@app.get("/users/me/", response_model=UserResponse)
async def get_current_user_profile(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.post("/passwords/{password_id}/decrypt")
async def decrypt_stored_password(
    password_id: int,
    decrypt_request: PasswordDecryptRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    password = db.query(models.Password).filter(
        models.Password.id == password_id,
        models.Password.user_id == current_user.id
    ).first()
    if not password:
        raise HTTPException(status_code=404, detail="Password not found")
    try:
        decrypted_password = decrypt_password(
            password.encrypted_password,
            decrypt_request.master_password,
            password.password_salt
        )
        return {"password": decrypted_password}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Failed to decrypt password")

@app.delete("/passwords/{password_id}")
async def delete_password(
    password_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    password = db.query(models.Password).filter(
        models.Password.id == password_id,
        models.Password.user_id == current_user.id
    ).first()
    if not password:
        raise HTTPException(status_code=404, detail="Password not found")
    db.delete(password)
    db.commit()
    return {"message": "Password deleted successfully"}