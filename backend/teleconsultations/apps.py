from django.apps import AppConfig

class TeleconsultationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'teleconsultations'

    def ready(self):
        import teleconsultations.signals
