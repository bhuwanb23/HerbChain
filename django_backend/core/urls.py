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
    path('admin/api/farmers', views.admin_get_farmers, name='admin_get_farmers'),
    path('admin/api/batches', views.admin_get_batches, name='admin_get_batches'),
    path('admin/api/backup', views.admin_backup, name='admin_backup'),
    path('admin/api/reset', views.admin_reset, name='admin_reset'),

    # Users
    path('api/v1/users/', views.list_users, name='list_users'),
    # Accept requests without trailing slash (some clients omit it)
    path('api/v1/users', views.list_users, name='list_users_no_slash'),
    path('api/v1/users/sample/create', views.create_sample_accounts, name='create_sample_accounts'),
    path('api/v1/users/auth/login', views.login, name='login'),
    path('api/v1/users/role/<str:role>', views.users_by_role_endpoint, name='users_by_role'),
    path('api/v1/users/<str:user_id>', views.user_detail, name='user_detail'),
    path('api/v1/users/<str:user_id>/update', views.user_detail, name='update_user'),

    # Herbs
    path('api/v1/herbs/', views.list_herbs, name='list_herbs'),
    # Accept requests without trailing slash (some clients omit it)
    path('api/v1/herbs', views.list_herbs, name='list_herbs_no_slash'),
    path('api/v1/herbs/<str:batch_id>', views.get_herb, name='get_herb'),
    path('api/v1/herbs/<str:batch_id>/ownership', views.get_ownership_history, name='get_ownership_history'),
    path('api/v1/herbs/<str:batch_id>/qr', views.get_current_qr, name='get_current_qr'),
    path('api/v1/herbs/<str:batch_id>/qr_image', views.get_qr_image, name='get_qr_image'),
    path('api/v1/herbs/available', views.get_available_herbs, name='get_available_herbs'),
    path('api/v1/herbs/farmer/<str:farmer_id>', views.get_herbs_by_farmer, name='get_herbs_by_farmer'),
    path('api/v1/herbs/<str:batch_id>/accept', views.accept_herb_for_testing, name='accept_herb_for_testing'),
    path('api/v1/herbs/lab/<str:lab_id>/accepted', views.get_lab_accepted_herbs, name='get_lab_accepted_herbs'),
    path('api/v1/herbs/pending_pickup', views.get_pending_pickup, name='get_pending_pickup'),
    path('api/v1/herbs/<str:batch_id>/pickup', views.pickup_herb, name='pickup_herb'),
    path('api/v1/herbs/transporter/<str:transporter_id>/active', views.get_transporter_active, name='get_transporter_active'),
    path('api/v1/herbs/transporter/<str:transporter_id>/completed', views.get_transporter_completed, name='get_transporter_completed'),
    path('api/v1/herbs/<str:batch_id>/deliver', views.deliver_to_lab, name='deliver_to_lab'),
    path('api/v1/herbs/lab/<str:lab_id>/archived', views.get_lab_archived, name='get_lab_archived'),
    path('api/v1/herbs/lab/<str:lab_id>/testing', views.get_lab_testing_queue, name='get_lab_testing_queue'),
    path('api/v1/herbs/<str:batch_id>/lab_report', views.create_lab_report, name='create_lab_report'),
    # `create_lab_report` now handles GET list and POST create similar to Flask
    # compatibility route retained for older callers
    path('api/v1/herbs/<str:batch_id>/lab_report/list', views.create_lab_report, name='list_lab_reports'),
    path('api/v1/herbs/approved_for_manufacturer', views.get_approved_for_manufacturer, name='get_approved_for_manufacturer'),
    path('api/v1/herbs/<str:batch_id>/order_by_manufacturer', views.order_by_manufacturer, name='order_by_manufacturer'),
    path('api/v1/herbs/<str:batch_id>/receive_by_manufacturer', views.receive_by_manufacturer, name='receive_by_manufacturer'),
    path('api/v1/herbs/<str:batch_id>/deliver_to_manufacturer', views.deliver_to_manufacturer, name='deliver_to_manufacturer'),
    path('api/v1/herbs/manufacturer/<str:manufacturer_id>/ordered', views.manufacturer_ordered, name='manufacturer_ordered'),
    path('api/v1/herbs/<str:batch_id>/traceability', views.traceability, name='traceability'),

    # Translate endpoints
    path('api/v1/translate', views.translate, name='translate'),
    path('api/v1/translate/text', views.translate, name='translate_text'),
    path('api/v1/translate/batch', views.translate, name='translate_batch'),
    path('api/v1/translate/payments', views.translate, name='translate_payments'),
    path('api/v1/translate/herb-data', views.translate, name='translate_herb_data'),
    path('api/v1/translate/cache/stats', views.translate_cache_stats, name='translate_cache_stats'),
    path('api/v1/translate/cache/clear', views.translate_cache_clear, name='translate_cache_clear'),
    path('api/v1/translate/languages', views.translate_languages, name='translate_languages'),
]
