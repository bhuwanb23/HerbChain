from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404
import json
from .models import Health, User, Herb, OwnershipTransfer
from django.utils import timezone


def index(request):
    return JsonResponse({
        'name': 'HerbChain Django Backend',
        'status': 'ready',
        'version': '0.1.0',
    })


def api_info(request):
    return JsonResponse({
        'name': 'HerbChain Django Backend',
        'status': 'ready',
        'version': '0.1.0',
        'endpoints': {
            'health': '/health',
            'ping': '/api/v1/ping',
            'admin': '/admin'
        }
    })


def health(request):
    Health.objects.create(status='healthy')
    return JsonResponse({'status': 'healthy'})


def ping(request):
    return JsonResponse({'message': 'pong'})


def admin_dashboard(request):
    return JsonResponse({
        'name': 'HerbChain Admin',
        'status': 'ready',
        'message': 'Admin panel ready - database reset for new schema',
        'endpoints': {
            'stats': '/admin/api/stats',
            'health': '/admin/api/health',
            'logs': '/admin/api/logs'
        }
    })


def admin_stats(request):
    # Basic dummy stats
    stats = {
        'total_farmers': User.objects.filter(role='farmer').count(),
        'total_batches': Herb.objects.count(),
        'recent_batches': Herb.objects.count(),
        'status': 'ready'
    }
    return JsonResponse(stats)


def admin_health(request):
    return JsonResponse({
        'status': 'healthy',
        'database': 'ready',
        'timestamp': timezone.now().isoformat()
    })


def admin_logs(request):
    # No log file in scaffold; return placeholder
    return JsonResponse({'logs': ['No log file found - scaffold']})


@csrf_exempt
def list_users(request):
    if request.method == 'GET':
        users = [u.to_dict() for u in User.objects.all()]
        return JsonResponse({'users': users, 'total': len(users)})

    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
        except Exception:
            return HttpResponseBadRequest('Invalid JSON')

        user_id = data.get('user_id') or f"{data.get('role','user')}_{timezone.now().timestamp()}"
        if User.objects.filter(user_id=user_id).exists():
            return JsonResponse({'error': 'User ID already exists'}, status=400)
        if User.objects.filter(email=data.get('email')).exists():
            return JsonResponse({'error': 'Email already exists'}, status=400)

        user = User(
            user_id=user_id,
            role=data.get('role'),
            name=data.get('name'),
            email=data.get('email'),
            password_hash=data.get('password_hash', 'default_password'),
            phone=data.get('phone'),
            location=data.get('location'),
            language_pref=data.get('language_pref', 'en'),
            kyc_verified=data.get('kyc_verified', False)
        )
        user.save()
        return JsonResponse({'message': 'User created successfully', 'user': user.to_dict()}, status=201)


@csrf_exempt
def get_user(request, user_id):
    user = get_object_or_404(User, user_id=user_id)
    return JsonResponse(user.to_dict())


@csrf_exempt
def update_user(request, user_id):
    user = get_object_or_404(User, user_id=user_id)
    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return HttpResponseBadRequest('Invalid JSON')

    allowed = ['name', 'phone', 'location', 'language_pref', 'kyc_verified']
    for field in allowed:
        if field in data:
            setattr(user, field, data[field])
    user.save()
    return JsonResponse({'message': 'User updated successfully', 'user': user.to_dict()})


@csrf_exempt
def create_sample_accounts(request):
    sample_users = [
        {
            'user_id': 'farmer_001', 'role': 'farmer', 'name': 'Rajesh Kumar', 'email': 'rajesh@example.com',
            'phone': '+91-9876543210', 'password_hash': 'dev_farmer_001', 'location': 'Pune, Maharashtra', 'kyc_verified': True
        },
        {
            'user_id': 'transporter_001', 'role': 'transporter', 'name': 'Amit Singh', 'email': 'amit@example.com',
            'phone': '+91-9876543211', 'password_hash': 'dev_transporter_001', 'location': 'Mumbai, Maharashtra', 'kyc_verified': True
        },
        {
            'user_id': 'lab_001', 'role': 'lab', 'name': 'Dr. Priya Sharma', 'email': 'priya@example.com',
            'phone': '+91-9876543212', 'password_hash': 'dev_lab_001', 'location': 'Delhi, India', 'kyc_verified': True
        }
    ]
    created = []
    for u in sample_users:
        if User.objects.filter(user_id=u['user_id']).exists():
            continue
        user = User(**u)
        user.save()
        created.append(u['user_id'])
    return JsonResponse({'message': 'Sample accounts created successfully', 'created_users': created, 'total_created': len(created)})


@csrf_exempt
def login(request):
    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return HttpResponseBadRequest('Invalid JSON')
    user_id = data.get('user_id')
    password = data.get('password')
    if not user_id or not password:
        return JsonResponse({'error': 'user_id and password required'}, status=400)
    try:
        user = User.objects.get(user_id=user_id)
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    if user.password_hash != password:
        return JsonResponse({'error': 'Invalid password'}, status=401)
    return JsonResponse({'message': 'Login successful', 'user': user.to_dict()})


@csrf_exempt
def list_herbs(request):
    if request.method == 'GET':
        herbs = [h.to_dict() for h in Herb.objects.all()]
        return JsonResponse({'batches': herbs, 'total': len(herbs)})
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
        except Exception:
            return HttpResponseBadRequest('Invalid JSON')
        batch_id = data.get('batch_id')
        if not batch_id:
            return JsonResponse({'error': 'batch_id required'}, status=400)
        if Herb.objects.filter(batch_id=batch_id).exists():
            return JsonResponse({'error': 'Batch exists'}, status=400)
        farmer = None
        if data.get('farmer_id'):
            farmer = User.objects.filter(user_id=data.get('farmer_id')).first()
        herb = Herb(
            batch_id=batch_id,
            farmer=farmer,
            species_name=data.get('species_name',''),
            image_url=data.get('image_url'),
            harvest_date=data.get('harvest_date'),
            location=data.get('location'),
            weight_kg=data.get('weight_kg'),
            quality_status=data.get('quality_status','pending'),
            active_qr=data.get('active_qr')
        )
        herb.save()
        return JsonResponse({'message': 'Herb created', 'herb': herb.to_dict()}, status=201)


def get_herb(request, batch_id):
    herb = get_object_or_404(Herb, batch_id=batch_id)
    return JsonResponse(herb.to_dict())


@csrf_exempt
def translate(request):
    # Stub translation endpoint
    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return HttpResponseBadRequest('Invalid JSON')
    text = data.get('text', '')
    # Echo back for now
    return JsonResponse({'translated_text': text, 'lang': data.get('lang','en')})
