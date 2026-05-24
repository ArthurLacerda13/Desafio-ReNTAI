from abc import ABC, abstractmethod
import random
import time
import fitz  # PyMuPDF
from django.conf import settings
from django.utils import timezone
import io

def get_current_config():
    try:
        from teleconsultations.models import GlobalConfig
        config = GlobalConfig.objects.first()
        if not config:
            return {
                'threshold': float(getattr(settings, 'AI_THRESHOLD', 0.60)),
                'provider': getattr(settings, 'AI_PROVIDER', 'REAL').upper()
            }
        return {
            'threshold': config.ai_threshold,
            'provider': config.ai_provider.upper()
        }
    except:
        return {
            'threshold': 0.60,
            'provider': 'REAL'
        }

class BaseAIEngine(ABC):
    @abstractmethod
    def validate_document(self, file_obj) -> dict:
        """
        Validates a document and returns a dictionary with:
        - score: float (0.0 to 1.0)
        - provider: str
        - threshold: float
        - timestamp: datetime
        """
        pass

class MockAIEngine(BaseAIEngine):
    def validate_document(self, file_obj) -> dict:
        # Simulate processing time
        time.sleep(0.5)
        
        # Simple heuristic: if filename contains 'invalid', low score
        filename = getattr(file_obj, 'name', '').lower()
        if 'invalid' in filename or 'cat' in filename:
            score = round(random.uniform(0.1, 0.4), 2)
        else:
            score = round(random.uniform(0.7, 0.99), 2)
            
        config = get_current_config()
        
        return {
            'score': score,
            'provider': 'MockAI-v1',
            'threshold': config['threshold'],
            'timestamp': timezone.now()
        }

class LocalContentAIEngine(BaseAIEngine):
    """
    Real AI Engine that performs local content analysis using OCR/Text Extraction.
    Complies with RNF003 and RNF005.
    """
    CLINICAL_KEYWORDS = [
        'paciente', 'cpf', 'nascimento', 'relatório', 'médico', 
        'diagnóstico', 'exame', 'clínico', 'histórico', 'hipótese',
        'suspeita', 'tratamento', 'cid', 'prescrição', 'atestado'
    ]

    def validate_document(self, file_obj) -> dict:
        config = get_current_config()
        threshold = config['threshold']
        provider = 'LocalNLP-v1 (PyMuPDF)'
        
        try:
            # Read file content
            content = file_obj.read()
            # Reset pointer for subsequent reads if necessary
            if hasattr(file_obj, 'seek'):
                file_obj.seek(0)
                
            # Try to extract text using PyMuPDF
            doc = fitz.open(stream=content, filetype="pdf")
            text = ""
            for page in doc:
                text += page.get_text().lower()
            
            if not text:
                # If no text (could be an image-only PDF), we might need OCR 
                # for now, we'll return a low score or use a fallback
                return self._fallback_result(0.3, provider, threshold)

            # Analyze text for clinical keywords
            matches = [word for word in self.CLINICAL_KEYWORDS if word in text]
            
            # Scoring logic: 
            # 1. Base score by keyword variety (50%)
            # 2. Base score by keyword frequency (50%)
            match_ratio = len(matches) / len(self.CLINICAL_KEYWORDS)
            
            # Revised scoring: 0.4 (base if text found) + match_ratio * 0.75
            # This ensures that a few matches push it over 0.6 easily
            score = round(min(0.4 + (match_ratio * 0.75), 0.99), 2)
            
            return {
                'score': score,
                'provider': provider,
                'threshold': threshold,
                'timestamp': timezone.now()
            }
            
        except Exception as e:
            # Fallback if PDF parsing fails
            return {
                'score': 0.0,
                'provider': f"{provider} (Error: {str(e)})",
                'threshold': threshold,
                'timestamp': timezone.now()
            }

    def _fallback_result(self, score, provider, threshold):
        return {
            'score': score,
            'provider': provider,
            'threshold': threshold,
            'timestamp': timezone.now()
        }

class OpenAIEngine(BaseAIEngine):
    """
    Strategy for using external LLM (OpenAI) for clinical document validation.
    Demonstrates extensibility (Strategy Pattern).
    Note: Requires 'openai' library and OPENAI_API_KEY.
    """
    def validate_document(self, file_obj) -> dict:
        config = get_current_config()
        # Placeholder implementation for demonstration
        return {
            'score': 0.95,
            'provider': 'OpenAI GPT-4o',
            'threshold': config['threshold'],
            'timestamp': timezone.now()
        }

class AIEngineFactory:
    @staticmethod
    def get_engine() -> BaseAIEngine:
        config = get_current_config()
        provider = config['provider']
        if provider == 'OPENAI':
            return OpenAIEngine()
        if provider == 'REAL':
            return LocalContentAIEngine()
        return MockAIEngine()
