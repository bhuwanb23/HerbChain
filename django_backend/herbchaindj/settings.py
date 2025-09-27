import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'dev-django-secret-key-change-in-prod')

DEBUG = os.environ.get('DJANGO_DEBUG', '1') == '1'

# Host IP for local development (set via env var if needed)
# Default should match the machine LAN IP used by Expo/Metro
HOST_IP = os.environ.get('HOST_IP', '192.168.31.175')

ALLOWED_HOSTS = [HOST_IP, 'localhost', '127.0.0.1']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'core',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'herbchaindj.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'herbchaindj.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS settings for local development
# Allow the website dev server (commonly running on :8081) and localhost/emulator addresses
CORS_ALLOWED_ORIGINS = [
    'http://localhost:8081',
    'http://127.0.0.1:8081',
    'http://localhost:19006',
    'http://10.0.2.2:8000',
    # Allow requests from the host LAN IP used by Expo/Metro (ports may vary)
    f'http://{HOST_IP}:8081',
    f'http://{HOST_IP}:8082',
    f'http://{HOST_IP}:19006',
    f'http://{HOST_IP}:8000',
]

# For quick local development, also allow all origins (disable in production)
CORS_ALLOW_ALL_ORIGINS = True

# Do not automatically append slashes to URLs. This prevents Django from attempting
# to redirect POST requests to a trailing-slash URL (which would drop POST data).
APPEND_SLASH = False
