# Linkami Backend

This is the backend API for the Linkami application, built with FastAPI and SQLite.

## Prerequisites

- Python 3.9+
- `pip` package manager

## Installation

We recommend using a Python virtual environment (`venv`) to keep dependencies isolated.

1. **Navigate to the backend directory** (if you aren't already there):
   ```bash
   cd backend
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment**:
   - On **Linux / macOS**:
     ```bash
     source venv/bin/activate
     ```
   - On **Windows**:
     ```bash
     venv\Scripts\activate
     ```

4. **Install the dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Backend

With your virtual environment activated, you can start the FastAPI development server using `uvicorn`:

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. You can also access the interactive API documentation (Swagger UI) by navigating to `http://localhost:8000/docs` in your browser.

## Database

The application uses a local SQLite database named `linkami.db`. It is automatically generated and managed by SQLAlchemy when the application starts for the first time.
