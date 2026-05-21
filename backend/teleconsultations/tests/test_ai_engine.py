import os
from unittest.mock import patch
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from teleconsultations.models import Teleconsultation, Attachment

User = get_user_model()

class AIEngineIntegrationTest(APITestCase):
    def setUp(self):
        self.solicitante = User.objects.create_user(
            email='solicitante@v4h.com',
            password='password123',
            role='SOLICITANTE'
        )
        self.url = reverse('teleconsultation-list')
        
    @patch('teleconsultations.services.ai_engine.MockAIEngine.validate_document')
    def test_ai_validation_success_via_api(self, mock_validate):
        """Garante que a API aceita a criação quando a IA aprova os documentos"""
        os.environ['AI_THRESHOLD'] = '0.60'
        mock_validate.return_value = {
            'score': 0.75,
            'threshold': 0.60,
            'provider': 'MOCK_ENGINE',
            'timestamp': '2026-05-21T10:00:00Z'
        }
        
        self.client.force_authenticate(user=self.solicitante)
        
        data = {
            'patient_name': 'A.F.A.L',
            'patient_birth_date': '2004-03-28',
            'specialty': 'CARDIOLOGIA',
            'diagnostic_hypothesis': 'Suspeita de Insuficiência Cardíaca',
            'clinical_history': 'Paciente apresentando dispneia aos esforços.',
            'attachment_files': [
                SimpleUploadedFile("exame.png", b"conteudo_de_imagem", content_type="image/png")
            ]
        }
        
        response = self.client.post(self.url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Teleconsultation.objects.count(), 1)
        self.assertEqual(Attachment.objects.first().ai_score, 0.75)

    @patch('teleconsultations.services.ai_engine.MockAIEngine.validate_document')
    def test_ai_validation_rejection_via_api(self, mock_validate):
        """Garante que a API rejeita a criação (400) quando a IA reprova o documento (RNF005)"""
        os.environ['AI_THRESHOLD'] = '0.60'
        mock_validate.return_value = {
            'score': 0.45,
            'threshold': 0.60,
            'provider': 'MOCK_ENGINE',
            'timestamp': '2026-05-21T10:00:00Z'
        }
        
        self.client.force_authenticate(user=self.solicitante)
        
        data = {
            'patient_name': 'J.S.',
            'patient_birth_date': '1990-05-10',
            'specialty': 'CARDIOLOGIA',
            'diagnostic_hypothesis': 'Suspeita de Arritmia',
            'clinical_history': 'Sente palpitações frequentes.',
            'attachment_files': [
                SimpleUploadedFile("borrado.jpg", b"imagem_ilegivel", content_type="image/jpeg")
            ]
        }

        response = self.client.post(self.url, data, format='multipart')

        # A View deve retornar 400 se a IA rejeitar ANTES de criar
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("rejeitado pela triagem IA", response.data['detail'])
        self.assertEqual(Teleconsultation.objects.count(), 0)