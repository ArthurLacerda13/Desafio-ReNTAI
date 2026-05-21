from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Teleconsultation

@receiver(post_save, sender=Teleconsultation)
def notify_status_change(sender, instance, created, **kwargs):
    if not created:
        channel_layer = get_channel_layer()
        # Notify the Solicitante
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
