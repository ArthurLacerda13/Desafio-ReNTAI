from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TeleconsultationListCreateView, 
    TeleconsultationDetailView, 
    FeedbackCreateView, 
    TeleconsultationPDFView,
    AdminStatsView,
    GlobalConfigViewSet,
    SecureFileServeView
)

router = DefaultRouter()
router.register(r'', GlobalConfigViewSet, basename='global-config')

urlpatterns = [
    path('', TeleconsultationListCreateView.as_view(), name='teleconsultation-list'),
    path('stats/', AdminStatsView.as_view(), name='admin-stats'),
    path('config/', include(router.urls)),
    path('<uuid:pk>/', TeleconsultationDetailView.as_view(), name='teleconsultation-detail'),
    path('<uuid:pk>/pdf/', TeleconsultationPDFView.as_view(), name='teleconsultation-pdf'),
    path('attachment/<uuid:pk>/', SecureFileServeView.as_view(), name='secure-file-serve'),
    path('<uuid:pk>/feedback/', FeedbackCreateView.as_view(), name='feedback-create'),
]
