import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE','herbchaindj.settings')
import django
django.setup()
from django.test import Client
c = Client()
r = c.get('/api/v1/ping')
print('status', r.status_code)
print(r.content.decode())
