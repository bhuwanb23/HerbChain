Django is now the authoritative backend

What changed:
- The Flask backend previously in `backend/server/` has been moved to `backend/server_archive/` to make the migration reversible.
- Django backend (in `django_backend/`) is now the authoritative API provider.

Notes:
- The frontend app and test scripts were updated to point at the Django dev server on port 8000:
  - `App/constants/api.js` now prefers port 8000 for local development.
  - `test_traceability.py` uses `http://localhost:8000`.

How to run Django locally:
1. cd into `django_backend`
2. Create a virtualenv and install dependencies from `requirements.txt` if needed
3. Run `python manage.py migrate` then `python manage.py runserver 0.0.0.0:8000`

If you need the Flask backend later, it's available in `backend/server_archive/`.
