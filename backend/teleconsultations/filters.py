from django_filters import rest_framework as filters
from django.db.models import Q
from .models import Teleconsultation

class TeleconsultationFilter(filters.FilterSet):
    # Unified search field for frontend compatibility
    q = filters.CharFilter(method='filter_by_all', label="Search (ID, Patient, Specialty)")
    
    status = filters.ChoiceFilter(choices=Teleconsultation.Status.choices)
    specialty = filters.ChoiceFilter(choices=Teleconsultation.Specialty.choices)
    start_date = filters.DateFilter(field_name="created_at", lookup_expr='date__gte')
    end_date = filters.DateFilter(field_name="created_at", lookup_expr='date__lte')

    class Meta:
        model = Teleconsultation
        fields = ['q', 'status', 'specialty', 'start_date', 'end_date']

    def filter_by_all(self, queryset, name, value):
        if not value:
            return queryset
            
        # Try to filter by ID (UUID), Patient Name, or Specialty Label
        return queryset.filter(
            Q(id__icontains=value) | 
            Q(patient_name__icontains=value) | 
            Q(specialty__icontains=value)
        )
