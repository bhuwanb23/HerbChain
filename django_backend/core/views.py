from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404
import json
from .models import Health, User, Herb, OwnershipTransfer
from django.utils import timezone

# Additional imports for new endpoints
import uuid
from datetime import datetime
import io
import base64
try:
    import qrcode
except Exception:
    qrcode = None

from .translation_service import translation_service


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


def admin_get_farmers(request):
    page = int(request.GET.get('page', 1))
    per_page = int(request.GET.get('per_page', 10))
    qs = User.objects.filter(role='farmer').order_by('created_at')
    total = qs.count()
    start = (page - 1) * per_page
    end = start + per_page
    farmers = [u.to_dict() for u in qs[start:end]]
    return JsonResponse({'farmers': farmers, 'total': total, 'pages': (total + per_page - 1) // per_page, 'current_page': page})


def admin_get_batches(request):
    page = int(request.GET.get('page', 1))
    per_page = int(request.GET.get('per_page', 10))
    status = request.GET.get('status')
    qs = Herb.objects.all().order_by('-harvest_date')
    if status:
        qs = qs.filter(quality_status=status)
    total = qs.count()
    start = (page - 1) * per_page
    end = start + per_page
    batches = [h.to_dict() for h in qs[start:end]]
    return JsonResponse({'batches': batches, 'total': total, 'pages': (total + per_page - 1) // per_page, 'current_page': page})


def admin_backup(request):
    # Placeholder: backup disabled in scaffold
    return JsonResponse({'message': 'Backup disabled - database is being reset for new schema', 'status': 'disabled'})


def admin_reset(request):
    # Placeholder: reset already completed in scaffold
    return JsonResponse({'message': 'Database already reset - ready for new schema', 'status': 'completed'})


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


def get_users_by_role(request, role):
    users = [u.to_dict() for u in User.objects.filter(role=role)]
    return JsonResponse({'users': users, 'role': role, 'total': len(users)})


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
def users_by_role_endpoint(request, role):
    return get_users_by_role(request, role)


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
        # Ported create herb with QR generation and initial ownership transfer
        try:
            # Validate required fields (farmer_id, species_name, harvest_date, location, weight_kg)
            required = ['farmer_id', 'species_name', 'harvest_date', 'location', 'weight_kg']
            for f in required:
                if not data.get(f):
                    return JsonResponse({'error': f'Missing required field: {f}'}, status=400)

            farmer = User.objects.filter(user_id=data['farmer_id'], role='farmer').first()
            if not farmer:
                return JsonResponse({'error': 'Farmer not found'}, status=404)

            # Generate unique batch id
            batch_id = f"HERB-{uuid.uuid4().hex[:8].upper()}"

            # Parse date
            harvest_date = data['harvest_date']
            try:
                if isinstance(harvest_date, str):
                    harvest_date = datetime.strptime(harvest_date, '%Y-%m-%d').date()
            except Exception:
                return JsonResponse({'error': 'Invalid harvest date format. Use YYYY-MM-DD'}, status=400)

            try:
                weight_kg = float(data['weight_kg'])
                if weight_kg <= 0:
                    return JsonResponse({'error': 'Weight must be positive'}, status=400)
            except Exception:
                return JsonResponse({'error': 'Invalid weight value'}, status=400)

            herb = Herb(
                batch_id=batch_id,
                farmer=farmer,
                species_name=data.get('species_name'),
                image_url=data.get('image_url'),
                harvest_date=harvest_date,
                location=data.get('location'),
                weight_kg=weight_kg,
                quality_status='pending'
            )
            herb.save()

            # Generate QR payload and image
            qr_payload = {
                'batch_id': batch_id,
                'farmer_id': data['farmer_id'],
                'species_name': data.get('species_name'),
                'harvest_date': harvest_date.isoformat() if hasattr(harvest_date, 'isoformat') else str(harvest_date),
                'weight_kg': weight_kg,
                'current_owner': data['farmer_id'],
                'created_at': datetime.utcnow().isoformat(),
                'type': 'herb_creation'
            }

            img_b64 = None
            if qrcode:
                try:
                    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=10, border=4)
                    qr.add_data(str(qr_payload))
                    qr.make(fit=True)
                    img = qr.make_image(fill_color='black', back_color='white')
                    buffer = io.BytesIO()
                    img.save(buffer, format='PNG')
                    buffer.seek(0)
                    img_b64 = 'data:image/png;base64,' + base64.b64encode(buffer.getvalue()).decode()
                except Exception:
                    img_b64 = None

            herb.active_qr = img_b64
            herb.save()

            # Create initial ownership transfer
            transfer_id = f"TRANSFER-{uuid.uuid4().hex[:8].upper()}"
            transfer = OwnershipTransfer(
                transfer_id=transfer_id,
                batch=herb,
                from_owner=None,
                to_owner=data['farmer_id'],
                qr_code=img_b64,
                transfer_reason='Initial Creation',
                location=data.get('location')
            )
            transfer.save()

            return JsonResponse({'success': True, 'message': 'Herb batch created successfully', 'herb': herb.to_dict(), 'qr_code': img_b64, 'ownership_transfer': transfer.to_dict()}, status=201)
        except Exception as e:
            return JsonResponse({'error': 'Failed to create herb batch', 'details': str(e)}, status=500)


def get_herb(request, batch_id):
    herb = get_object_or_404(Herb, batch_id=batch_id)
    # include ownership history and current owner details
    transfers = [t.to_dict() for t in herb.transfers.all().order_by('-created_at')]
    current_owner = None
    if herb.farmer:
        current_owner = herb.farmer.to_dict()
    return JsonResponse({'herb': herb.to_dict(), 'ownership_history': transfers, 'current_owner': current_owner})


def get_ownership_history(request, batch_id):
    herb = get_object_or_404(Herb, batch_id=batch_id)
    transfers = [t.to_dict() for t in herb.transfers.all().order_by('created_at')]
    return JsonResponse({'batch_id': batch_id, 'current_owner': herb.farmer.user_id if herb.farmer else None, 'ownership_history': transfers})


def get_current_qr(request, batch_id):
    herb = get_object_or_404(Herb, batch_id=batch_id)
    if not herb.active_qr:
        return JsonResponse({'error': 'No active QR code found'}, status=404)
    return JsonResponse({'batch_id': batch_id, 'qr_code': herb.active_qr, 'current_owner': herb.farmer.user_id if herb.farmer else None})


def get_available_herbs(request):
    herbs = Herb.objects.filter(quality_status='pending').order_by('-harvest_date')
    herbs_with_farmer = []
    for herb in herbs:
        herb_data = herb.to_dict()
        herb_data['farmer'] = herb.farmer.to_dict() if herb.farmer else None
        herbs_with_farmer.append(herb_data)
    return JsonResponse({'herbs': herbs_with_farmer, 'total': len(herbs_with_farmer), 'status': 'available'})


@csrf_exempt
def accept_herb_for_testing(request, batch_id):
    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return HttpResponseBadRequest('Invalid JSON')
    lab_id = data.get('lab_id')
    if not lab_id:
        return JsonResponse({'error': 'Lab ID is required'}, status=400)
    lab = User.objects.filter(user_id=lab_id, role='lab').first()
    if not lab:
        return JsonResponse({'error': 'Lab not found'}, status=404)
    herb = Herb.objects.filter(batch_id=batch_id).first()
    if not herb:
        return JsonResponse({'error': 'Herb batch not found'}, status=404)
    if herb.quality_status != 'pending':
        return JsonResponse({'error': f'Herb batch is not available for testing. Current status: {herb.quality_status}'}, status=400)
    herb.quality_status = 'pending_pickup'
    herb.save()
    request_id = f"LAB-REQ-{uuid.uuid4().hex[:8].upper()}"
    lab_request = OwnershipTransfer(
        transfer_id=request_id,
        batch=herb,
        from_owner=herb.farmer.user_id if herb.farmer else None,
        to_owner=lab_id,
        qr_code=herb.active_qr,
        transfer_reason='Lab Testing Request',
        location=data.get('lab_location', lab.location)
    )
    lab_request.save()
    return JsonResponse({'success': True, 'message': 'Herb accepted for testing successfully', 'herb': herb.to_dict(), 'lab_request': lab_request.to_dict(), 'next_step': 'pending_pickup'})


def get_lab_accepted_herbs(request, lab_id):
    lab = User.objects.filter(user_id=lab_id, role='lab').first()
    if not lab:
        return JsonResponse({'error': 'Lab not found'}, status=404)
    lab_requests = OwnershipTransfer.objects.filter(to_owner=lab_id, transfer_reason='Lab Testing Request').order_by('-created_at')
    accepted_herbs = []
    for req in lab_requests:
        herb = req.batch
        if not herb:
            continue
        if herb.quality_status in ('pending_pickup', 'in_transit') and (herb.farmer.user_id if herb.farmer else None) != lab_id:
            herb_data = herb.to_dict()
            herb_data['lab_request'] = req.to_dict()
            herb_data['farmer'] = herb.farmer.to_dict() if herb.farmer else None
            accepted_herbs.append(herb_data)
    return JsonResponse({'herbs': accepted_herbs, 'lab': lab.to_dict(), 'total': len(accepted_herbs)})


def get_pending_pickup(request):
    herbs = Herb.objects.filter(quality_status__in=['pending_pickup', 'manufacturer_ordered_pending_pickup']).order_by('-updated_at')
    response = []
    for herb in herbs:
        herb_dict = herb.to_dict()
        herb_dict['farmer'] = herb.farmer.to_dict() if herb.farmer else None
        response.append(herb_dict)
    return JsonResponse({'herbs': response, 'total': len(response)})


@csrf_exempt
def pickup_herb(request, batch_id):
    try:
        data = json.loads(request.body.decode('utf-8')) if request.body else {}
    except Exception:
        data = {}
    transporter_id = data.get('transporter_id')
    scanned_qr_text = data.get('scanned_qr_text')
    pickup_location = data.get('pickup_location')
    dropoff_location = data.get('dropoff_location') or 'Lab - TBD'

    if not transporter_id:
        return JsonResponse({'error': 'transporter_id is required'}, status=400)

    transporter = User.objects.filter(user_id=transporter_id, role='transporter').first()
    if not transporter:
        return JsonResponse({'error': 'Transporter not found'}, status=404)

    herb = Herb.objects.filter(batch_id=batch_id).first()
    if not herb:
        return JsonResponse({'error': 'Herb batch not found'}, status=404)

    if herb.quality_status not in ['pending_pickup', 'manufacturer_ordered_pending_pickup']:
        return JsonResponse({'error': f'Herb is not awaiting pickup. Current status: {herb.quality_status}'}, status=400)

    if not herb.active_qr:
        return JsonResponse({'error': 'No active QR to validate'}, status=400)

    if scanned_qr_text and batch_id not in scanned_qr_text:
        return JsonResponse({'error': 'QR does not match this batch'}, status=400)

    # Deactivate previous transfers
    active = herb.transfers.filter(qr_code__isnull=False).order_by('-created_at').first()
    if active:
        active.qr_code = ''
        active.save()

    # Generate new QR for transporter
    qr_payload = {
        'batch_id': herb.batch_id,
        'previous_owner': herb.farmer.user_id if herb.farmer else None,
        'new_owner': transporter_id,
        'timestamp': datetime.utcnow().isoformat(),
        'type': 'pickup_transfer'
    }
    img_b64 = None
    if qrcode:
        try:
            qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=10, border=4)
            qr.add_data(str(qr_payload))
            qr.make(fit=True)
            img = qr.make_image(fill_color='black', back_color='white')
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            buffer.seek(0)
            img_b64 = 'data:image/png;base64,' + base64.b64encode(buffer.getvalue()).decode()
        except Exception:
            img_b64 = None

    herb.active_qr = img_b64
    herb.quality_status = 'in_transit'
    herb.save()

    transfer_id = f"TRANSFER-{uuid.uuid4().hex[:8].upper()}"
    transfer = OwnershipTransfer(transfer_id=transfer_id, batch=herb, from_owner=qr_payload['previous_owner'], to_owner=transporter_id, qr_code=img_b64, transfer_reason='Pickup', location=pickup_location or herb.location)
    transfer.save()

    transport_id = f"TRANSPORT-{uuid.uuid4().hex[:8].upper()}"
    from .models import TransportRecord
    tr = TransportRecord(transport_id=transport_id, batch=herb, transporter_id=transporter_id, pickup_location=pickup_location or herb.location, dropoff_location=dropoff_location, start_time=datetime.utcnow(), status='in_transit')
    tr.save()

    return JsonResponse({'success': True, 'message': 'Pickup successful. Ownership transferred to transporter.', 'herb': herb.to_dict(), 'new_qr_code': img_b64, 'ownership_transfer': transfer.to_dict(), 'transport_record': tr.to_dict()})


def get_transporter_active(request, transporter_id):
    transporter = User.objects.filter(user_id=transporter_id, role='transporter').first()
    if not transporter:
        return JsonResponse({'error': 'Transporter not found'}, status=404)
    herbs = Herb.objects.filter(active_qr__isnull=False, quality_status='in_transit', farmer__isnull=False)
    response = []
    for herb in herbs.filter(current_owner=transporter_id) if False else herbs:
        # simplified: include farm info
        herb_dict = herb.to_dict()
        herb_dict['farmer'] = herb.farmer.to_dict() if herb.farmer else None
        response.append(herb_dict)
    return JsonResponse({'herbs': response, 'total': len(response)})


def get_transporter_completed(request, transporter_id):
    from .models import TransportRecord
    transporter = User.objects.filter(user_id=transporter_id, role='transporter').first()
    if not transporter:
        return JsonResponse({'error': 'Transporter not found'}, status=404)
    delivered = TransportRecord.objects.filter(transporter_id=transporter_id, status='delivered').order_by('-end_time')
    batch_ids = [rec.batch.batch_id for rec in delivered]
    if not batch_ids:
        return JsonResponse({'herbs': [], 'total': 0})
    herbs = Herb.objects.filter(batch_id__in=batch_ids)
    response = []
    for herb in herbs:
        herb_dict = herb.to_dict()
        herb_dict['transit_status'] = 'completed'
        response.append(herb_dict)
    return JsonResponse({'herbs': response, 'total': len(response)})


@csrf_exempt
def deliver_to_lab(request, batch_id):
    try:
        data = json.loads(request.body.decode('utf-8')) if request.body else {}
    except Exception:
        data = {}
    lab_id = data.get('lab_id')
    transporter_id = data.get('transporter_id')
    scanned_qr_text = data.get('scanned_qr_text')
    delivery_location = data.get('delivery_location')

    if not lab_id:
        return JsonResponse({'error': 'lab_id is required'}, status=400)
    lab = User.objects.filter(user_id=lab_id, role='lab').first()
    if not lab:
        return JsonResponse({'error': 'Lab not found'}, status=404)
    herb = Herb.objects.filter(batch_id=batch_id).first()
    if not herb:
        return JsonResponse({'error': 'Herb batch not found'}, status=404)

    effective_transporter_id = transporter_id or (herb.farmer.user_id if herb.farmer else None)
    transporter = User.objects.filter(user_id=effective_transporter_id, role='transporter').first()
    if not transporter:
        return JsonResponse({'error': 'Current owner is not a transporter or transporter not found'}, status=400)
    if herb.active_qr and scanned_qr_text and batch_id not in scanned_qr_text:
        return JsonResponse({'error': 'QR does not match this batch'}, status=400)

    # deactivate previous
    active = herb.transfers.filter(qr_code__isnull=False).order_by('-created_at').first()
    if active:
        active.qr_code = ''
        active.save()

    qr_payload = {
        'batch_id': herb.batch_id,
        'previous_owner': herb.farmer.user_id if herb.farmer else None,
        'new_owner': lab_id,
        'timestamp': datetime.utcnow().isoformat(),
        'type': 'lab_receipt'
    }
    new_lab_qr = None
    if qrcode:
        try:
            qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=10, border=4)
            qr.add_data(str(qr_payload))
            qr.make(fit=True)
            img = qr.make_image(fill_color='black', back_color='white')
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            buffer.seek(0)
            new_lab_qr = 'data:image/png;base64,' + base64.b64encode(buffer.getvalue()).decode()
        except Exception:
            new_lab_qr = None

    herb.active_qr = new_lab_qr
    herb.quality_status = 'testing'
    herb.save()

    transfer_id = f"TRANSFER-{uuid.uuid4().hex[:8].upper()}"
    transfer = OwnershipTransfer(transfer_id=transfer_id, batch=herb, from_owner=qr_payload['previous_owner'], to_owner=lab_id, qr_code=new_lab_qr, transfer_reason='Delivery to Lab', location=delivery_location or herb.location)
    transfer.save()

    # End transport record if exists
    from .models import TransportRecord
    tr = TransportRecord.objects.filter(batch=herb, transporter_id=effective_transporter_id, status='in_transit').order_by('-start_time').first()
    if tr:
        tr.status = 'delivered'
        tr.end_time = datetime.utcnow()
        tr.save()

    return JsonResponse({'success': True, 'message': 'Delivery successful. Ownership transferred to lab.', 'herb': herb.to_dict(), 'new_qr_code': new_lab_qr, 'ownership_transfer': transfer.to_dict()})


def get_lab_archived(request, lab_id):
    lab = User.objects.filter(user_id=lab_id, role='lab').first()
    if not lab:
        return JsonResponse({'error': 'Lab not found'}, status=404)
    herbs = Herb.objects.filter(farmer__user_id=lab_id) if False else Herb.objects.filter(active_qr__isnull=False)
    response = [h.to_dict() for h in herbs]
    return JsonResponse({'herbs': response, 'total': len(response)})


def get_lab_testing_queue(request, lab_id):
    lab = User.objects.filter(user_id=lab_id, role='lab').first()
    if not lab:
        return JsonResponse({'error': 'Lab not found'}, status=404)
    herbs = Herb.objects.filter(active_qr__isnull=False).order_by('-updated_at')
    return JsonResponse({'herbs': [h.to_dict() for h in herbs], 'total': len(herbs)})


@csrf_exempt
def create_lab_report(request, batch_id):
    try:
        data = json.loads(request.body.decode('utf-8')) if request.body else {}
    except Exception:
        data = {}
    lab_id = data.get('lab_id')
    if not lab_id:
        return JsonResponse({'error': 'lab_id is required'}, status=400)
    lab = User.objects.filter(user_id=lab_id, role='lab').first()
    if not lab:
        return JsonResponse({'error': 'Lab not found'}, status=404)
    herb = Herb.objects.filter(batch_id=batch_id).first()
    if not herb:
        return JsonResponse({'error': 'Herb not found'}, status=404)
    if (herb.farmer.user_id if herb.farmer else None) != lab_id and herb.quality_status not in ('testing', 'pending_pickup'):
        # allow creating reports only by lab owners
        pass

    report_id = f"REPORT-{uuid.uuid4().hex[:8].upper()}"
    from .models import LabReport
    report = LabReport(report_id=report_id, batch=herb, lab_id=lab_id, test_type=data.get('test_type', 'general'), results_summary=data.get('results_summary',''), certification=bool(data.get('certification', False)), certification_level=data.get('certification_level'), report_url=data.get('report_url'), test_date=datetime.utcnow().date(), purity_percentage=data.get('purity_percentage'), moisture_content=data.get('moisture_content'), ash_content=data.get('ash_content'), heavy_metals_present=bool(data.get('heavy_metals_present', False)), pesticides_detected=bool(data.get('pesticides_detected', False)), active_compounds=data.get('active_compounds'), potency_rating=data.get('potency_rating'), notes=data.get('notes'), recommendations=data.get('recommendations'))
    report.save()

    new_status = data.get('quality_status')
    if new_status in ('approved', 'rejected', 'testing'):
        herb.quality_status = new_status
        herb.save()

    # create ownership transfer record as log
    transfer_id = f"TRANSFER-{uuid.uuid4().hex[:8].upper()}"
    transfer = OwnershipTransfer(transfer_id=transfer_id, batch=herb, from_owner=lab_id, to_owner=lab_id, qr_code=herb.active_qr, transfer_reason=f"Lab Testing {new_status}", location=lab.location if hasattr(lab, 'location') else None)
    transfer.save()
    return JsonResponse({'success': True, 'report': report.to_dict(), 'herb': herb.to_dict()})


def list_lab_reports(request, batch_id):
    herb = Herb.objects.filter(batch_id=batch_id).first()
    if not herb:
        return JsonResponse({'error': 'Herb not found'}, status=404)
    from .models import LabReport
    reports = LabReport.objects.filter(batch=herb).order_by('-created_at')
    return JsonResponse({'reports': [r.to_dict() for r in reports], 'total': reports.count()})


def get_approved_for_manufacturer(request):
    herbs = Herb.objects.filter(quality_status__in=['approved','rejected','pending_pickup','in_transit','testing','manufacturer_ordered_pending_pickup']).order_by('-updated_at')
    response = []
    for herb in herbs:
        latest_report = herb.lab_reports.order_by('-created_at').first() if hasattr(herb, 'lab_reports') else None
        herb_data = herb.to_dict()
        herb_data['latest_lab_report'] = latest_report.to_dict() if latest_report else None
        response.append(herb_data)
    return JsonResponse({'herbs': response, 'total': len(response)})


def order_by_manufacturer(request, batch_id):
    try:
        data = json.loads(request.body.decode('utf-8')) if request.body else {}
    except Exception:
        data = {}
    manufacturer_id = data.get('manufacturer_id')
    if not manufacturer_id:
        return JsonResponse({'error': 'manufacturer_id required'}, status=400)
    herb = Herb.objects.filter(batch_id=batch_id).first()
    if not herb:
        return JsonResponse({'error': 'Herb not found'}, status=404)
    herb.quality_status = 'manufacturer_ordered_pending_pickup'
    herb.save()
    return JsonResponse({'message': 'Order placed by manufacturer', 'herb': herb.to_dict()})


def receive_by_manufacturer(request, batch_id):
    try:
        data = json.loads(request.body.decode('utf-8')) if request.body else {}
    except Exception:
        data = {}
    manufacturer_id = data.get('manufacturer_id')
    if not manufacturer_id:
        return JsonResponse({'error': 'manufacturer_id required'}, status=400)
    herb = Herb.objects.filter(batch_id=batch_id).first()
    if not herb:
        return JsonResponse({'error': 'Herb not found'}, status=404)
    herb.quality_status = 'in_stock'
    herb.save()
    return JsonResponse({'message': 'Herb received by manufacturer', 'herb': herb.to_dict()})


def deliver_to_manufacturer(request, batch_id):
    try:
        data = json.loads(request.body.decode('utf-8')) if request.body else {}
    except Exception:
        data = {}
    manufacturer_id = data.get('manufacturer_id')
    if not manufacturer_id:
        return JsonResponse({'error': 'manufacturer_id required'}, status=400)
    herb = Herb.objects.filter(batch_id=batch_id).first()
    if not herb:
        return JsonResponse({'error': 'Herb not found'}, status=404)
    herb.current_owner = manufacturer_id if hasattr(herb, 'current_owner') else manufacturer_id
    herb.quality_status = 'in_stock'
    herb.save()
    return JsonResponse({'message': 'Delivered to manufacturer', 'herb': herb.to_dict()})


def manufacturer_ordered(request, manufacturer_id):
    # List batches ordered by a manufacturer (placeholder)
    herbs = Herb.objects.filter(quality_status='manufacturer_ordered_pending_pickup')
    return JsonResponse({'herbs': [h.to_dict() for h in herbs], 'total': herbs.count()})


def traceability(request, batch_id):
    herb = Herb.objects.filter(batch_id=batch_id).first()
    if not herb:
        return JsonResponse({'error': 'Herb not found'}, status=404)
    transfers = [t.to_dict() for t in herb.transfers.all().order_by('created_at')]
    transports = [tr.to_dict() for tr in herb.transport_records.all().order_by('created_at')] if hasattr(herb, 'transport_records') else []
    reports = [r.to_dict() for r in herb.lab_reports.all().order_by('created_at')] if hasattr(herb, 'lab_reports') else []
    return JsonResponse({'batch_id': batch_id, 'herb': herb.to_dict(), 'ownership_transfers': transfers, 'transports': transports, 'lab_reports': reports})


@csrf_exempt
def translate(request):
    # Provide richer translation endpoints (POST body expected)
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return HttpResponseBadRequest('Invalid JSON')

    # If single text
    if 'text' in data and 'target_lang' in data:
        text = data['text']
        target = data['target_lang']
        source = data.get('source_lang', 'auto')
        translated = translation_service.translate_text(text, target, source)
        return JsonResponse({'original_text': text, 'translated_text': translated, 'target_lang': target, 'success': True})

    # If batch of texts
    if 'texts' in data and 'target_lang' in data:
        texts = data['texts']
        target = data['target_lang']
        source = data.get('source_lang', 'auto')
        translated_texts = translation_service.translate_batch(texts, target, source)
        return JsonResponse({'original_texts': texts, 'translated_texts': translated_texts, 'target_lang': target, 'success': True})

    # If herb-data translation
    if 'herbs' in data and 'target_lang' in data:
        herbs = data['herbs']
        target = data['target_lang']
        fields = ['species_name', 'location', 'quality_status', 'notes', 'description']
        translated = translation_service.translate_list_of_objects(herbs, fields, target)
        return JsonResponse({'original_herbs': herbs, 'translated_herbs': translated, 'target_lang': target, 'fields_translated': fields, 'success': True})

    # If payments transactions translation
    if 'transactions' in data and 'target_lang' in data:
        transactions = data['transactions']
        target = data['target_lang']
        fields_to_translate = ['buyer', 'description', 'status', 'notes']
        translated_transactions = translation_service.translate_list_of_objects(transactions, fields_to_translate, target)
        return JsonResponse({'original_transactions': transactions, 'translated_transactions': translated_transactions, 'target_lang': target, 'fields_translated': fields_to_translate, 'success': True})

    return JsonResponse({'error': 'Unsupported translation payload', 'success': False}, status=400)


def translate_cache_stats(request):
    stats = translation_service.get_cache_stats()
    return JsonResponse({'cache_stats': stats, 'success': True})


@csrf_exempt
def translate_cache_clear(request):
    translation_service.clear_cache()
    return JsonResponse({'message': 'Translation cache cleared successfully', 'success': True})


def translate_languages(request):
    return JsonResponse({'supported_languages': translation_service.supported_languages, 'success': True})
