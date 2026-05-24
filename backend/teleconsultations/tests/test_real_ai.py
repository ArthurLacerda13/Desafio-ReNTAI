from django.test import TestCase
from teleconsultations.services.ai_engine import LocalContentAIEngine
from django.core.files.uploadedfile import SimpleUploadedFile
from reportlab.pdfgen import canvas
import io

class RealAIEngineTest(TestCase):
    def setUp(self):
        self.engine = LocalContentAIEngine()

    def create_pdf(self, content):
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer)
        p.drawString(100, 750, content)
        p.showPage()
        p.save()
        buffer.seek(0)
        return buffer

    def test_validate_clinical_document(self):
        """Test that a PDF with clinical keywords gets a high score"""
        pdf_content = "Relatório Médico: O paciente João Silva apresenta diagnóstico de hipertensão. CPF: 123.456.789-00."
        pdf_buffer = self.create_pdf(pdf_content)
        file_obj = SimpleUploadedFile("laudo.pdf", pdf_buffer.read(), content_type="application/pdf")
        
        result = self.engine.validate_document(file_obj)
        
        # Should have keywords: relatório, médico, paciente, diagnóstico, cpf
        self.assertGreaterEqual(result['score'], 0.6)
        self.assertEqual(result['provider'], 'LocalNLP-v1 (PyMuPDF)')

    def test_validate_invalid_document(self):
        """Test that a PDF without clinical keywords gets a low score"""
        pdf_content = "Esta é apenas uma lista de compras: Arroz, feijão, batata e refrigerante."
        pdf_buffer = self.create_pdf(pdf_content)
        file_obj = SimpleUploadedFile("compras.pdf", pdf_buffer.read(), content_type="application/pdf")
        
        result = self.engine.validate_document(file_obj)
        
        self.assertLess(result['score'], 0.6)

    def test_empty_pdf(self):
        """Test behavior with an empty PDF"""
        pdf_buffer = io.BytesIO()
        p = canvas.Canvas(pdf_buffer)
        p.showPage()
        p.save()
        pdf_buffer.seek(0)
        file_obj = SimpleUploadedFile("empty.pdf", pdf_buffer.read(), content_type="application/pdf")
        
        result = self.engine.validate_document(file_obj)
        self.assertLess(result['score'], 0.4)
