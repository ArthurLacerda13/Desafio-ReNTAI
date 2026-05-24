import os
import django
import uuid
import random
from datetime import datetime, timedelta

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from teleconsultations.models import Teleconsultation, Attachment, StatusHistory
from users.models import User

def seed_data():
    print("Clearing database...")
    Teleconsultation.objects.all().delete()
    
    # Ensure we have a solicitante and a specialist
    solicitante, _ = User.objects.get_or_create(
        email="solicitante@v4h.com",
        defaults={"role": "SOLICITANTE", "first_name": "Dr.", "last_name": "Solicitante"}
    )
    if _: solicitante.set_password("password123"); solicitante.save()

    especialista, _ = User.objects.get_or_create(
        email="cardio@v4h.com",
        defaults={"role": "ESPECIALISTA", "specialty": "CARDIOLOGIA", "first_name": "Dr.", "last_name": "Cardiologista"}
    )
    if _: especialista.set_password("password123"); especialista.save()

    patients = [
        "Maria Oliveira", "João Santos", "Ana Souza", "Carlos Lima", 
        "Beatriz Costa", "Ricardo Rocha", "Fernanda Silva", 
        "Gabriel Mendes", "Juliana Pereira", "Lucas Barbosa"
    ]
    
    specialties = ["CARDIOLOGIA", "ODONTOLOGIA", "DOENCAS_RARAS", "OXIGENOTERAPIA"]
    statuses = [Teleconsultation.Status.PENDENTE, Teleconsultation.Status.EM_ANDAMENTO, Teleconsultation.Status.CONCLUIDA]

    print(f"Creating 10 cases...")
    
    for i in range(10):
        name = patients[i]
        status = random.choice(statuses)
        specialty = random.choice(specialties)
        
        # Create some in the past
        created_at = datetime.now() - timedelta(days=random.randint(0, 15))
        
        case = Teleconsultation.objects.create(
            solicitante=solicitante,
            patient_name=name,
            patient_birth_date="1980-01-01",
            specialty=specialty,
            diagnostic_hypothesis=f"Suspeita de {specialty.lower()} no paciente {name}",
            clinical_history="Histórico clínico gerado para testes do sistema de filtros.",
            status=status,
            especialista=especialista if status != Teleconsultation.Status.PENDENTE else None
        )
        
        # Override auto_now_add for testing period filters
        Teleconsultation.objects.filter(id=case.id).update(created_at=created_at)
        
        # Add history
        StatusHistory.objects.create(
            teleconsultation=case,
            status=Teleconsultation.Status.PENDENTE,
            changed_by=solicitante
        )
        
        if status != Teleconsultation.Status.PENDENTE:
            StatusHistory.objects.create(
                teleconsultation=case,
                status=status,
                changed_by=especialista
            )

    print("Success! 10 cases created.")

if __name__ == "__main__":
    seed_data()
