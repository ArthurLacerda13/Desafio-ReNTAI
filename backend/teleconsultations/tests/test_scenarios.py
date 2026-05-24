from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from teleconsultations.models import Teleconsultation, Attachment
from unittest.mock import patch
import os

User = get_user_model()

class TeleconsultationScenariosTest(APITestCase):
    def setUp(self):
        # Users
        self.solicitante = User.objects.create_user(
            email='sol@v4h.com', password='123', role='SOLICITANTE'
        )
        self.especialista_cardio = User.objects.create_user(
            email='cardio@v4h.com', password='123', role='ESPECIALISTA', specialty='CARDIOLOGIA'
        )
        self.especialista_odonto = User.objects.create_user(
            email='odonto@v4h.com', password='123', role='ESPECIALISTA', specialty='ODONTOLOGIA'
        )
        self.admin_user = User.objects.create_user(
            email='admin@v4h.com', password='123', is_staff=True, is_superuser=True
        )

        # URLs
        self.list_url = reverse('teleconsultation-list')
        
        # Test Data
        self.valid_payload = {
            'patient_name': 'João Silva',
            'patient_birth_date': '1980-01-01',
            'specialty': 'CARDIOLOGIA',
            'diagnostic_hypothesis': 'Suspeita de algo',
            'clinical_history': 'Histórico longo',
        }
        self.attachment = SimpleUploadedFile("test.pdf", b"file_content", content_type="application/pdf")

    @patch('teleconsultations.services.ai_engine.MockAIEngine.validate_document')
    def test_full_lifecycle_success(self, mock_validate):
        """RF006, RF008, RF010: Test complete flow from creation to opinion"""
        mock_validate.return_value = {
            'score': 0.85, 'threshold': 0.60, 'provider': 'TEST_IA', 'timestamp': '2026-05-24T12:00:00Z'
        }
        
        # 1. Solicitante creates teleconsultation
        self.client.force_authenticate(user=self.solicitante)
        data = self.valid_payload.copy()
        data['attachment_files'] = [self.attachment]
        response = self.client.post(self.list_url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        tc_id = response.data['id']
        tc = Teleconsultation.objects.get(id=tc_id)
        self.assertEqual(tc.status, 'PENDENTE')
        
        # 2. Especialista cardio sees it in their queue (RF009)
        self.client.force_authenticate(user=self.especialista_cardio)
        response = self.client.get(self.list_url)
        self.assertEqual(len(response.data), 1)
        
        # 3. Especialista odonto DOES NOT see it
        self.client.force_authenticate(user=self.especialista_odonto)
        response = self.client.get(self.list_url)
        self.assertEqual(len(response.data), 0)
        
        # 4. Especialista cardio emits opinion (RF010)
        self.client.force_authenticate(user=self.especialista_cardio)
        opinion_url = reverse('feedback-create', kwargs={'pk': tc_id})
        opinion_data = {'content': 'Parecer médico detalhado.'}
        response = self.client.post(opinion_url, opinion_data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        tc.refresh_from_db()
        self.assertEqual(tc.status, 'CONCLUIDA')
        # Note: In this model, opinion is in the Feedback object
        self.assertEqual(tc.feedback.content, 'Parecer médico detalhado.')

    def test_rbac_solicitante_cannot_emit_opinion(self):
        """RF003: Solicitante cannot give opinion to their own case"""
        tc = Teleconsultation.objects.create(
            solicitante=self.solicitante, patient_name='P1', patient_birth_date='2000-01-01', specialty='CARDIOLOGIA'
        )
        url = reverse('feedback-create', kwargs={'pk': tc.pk})
        
        self.client.force_authenticate(user=self.solicitante)
        response = self.client.post(url, {'content': 'Tentando burlar'})
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_rbac_especialista_cannot_create_case(self):
        """RF003: Especialista role is restricted from creating cases"""
        self.client.force_authenticate(user=self.especialista_cardio)
        response = self.client.post(self.list_url, self.valid_payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_see_everything(self):
        """RBAC: Admin should bypass specialty filters and see all cases"""
        Teleconsultation.objects.create(
            solicitante=self.solicitante, patient_name='Cardio Case', patient_birth_date='2000-01-01', specialty='CARDIOLOGIA'
        )
        Teleconsultation.objects.create(
            solicitante=self.solicitante, patient_name='Odonto Case', patient_birth_date='2000-01-01', specialty='ODONTOLOGIA'
        )
        
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.list_url)
        self.assertEqual(len(response.data), 2)

    @patch('teleconsultations.services.ai_engine.MockAIEngine.validate_document')
    def test_ai_audit_persistence(self, mock_validate):
        """RNF005: Verify all 4 AI audit parameters are saved"""
        mock_validate.return_value = {
            'score': 0.99, 'threshold': 0.60, 'provider': 'AUDIT_PROV', 'timestamp': '2026-05-24T12:00:00Z'
        }
        
        self.client.force_authenticate(user=self.solicitante)
        data = self.valid_payload.copy()
        data['attachment_files'] = [self.attachment]
        self.client.post(self.list_url, data, format='multipart')
        
        att = Attachment.objects.first()
        self.assertEqual(att.ai_score, 0.99)
        self.assertEqual(att.ai_threshold, 0.60)
        self.assertEqual(att.ai_provider, 'AUDIT_PROV')
        self.assertIsNotNone(att.ai_timestamp)

    @patch('teleconsultations.services.ai_engine.MockAIEngine.validate_document')
    def test_ai_rejection_scenario(self, mock_validate):
        """RF008: Test rejection of teleconsultation when AI score is low"""
        mock_validate.return_value = {
            'score': 0.15, 'threshold': 0.60, 'provider': 'MOCK_IA', 'timestamp': '2026-05-24T12:00:00Z'
        }
        
        self.client.force_authenticate(user=self.solicitante)
        data = self.valid_payload.copy()
        data['attachment_files'] = [self.attachment]
        response = self.client.post(self.list_url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("rejeitado pela triagem IA", response.data['detail'])
        self.assertEqual(Teleconsultation.objects.count(), 0)
