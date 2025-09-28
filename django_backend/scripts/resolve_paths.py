import django
from django.urls import resolve
import sys

django.setup()
paths = ['/api/v1/herbs/pending_pickup','/api/v1/herbs/pending_pickup/','/api/v1/herbs','/api/v1/herbs/']
for path in paths:
    try:
        match = resolve(path)
        print(path, '->', match.view_name, getattr(match.func, '__name__', str(match.func)))
    except Exception as e:
        print(path, '-> RESOLVE ERROR', type(e).__name__, e)
