from abc import ABC, abstractmethod
import random
import time
from django.conf import settings

class BaseAIEngine(ABC):
    @abstractmethod
    def validate_document(self, file_path: str) -> dict:
        """
        Validates a document and returns a dictionary with:
        - score: float (0.0 to 1.0)
        - provider: str
        - threshold: float
        - timestamp: datetime
        """
        pass

class MockAIEngine(BaseAIEngine):
    def validate_document(self, file_path: str) -> dict:
        # Simulate processing time
        time.sleep(1)
        
        # In a real mock, we could analyze the file name or just return random
        # For demonstration, we'll return a high score usually
        score = round(random.uniform(0.7, 0.99), 2)
        threshold = float(getattr(settings, 'AI_THRESHOLD', 0.6))
        
        return {
            'score': score,
            'provider': 'MockAI-v1',
            'threshold': threshold,
            'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ')
        }

class RealAIEngine(BaseAIEngine):
    def validate_document(self, file_path: str) -> dict:
        # Here we would implement the actual API call (e.g., to an external service)
        # For now, it will raise an error or be a placeholder
        raise NotImplementedError("Real AI Engine not implemented yet.")

class AIEngineFactory:
    @staticmethod
    def get_engine() -> BaseAIEngine:
        provider = getattr(settings, 'AI_PROVIDER', 'MOCK').upper()
        if provider == 'REAL':
            return RealAIEngine()
        return MockAIEngine()
