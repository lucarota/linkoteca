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

To automatically install and run the backend as a service in `/opt/linkami/backend`, you can use the provided script:

1. `cd backend`
2. `sudo ./install.sh`

**What does the script do?**
Under the hood, the script sets up the `/opt/linkami/backend` directory and manages the `systemd` configuration using the following commands:
- `sudo cp linkami-backend.service /etc/systemd/system/`: Copies the service configuration file to the system's service directory so systemd can recognize it.
- `sudo systemctl enable linkami-backend`: Tells systemd to automatically start this service every time the server boots up.
- `sudo systemctl start linkami-backend`: Starts the service immediately in the background.

## Frontend

To run the frontend:

1. `cd frontend`
2. `npm install`
3. `npm run dev`

## Migration from Linkstore

If you are migrating from Linkstore, you can use the `migrate_from_linkstore.py` script to automatically transfer all your saved links to Linkami.

**How it works:**
The script fetches your links from the Linkstore API and sends them to your Linkami instance. Please note that as a normal behavior of Linkstore, the links fetched from linkstore.app will be archived during this process.

**Usage:**
```bash
python migrate_from_linkstore.py <LINKSTORE_TOKEN> <LINKAMI_TOKEN>
```

You will need both authorization tokens:
- **`LINKSTORE_TOKEN`**: Found in the "Settings" page of linkstore.app.
- **`LINKAMI_TOKEN`**: Found in the "Settings" page of Linkami.

**Example:**
```bash
python migrate_from_linkstore.py your_linkstore_token your_linkami_token
```
