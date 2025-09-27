HerbChain Django backend scaffold

This folder contains a minimal Django project scaffold to get started.

Quick start (PowerShell):

```powershell
cd 'C:\Users\mkaka\Downloads\sih_2025\HerbChain\django_backend'
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
# Run migrations and start dev server
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

Then open http://localhost:8000/ in your browser.

Notes:
- This is a minimal scaffold. Add apps and settings as needed.
- SECRET_KEY is read from the environment; a default exists for development only.
