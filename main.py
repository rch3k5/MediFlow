# main.py
# To run this application:
# 1. Make sure you have Python and a virtual environment set up.
# 2. Install the required libraries: pip install "fastapi[all]" motor python-dotenv
# 3. Create a file named .env in the same directory.
# 4. Add your MongoDB connection string to the .env file like this:
#    MONGO_DETAILS="ENTER DETAILS HERE"
# 5. In your terminal, run the command: uvicorn main:app --reload

import os
from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, datetime
import motor.motor_asyncio
from dotenv import load_dotenv
import os
from bson import ObjectId
from fastapi.middleware.cors import CORSMiddleware
from starlette.requests import Request # <-- ADD THIS IMPORT


# --- Load Environment Variables ---
load_dotenv()
MONGO_DETAILS = os.getenv("MONGO_DETAILS")

# --- Database Connection ---
if not MONGO_DETAILS:
    raise ValueError("MONGO_DETAILS environment variable not set. Please create a .env file.")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_DETAILS)
db = client.mediflow
patient_collection = db.get_collection("patients")
observation_collection = db.get_collection("observations")


# --- Pydantic Models ---

# Helper to allow Pydantic models to work with MongoDB's _id
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, handler):
        # ## Bug Fix: Updated method signature for Pydantic v2 compatibility.
        # This now accepts the extra 'handler' argument.
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema, handler):
        return {"type": "string"}

# ## Refactor: Use separate models for input and output.

class PatientBase(BaseModel):
    """Model with fields a user provides when creating a patient."""
    mrn: str
    first_name: str
    last_name: str
    date_of_birth: date

class Patient(PatientBase):
    """Model representing a patient record from the database."""
    id: PyObjectId = Field(alias="_id")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class ObservationBase(BaseModel):
    """Model with fields a user provides when creating an observation."""
    type: str
    value: str
    unit: str

class Observation(ObservationBase):
    """Model representing an observation record from the database."""
    id: PyObjectId = Field(alias="_id")
    patient_id: str
    timestamp: datetime = Field(default_factory=datetime.now)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


# --- Initialize the FastAPI Application ---
app = FastAPI(
    title="MediFlow API",
    description="A simulated API for exchanging simplified clinical data.",
    version="1.0.5"
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

live_frontend_url = os.getenv("FRONTEND_URL")
if live_frontend_url:
    origins.append(live_frontend_url)

# This is a good place to print our configuration to the logs on startup
print("--- MediFlow API Starting Up ---")
live_frontend_url = os.getenv("FRONTEND_URL")
print(f"Read FRONTEND_URL from env: {live_frontend_url}") # This will show us if it was read
if live_frontend_url:
    origins.append(live_frontend_url)
print(f"Final Allowed CORS Origins: {origins}")
print("---------------------------------")


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API Endpoints ---

@app.get("/")
def read_root():
    return {"message": "Welcome to the MediFlow API. Go to /docs for interactive documentation."}

# --- Patient Endpoints ---

@app.post("/patients", response_model=Patient, status_code=201)
async def create_patient(patient: PatientBase = Body(...)):
    """Creates a new patient record."""
    patient_dict = patient.model_dump()
    # ## Bug Fix: Convert date to datetime for MongoDB compatibility.
    # MongoDB's BSON format requires a datetime object, not just a date.
    patient_dict["date_of_birth"] = datetime.combine(patient.date_of_birth, datetime.min.time())
    new_patient = await patient_collection.insert_one(patient_dict)
    created_patient = await patient_collection.find_one({"_id": new_patient.inserted_id})
    return created_patient

@app.get("/patients", response_model=List[Patient])
async def get_all_patients():
    """Retrieves a list of all patients in the system."""
    patients = await patient_collection.find().to_list(1000)
    return patients

@app.get("/patients/{patient_id}", response_model=Patient)
async def get_patient_by_id(patient_id: str):
    """Retrieves a single patient by their unique ID."""
    try:
        oid = ObjectId(patient_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid patient ID format")

    patient = await patient_collection.find_one({"_id": oid})
    if patient:
        return patient
    raise HTTPException(status_code=404, detail="Patient not found")

# --- Observation Endpoints ---

@app.post("/patients/{patient_id}/observations", response_model=Observation, status_code=201)
async def create_observation_for_patient(patient_id: str, observation: ObservationBase = Body(...)):
    """Adds a new observation for a specific patient."""
    await get_patient_by_id(patient_id) # Check if the patient exists

    observation_dict = observation.model_dump()
    observation_dict["patient_id"] = patient_id
    observation_dict["timestamp"] = datetime.now()
    
    new_observation = await observation_collection.insert_one(observation_dict)
    created_observation = await observation_collection.find_one({"_id": new_observation.inserted_id})
    return created_observation

@app.get("/patients/{patient_id}/observations", response_model=List[Observation])
async def get_observations_for_patient(patient_id: str):
    """Retrieves all observations recorded for a specific patient."""
    await get_patient_by_id(patient_id) # Check if the patient exists

    observations = await observation_collection.find({"patient_id": patient_id}).to_list(1000)
    return observations

