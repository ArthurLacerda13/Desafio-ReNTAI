import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class Teleconsultation(models.Model):
    class Specialty(models.TextChoices):
        CARDIOLOGIA = 'CARDIOLOGIA', _('Cardiologia')
        CIRURGIA_ROBOTICA = 'CIRURGIA_ROBOTICA', _('Cirurgia Robótica')
        ODONTOLOGIA = 'ODONTOLOGIA', _('Odontologia')
        DOENCAS_RARAS = 'DOENCAS_RARAS', _('Doenças Raras')
        OXIGENOTERAPIA = 'OXIGENOTERAPIA', _('Oxigenoterapia')

    class Status(models.TextChoices):
        PENDENTE = 'PENDENTE', _('Pendente')
        EM_ANDAMENTO = 'EM_ANDAMENTO', _('Em andamento')
        CONCLUIDA = 'CONCLUIDA', _('Concluída')
        CANCELADA = 'CANCELADA', _('Cancelada')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    solicitante = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='teleconsultas_solicitadas',
        limit_choices_to={'role': 'SOLICITANTE'}
    )
    especialista = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='teleconsultas_atendidas',
        limit_choices_to={'role': 'ESPECIALISTA'}
    )
    
    patient_name = models.CharField(_('patient name/initials'), max_length=100)
    patient_birth_date = models.DateField(_('patient birth date'))
    specialty = models.CharField(_('specialty'), max_length=50, choices=Specialty.choices)
    diagnostic_hypothesis = models.CharField(_('diagnostic hypothesis'), max_length=255)
    clinical_history = models.TextField(_('clinical history summary'))
    
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=Status.choices,
        default=Status.PENDENTE
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('teleconsultation')
        verbose_name_plural = _('teleconsultations')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.patient_name} - {self.specialty} ({self.status})"


class Attachment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    teleconsultation = models.ForeignKey(
        Teleconsultation,
        on_delete=models.CASCADE,
        related_name='attachments'
    )
    file = models.FileField(upload_to='attachments/%Y/%m/%d/')
    
    # AI Validation Fields
    ai_score = models.FloatField(_('AI confidence score'), null=True, blank=True)
    ai_provider = models.CharField(_('AI provider'), max_length=100, null=True, blank=True)
    ai_threshold = models.FloatField(_('AI threshold applied'), null=True, blank=True)
    ai_timestamp = models.DateTimeField(_('AI validation timestamp'), null=True, blank=True)

    def __str__(self):
        return f"Attachment for {self.teleconsultation.id}"


class Feedback(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    teleconsultation = models.OneToOneField(
        Teleconsultation,
        on_delete=models.CASCADE,
        related_name='feedback'
    )
    specialist = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='feedbacks_registrados'
    )
    content = models.TextField(_('feedback content'))
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Feedback for {self.teleconsultation.id}"


class StatusHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    teleconsultation = models.ForeignKey(
        Teleconsultation,
        on_delete=models.CASCADE,
        related_name='history'
    )
    status = models.CharField(max_length=20, choices=Teleconsultation.Status.choices)
    changed_at = models.DateTimeField(auto_now_add=True)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )

    class Meta:
        verbose_name = _('status history')
        verbose_name_plural = _('status histories')
        ordering = ['changed_at']
