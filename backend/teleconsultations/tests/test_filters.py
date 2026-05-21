from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from teleconsultations.models import Teleconsultation
from datetime import timedelta
from django.utils import timezone

User = get_user_model()

class TeleconsultationFilterTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='user@v4h.com', password='123', role='SOLICITANTE')
        self.client.force_authenticate(user=self.user)
        self.url = reverse('teleconsultation-list')
        
        # Criando massa de dados para teste
        Teleconsultation.objects.create(
            solicitante=self.user, patient_name='Arthur Dent', 
            patient_birth_date='1979-01-01', specialty='CARDIOLOGIA', status='PENDENTE'
        )
        Teleconsultation.objects.create(
            solicitante=self.user, patient_name='Ford Prefect', 
            patient_birth_date='1979-01-01', specialty='ODONTOLOGIA', status='CONCLUIDA'
        )
        
        # Uma consulta antiga
        old_tc = Teleconsultation.objects.create(
            solicitante=self.user, patient_name='Tricia McMillan', 
            patient_birth_date='1985-05-05', specialty='CARDIOLOGIA', status='PENDENTE'
        )
        Teleconsultation.objects.filter(pk=old_tc.pk).update(created_at=timezone.now() - timedelta(days=10))

    def test_filter_by_patient_name(self):
        """Testa a busca textual pelo nome do paciente"""
        response = self.client.get(self.url, {'patient_name': 'Arthur'})
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['patient_name'], 'Arthur Dent')

    def test_filter_by_status(self):
        """Testa o filtro por status"""
        response = self.client.get(self.url, {'status': 'CONCLUIDA'})
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['patient_name'], 'Ford Prefect')

    def test_filter_by_date_range(self):
        """Testa o filtro por intervalo de datas"""
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        
        response = self.client.get(self.url, {
            'start_date': yesterday.isoformat(),
            'end_date': today.isoformat()
        })
        # Deve encontrar 2 (Arthur e Ford), mas não a Tricia (10 dias atrás)
        self.assertEqual(len(response.data), 2)
