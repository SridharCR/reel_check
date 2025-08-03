from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from backend import database, schemas
from backend.hashing import Hash
from backend.database import User

router = APIRouter(
    tags=['Users']
)

@router.post('/user', response_model=schemas.User)
def create_user(request: schemas.UserCreate, db: Session = Depends(database.get_db)):
    new_user = User(username=request.username, email=request.email, password=Hash.bcrypt(request.password))
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
