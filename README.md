# Linkami

This is a free reimplementation of linkstore.app built with Python and React.

## Backend

To run the backend:

1. `cd backend`
2. `python -m venv venv`
3. `source venv/bin/activate`
4. `pip install -r requirements.txt`
5. `uvicorn main:app --reload --port 8000`

### Running in Production (as a Service)

For production, it is highly recommended to run the backend as a background service using `systemd` and `Gunicorn`. This ensures the application restarts automatically on failure and boots up with the server.

To install and run the backend as a service in `/opt/linkami/backend`:

1. `cd backend`
2. `sudo ./install.sh`

This script will copy the files, create a production environment, and start the `linkami-backend` systemd service.

## Frontend

To run the frontend:

1. `cd frontend`
2. `npm install`
3. `npm run dev`
