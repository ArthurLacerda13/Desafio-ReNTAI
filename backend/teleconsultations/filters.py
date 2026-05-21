from django_filters import rest_framework as filters
from .models import Teleconsultation

class TeleconsultationFilter(filters.FilterSet):
    patient_name = filters.CharFilter(lookup_expr='icontains')
    start_date = filters.DateFilter(field_name="created_at", lookup_expr='date__gte')
    end_date = filters.DateFilter(field_name="created_at", lookup_expr='date__lte')

    class Meta:
        model = Teleconsultation
        fields = ['status', 'specialty', 'patient_name', 'start_date', 'end_date']
