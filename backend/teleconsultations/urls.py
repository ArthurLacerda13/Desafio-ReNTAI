from django.urls import path
from .views import TeleconsultationListCreateView, TeleconsultationDetailView, FeedbackCreateView, TeleconsultationPDFView

urlpatterns = [
    path('', TeleconsultationListCreateView.as_view(), name='teleconsultation-list'),
    path('<uuid:pk>/', TeleconsultationDetailView.as_view(), name='teleconsultation-detail'),
    path('<uuid:pk>/pdf/', TeleconsultationPDFView.as_view(), name='teleconsultation-pdf'),
    path('<uuid:pk>/feedback/', FeedbackCreateView.as_view(), name='feedback-create'),
]
