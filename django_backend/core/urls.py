from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('api/', views.api_info, name='api_info'),
    path('health', views.health, name='health'),
    path('api/v1/ping', views.ping, name='ping'),

    # Admin-like routes
    path('admin/', views.admin_dashboard, name='admin_dashboard'),
    path('admin/api/stats', views.admin_stats, name='admin_stats'),
    path('admin/api/health', views.admin_health, name='admin_health'),
    path('admin/api/logs', views.admin_logs, name='admin_logs'),

    # Users
    path('api/v1/users/', views.list_users, name='list_users'),
    path('api/v1/users/sample/create', views.create_sample_accounts, name='create_sample_accounts'),
    path('api/v1/users/auth/login', views.login, name='login'),
    path('api/v1/users/<str:user_id>', views.get_user, name='get_user'),
    path('api/v1/users/<str:user_id>/update', views.update_user, name='update_user'),

    # Herbs
    path('api/v1/herbs/', views.list_herbs, name='list_herbs'),
    path('api/v1/herbs/<str:batch_id>', views.get_herb, name='get_herb'),

    # Translate stub
    path('api/v1/translate', views.translate, name='translate'),
]
