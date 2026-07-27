# Linkoteca

This is a free reimplementation of linkstore.app built with Python and React.

🚀 **Try it out now!** A ready-to-use installation is available at [linkoteca.it](https://linkoteca.it).

## Features

- **Public Collections Directory**: Linkoteca includes a public directory where users can share their public collections. You have full control over this feature: you can decide whether to make your collection public and whether to list it in the public directory directly from your settings page.

## Backend

To run the backend:

1. `cd backend`
2. `python -m venv venv`
3. `source venv/bin/activate`
4. `pip install -r requirements.txt`
5. `uvicorn main:app --reload --port 8000`

### Running in Production (as a Service)

For production, it is highly recommended to run the backend as a background service using `systemd` and `Gunicorn`. This ensures the application restarts automatically on failure and boots up with the server.

To automatically install and run the backend as a service in `/opt/linkoteca/backend`, you can use the provided script:

1. `cd backend`
2. `sudo ./install.sh`

**What does the script do?**
Under the hood, the script sets up the `/opt/linkoteca/backend` directory and manages the `systemd` configuration using the following commands:
- `sudo cp linkoteca-backend.service /etc/systemd/system/`: Copies the service configuration file to the system's service directory so systemd can recognize it.
- `sudo systemctl enable linkoteca-backend`: Tells systemd to automatically start this service every time the server boots up.
- `sudo systemctl start linkoteca-backend`: Starts the service immediately in the background.

## Frontend

To run the frontend:

1. `cd frontend`
2. `npm install`
3. `npm run dev`

## Migration from Linkstore

You can easily migrate all your saved links from Linkstore to Linkoteca.

### Option 1: Via Web Interface (Recommended)

You can start the import process directly from your Linkoteca settings page.

1. Go to your collection **Settings** in Linkoteca.
2. Look for the **Import from Linkstore.app** section.
3. Enter your **Linkstore API Token**. You can find this token in the "Settings" page of your linkstore.app account.
4. Click "Start Import". The migration will run seamlessly in the background.

> **⚠️ Important Notes regarding the import:**
> - **Active links only:** Only your currently active (unarchived) links will be imported.
> - **Automatic archiving:** Please be aware that Linkstore automatically archives links as soon as they are retrieved during the import process. This is the standard behavior of Linkstore and it cannot be prevented.

### Option 2: Via Standalone Script

If you prefer the command line, you can use the `migrate_from_linkstore.py` script to automatically transfer all your saved links to Linkoteca.

**Usage:**
```bash
python migrate_from_linkstore.py <LINKSTORE_TOKEN> <LINKOTECA_TOKEN>
```

You will need both authorization tokens:
- **`LINKSTORE_TOKEN`**: Found in the "Settings" page of linkstore.app.
- **`LINKOTECA_TOKEN`**: Found in the "Settings" page of Linkoteca.

**Example:**
```bash
python migrate_from_linkstore.py your_linkstore_token your_linkoteca_token
```

## Credits

The SVG icons used in this project are provided by [Heroicons](https://heroicons.com/).

This project was inspired by [linkstore.app](https://linkstore.app/).

## Version History
See [CHANGELOG.md](https://github.com/lucarota/linkoteca/blob/master/CHANGELOG.md).

## Contributing
We welcome contributions! Please review the following guides:

- [Contributing Guidelines](https://github.com/lucarota/linkoteca/blob/master/CONTRIBUTING.md)
- [Code of Conduct](https://github.com/lucarota/linkoteca/blob/master/.github/CODE-OF-CONDUCT.md)

Also, consider sponsoring this project! ✌️

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.