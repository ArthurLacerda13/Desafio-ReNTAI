from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Teleconsultation
from django.contrib.auth import get_user_model

User = get_user_model()

@receiver(post_save, sender=Teleconsultation)
def notify_teleconsultation_events(sender, instance, created, **kwargs):
    channel_layer = get_channel_layer()
    
    if created:
        # RF002: Notify all Specialists in the matching specialty
        specialists = User.objects.filter(role='ESPECIALISTA', specialty=instance.specialty)
        for specialist in specialists:
            group_name = f"user_{specialist.id}"
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    'type': 'status_update',
                    'teleconsultation_id': str(instance.id),
                    'new_status': instance.status,
                    'message': f"Nova teleconsultoria pendente na área de {instance.specialty}."
                }
            )
    else:
        # Notify the Solicitante about status changes (e.g., Parecer Emitido)
        group_name = f"user_{instance.solicitante.id}"
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'status_update',
                'teleconsultation_id': str(instance.id),
                'new_status': instance.status,
                'message': f"A teleconsultoria do paciente {instance.patient_name} mudou para {instance.get_status_display()}."
            }
        )
        
        # If an especialista was assigned, notify them too
        if instance.especialista:
            group_name = f"user_{instance.especialista.id}"
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    'type': 'status_update',
                    'teleconsultation_id': str(instance.id),
                    'new_status': instance.status,
                    'message': f"Status da sua consulta (Paciente: {instance.patient_name}) atualizado para {instance.get_status_display()}."
                }
            )
