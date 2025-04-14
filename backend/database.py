from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import bcrypt
import os
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64

# Use SQLite instead of PostgreSQL for simplicity
BASEDIR = os.path.dirname(os.path.abspath(__file__))
SQLALCHEMY_DATABASE_URL = f"sqlite:///{os.path.join(BASEDIR, 'passwordmanager.db')}"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Salt for password hashing (should be stored securely in production)
PASSWORD_SALT = os.environ.get('PASSWORD_SALT', bcrypt.gensalt(rounds=12))

def get_password_hash(password: str) -> str:
    """Hash a password for storing using bcrypt with salt."""
    return bcrypt.hashpw(password.encode(), PASSWORD_SALT).decode()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a stored password against one provided by user"""
    return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())

def derive_key_from_master_password(master_password: str, salt: bytes = None) -> bytes:
    """Derive an encryption key from the master password using PBKDF2"""
    if salt is None:
        salt = os.urandom(16)  # Generate a random salt if not provided
    
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,  # High number of iterations for security
    )
    key = base64.urlsafe_b64encode(kdf.derive(master_password.encode()))
    return key, salt

def encrypt_password(password: str, master_password: str, salt: bytes = None) -> tuple:
    """Encrypt a password using the master password"""
    key, salt = derive_key_from_master_password(master_password, salt)
    f = Fernet(key)
    encrypted_password = f.encrypt(password.encode())
    return encrypted_password, salt

def decrypt_password(encrypted_password: bytes, master_password: str, salt: bytes) -> str:
    """Decrypt a password using the master password"""
    key, _ = derive_key_from_master_password(master_password, salt)
    f = Fernet(key)
    decrypted_password = f.decrypt(encrypted_password).decode()
    return decrypted_password