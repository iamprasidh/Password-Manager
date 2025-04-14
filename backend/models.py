from sqlalchemy import Boolean, Column, Integer, String, ForeignKey, LargeBinary
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=False)  # Stores the hashed master password
    master_password_salt = Column(LargeBinary, nullable=True)  # Salt for master password
    is_active = Column(Boolean, default=True)
    passwords = relationship("Password", back_populates="owner")

class Password(Base):
    __tablename__ = "passwords"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    username = Column(String)
    encrypted_password = Column(LargeBinary, nullable=False)  # Store as binary for better security
    password_salt = Column(LargeBinary, nullable=True)  # Salt for this specific password
    website = Column(String)
    notes = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="passwords")