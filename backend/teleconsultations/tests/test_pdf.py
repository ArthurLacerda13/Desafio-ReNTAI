from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from teleconsultations.models import Teleconsultation, Feedback

User = get_user_model()

class TeleconsultationPDFTest(APITestCase):
    def setUp(self):
        self.solicitante = User.objects.create_user(email='sol@v4h.com', password='123', role='SOLICITANTE')
        self.especialista = User.objects.create_user(email='esp@v4h.com', password='123', role='ESPECIALISTA', specialty='CARDIOLOGIA')
        self.outro_user = User.objects.create_user(email='other@v4h.com', password='123', role='SOLICITANTE')
        
        self.tc = Teleconsultation.objects.create(
            solicitante=self.solicitante, 
            patient_name='A. Dent', 
            patient_birth_date='1979-01-01', 
            specialty='CARDIOLOGIA'
        )
        
        # Add feedback
        Feedback.objects.create(teleconsultation=self.tc, specialist=self.especialista, content="Parecer de teste.")
        
        self.url = reverse('teleconsultation-pdf', kwargs={'pk': self.tc.pk})

    def test_download_pdf_success(self):
        """Garante que o solicitante consegue baixar o PDF da sua própria consulta"""
        self.client.force_authenticate(user=self.solicitante)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/pdf')
        self.assertTrue(len(response.content) > 0)

    def test_download_pdf_unauthorized(self):
        """Garante que outro solicitante não consiga baixar o PDF de terceiros"""
        self.client.force_authenticate(user=self.outro_user)
        response = self.client.get(self.url)
        
        # Como o get_queryset da View de PDF não foi filtrado explicitamente (RetrieveAPIView padrão)
        # mas adicionamos uma trava no método get, deve retornar 403
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
