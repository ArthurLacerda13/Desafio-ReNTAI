from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _

from .managers import UserManager


class User(AbstractUser):
    class Role(models.TextChoices):
        SOLICITANTE = 'SOLICITANTE', _('Solicitante (APS)')
        ESPECIALISTA = 'ESPECIALISTA', _('Especialista')

    username = None
    email = models.EmailField(_('email address'), unique=True)
    role = models.CharField(
        _('role'),
        max_length=20,
        choices=Role.choices,
        default=Role.SOLICITANTE
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email
