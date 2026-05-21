from django.urls import path
from .views import TeleconsultationListCreateView, TeleconsultationDetailView, FeedbackCreateView

urlpatterns = [
    path('', TeleconsultationListCreateView.as_view(), name='teleconsultation-list'),
    path('<uuid:pk>/', TeleconsultationDetailView.as_view(), name='teleconsultation-detail'),
    path('<uuid:pk>/feedback/', FeedbackCreateView.as_view(), name='feedback-create'),
]
