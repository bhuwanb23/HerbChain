from django.http import JsonResponse


def index(request):
    return JsonResponse({
        'name': 'HerbChain Django Backend',
        'status': 'ready',
        'version': '0.1.0',
    })
