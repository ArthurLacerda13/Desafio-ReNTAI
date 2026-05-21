from .settings import *
import sys

# Forçar SQLite em memória durante os testes
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Desativar canais reais durante os testes
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}

# Garantir que o AI_THRESHOLD esteja definido para os testes
AI_THRESHOLD = 0.60
