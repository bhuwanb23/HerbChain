import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE','herbchaindj.settings')
import django
django.setup()
from django.test import Client
import json
client = Client()
# create sample users
r = client.post('/api/v1/users/sample/create')
print('create sample users', r.status_code, r.content.decode())
# create a herb
payload = {
    'farmer_id': 'farmer_001',
    'species_name': 'Basil',
    'harvest_date': '2025-09-01',
    'location': 'Pune',
    'weight_kg': 2.5
}
r2 = client.post('/api/v1/herbs/', data=json.dumps(payload), content_type='application/json')
print('create herb', r2.status_code, r2.content.decode())
if r2.status_code == 201:
    body = json.loads(r2.content.decode())
    batch = body.get('herb', {}).get('batch_id')
    print('batch id', batch)
    if batch:
        r3 = client.get(f'/api/v1/herbs/{batch}')
        print('get herb', r3.status_code, r3.content.decode())
