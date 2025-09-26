MediFlow - A Simulated Clinical Data Exchange Platform
Live Demo: https://4y29mhui67.us-east-2.awsapprunner.com

MediFlow is a full-stack web application designed to simulate a modern medical data exchange. It was built to bridge the gap between traditional clinical engineering and modern software development, demonstrating key skills in API design, cloud deployment, and front-end development.

(A simple diagram showing React -> FastAPI -> MongoDB, all running in containers on AWS)

Key Features
Patient Roster: Create, view, and manage a list of simulated patients.

Clinical Observations: Add and view time-stamped observations (e.g., vitals, lab results) for each patient.

RESTful API: A clean, documented API for all data interactions.

Responsive UI: A modern, professional user interface built with React and shadcn/ui that works on both desktop and mobile.

Tech Stack
This project utilizes a modern, cloud-native tech stack:

Frontend: React, Vite, Tailwind CSS, shadcn/ui

Backend: Python, FastAPI

Database: MongoDB (via MongoDB Atlas)

Containerization: Docker, Docker Compose

Cloud & Deployment: AWS (Amazon ECR, AWS App Runner)

Running Locally
To run this project on your local machine, ensure you have Docker Desktop installed.

Clone the repository:

git clone [https://github.com/your-username/mediflow.git](https://github.com/your-username/mediflow.git)
cd mediflow

Create your environment file:
Create a .env file in the root directory and add your MongoDB connection string:

MONGO_DETAILS="your-mongodb-connection-string"

Build and run with Docker Compose:

docker compose up --build

The frontend will be available at http://localhost:5173 and the backend at http://localhost:8000.

Deployment Architecture
The application is fully containerized and deployed on AWS.

The frontend and backend Docker images are stored in Amazon ECR.

Both services are deployed and managed by AWS App Runner, which provides automatic scaling, load balancing, and HTTPS.

Future Goals (Roadmap)
[ ] Implement a Redis cache for frequently accessed patient data.

[ ] Build an ingestion endpoint to parse and store data from raw HL7 messages.

[ ] Add functionality to upload and extract metadata from DICOM files.
