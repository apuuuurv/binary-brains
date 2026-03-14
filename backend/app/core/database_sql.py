from sqlalchemy import Column, String, Text, JSON, Integer, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
import os

# Using SQLite for simplicity in this hackathon/project environment
# But SQLAlchemy makes it easy to switch to PostgreSQL by changing the URL
SQLALCHEMY_DATABASE_URL = "sqlite:///./agrisense_schemes.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class SchemeSQL(Base):
    __tablename__ = "schemes"

    id = Column(Integer, primary_key=True, index=True)
    scheme_id = Column(String, unique=True, index=True)
    name = Column(String)
    description = Column(Text)
    details = Column(Text)
    benefits = Column(Text)
    eligibility_criteria = Column(JSON)   # Store rules as JSON
    documents_required = Column(JSON)
    source_url = Column(String, default="")   # myscheme.gov.in scheme page URL
    apply_url = Column(String, default="")    # Direct ministry application portal URL
    state = Column(String, default="National")

def init_db():
    Base.metadata.create_all(bind=engine)
    # Safe column migration — adds apply_url to existing DB if column not already present.
    # SQLite does not support IF NOT EXISTS in ALTER TABLE, so we catch the duplicate error.
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE schemes ADD COLUMN apply_url VARCHAR DEFAULT ''"))
            conn.commit()
    except Exception:
        pass  # Column already exists — expected after first run

def get_sql_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
