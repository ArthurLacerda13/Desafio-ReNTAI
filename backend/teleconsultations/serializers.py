from rest_framework import serializers
from .models import Teleconsultation, Attachment, Feedback, StatusHistory, GlobalConfig
from django.contrib.auth import get_user_model

User = get_user_model()

class GlobalConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = GlobalConfig
        fields = ('ai_threshold', 'ai_provider', 'updated_at')
        read_only_fields = ('updated_at',)

class AttachmentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Attachment
        fields = ('id', 'file', 'file_url', 'ai_score', 'ai_provider', 'ai_threshold', 'ai_timestamp')
        read_only_fields = ('ai_score', 'ai_provider', 'ai_threshold', 'ai_timestamp')

    def get_file_url(self, obj):
        request = self.context.get('request')
        if request:
            from django.urls import reverse
            return request.build_absolute_uri(reverse('secure-file-serve', kwargs={'pk': obj.pk}))
        return f"/api/teleconsultations/attachment/{obj.pk}/"

class FeedbackSerializer(serializers.ModelSerializer):
    specialist_name = serializers.ReadOnlyField(source='specialist.get_full_name')

    class Meta:
        model = Feedback
        fields = ('id', 'content', 'created_at', 'specialist_name')

class TeleconsultationSerializer(serializers.ModelSerializer):
    solicitante_name = serializers.ReadOnlyField(source='solicitante.get_full_name')
    especialista_name = serializers.ReadOnlyField(source='especialista.get_full_name')
    attachments = AttachmentSerializer(many=True, read_only=True)
    feedback = FeedbackSerializer(read_only=True)

    class Meta:
        model = Teleconsultation
        fields = (
            'id', 'solicitante', 'solicitante_name', 'especialista', 'especialista_name',
            'patient_name', 'patient_birth_date', 'specialty', 'diagnostic_hypothesis',
            'clinical_history', 'status', 'created_at', 'updated_at', 'attachments', 'feedback'
        )
        read_only_fields = ('id', 'solicitante', 'especialista', 'status', 'created_at', 'updated_at')

class TeleconsultationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Teleconsultation
        fields = (
            'patient_name', 'patient_birth_date', 'specialty', 
            'diagnostic_hypothesis', 'clinical_history'
        )

    def create(self, validated_data):
        return Teleconsultation.objects.create(**validated_data)
