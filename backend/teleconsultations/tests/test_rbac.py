from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from teleconsultations.models import Teleconsultation

User = get_user_model()

class RBACFilaEspecialistaTest(APITestCase):
    def setUp(self):
        self.solicitante = User.objects.create_user(email='sol@v4h.com', password='123', role='SOLICITANTE')
        
        # Criando dois especialistas de áreas diferentes
        self.medico_cardio = User.objects.create_user(
            email='cardio@v4h.com', password='123', role='ESPECIALISTA', specialty='CARDIOLOGIA'
        )
        self.medico_odontolo = User.objects.create_user(
            email='odonto@v4h.com', password='123', role='ESPECIALISTA', specialty='ODONTOLOGIA'
        )
        
        # Criando demandas em áreas distintas
        Teleconsultation.objects.create(
            solicitante=self.solicitante, patient_name='P1', patient_birth_date='2000-01-01', specialty='CARDIOLOGIA'
        )
        Teleconsultation.objects.create(
            solicitante=self.solicitante, patient_name='P2', patient_birth_date='1995-05-05', specialty='ODONTOLOGIA'
        )
        
        self.url = reverse('teleconsultation-list')

    def test_fila_trabalho_filtrada_por_especialidade_medica(self):
        """Garante que o especialista só veja as consultas da sua exata área via API (RF009)"""
        # Autenticando o cardiologista
        self.client.force_authenticate(user=self.medico_cardio)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Deve encontrar apenas 1 consulta (a de Cardiologia)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['patient_name'], 'P1')
        self.assertEqual(response.data[0]['specialty'], 'CARDIOLOGIA')
        
        # Autenticando o odontologista
        self.client.force_authenticate(user=self.medico_odontolo)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['patient_name'], 'P2')
        self.assertEqual(response.data[0]['specialty'], 'ODONTOLOGIA')

    def test_acesso_negado_outra_especialidade(self):
        """Garante que um especialista não consiga acessar os detalhes de uma consulta de outra área"""
        tc_odonto = Teleconsultation.objects.filter(specialty='ODONTOLOGIA').first()
        detail_url = reverse('teleconsultation-detail', kwargs={'pk': tc_odonto.pk})
        
        self.client.force_authenticate(user=self.medico_cardio)
        response = self.client.get(detail_url)
        
        # Como a queryset da View já deve filtrar por permissão/especialidade, deve retornar 404 ou 403
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)