import os
from django.db.models import Q, Avg, Count, F
from django.utils import timezone
from datetime import timedelta
from django.http import HttpResponse
from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django_filters import rest_framework as filters
from django.conf import settings

from .models import Teleconsultation, Attachment, Feedback, StatusHistory, GlobalConfig, AccessLog
from .serializers import (
    TeleconsultationSerializer, 
    TeleconsultationCreateSerializer, 
    FeedbackSerializer,
    GlobalConfigSerializer,
    AttachmentSerializer
)
from .services.ai_engine import AIEngineFactory
from .filters import TeleconsultationFilter
from .services.pdf_generator import generate_teleconsultation_pdf

User = get_user_model()

class AdminStatsView(generics.RetrieveAPIView):
    permission_classes = (permissions.IsAdminUser,)

    def get(self, request, *args, **kwargs):
        # 1. AI Rejection Rate
        all_attachments = Attachment.objects.all()
        total_att = all_attachments.count()
        rejected_att = all_attachments.filter(ai_score__lt=F('ai_threshold')).count()
        rejection_rate = (rejected_att / total_att * 100) if total_att > 0 else 0

        # 2. SLA: Average response time
        completed_cases = Teleconsultation.objects.filter(status=Teleconsultation.Status.CONCLUIDA)
        durations = []
        for case in completed_cases:
            duration = case.updated_at - case.created_at
            durations.append(duration.total_seconds())
        
        avg_sla_seconds = sum(durations) / len(durations) if durations else 0
        avg_sla_hours = round(avg_sla_seconds / 3600, 2)

        # 3. Demand by Specialty
        specialty_stats = Teleconsultation.objects.values('specialty').annotate(count=Count('id')).order_by('-count')

        # 4. Critical SLA Alerts (> 24h pending)
        critical_threshold = timezone.now() - timedelta(hours=24)
        critical_cases = Teleconsultation.objects.filter(
            status=Teleconsultation.Status.PENDENTE,
            created_at__lt=critical_threshold
        ).count()

        return Response({
            'kpis': {
                'ai_rejection_rate': round(rejection_rate, 2),
                'avg_sla_hours': avg_sla_hours,
                'pending_cases': Teleconsultation.objects.filter(status=Teleconsultation.Status.PENDENTE).count(),
                'critical_cases': critical_cases,
                'active_specialists': User.objects.filter(role='ESPECIALISTA').count(),
            },
            'specialty_distribution': specialty_stats,
            'ai_logs': Attachment.objects.order_by('-ai_timestamp')[:10].values(
                'id', 'ai_score', 'ai_threshold', 'ai_provider', 'ai_timestamp', 'teleconsultation__patient_name', 'patient_name_cache'
            ),
            'access_logs': AccessLog.objects.order_by('-accessed_at')[:10].values(
                'id', 'user__first_name', 'user__last_name', 'user__email', 'teleconsultation__patient_name', 'accessed_at', 'action', 'ip_address'
            )
        })

class GlobalConfigViewSet(viewsets.ModelViewSet):
    queryset = GlobalConfig.objects.all()
    serializer_class = GlobalConfigSerializer
    permission_classes = (permissions.IsAdminUser,)

    def get_object(self):
        obj, created = GlobalConfig.objects.get_or_create(id=1)
        return obj

    def list(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

class TeleconsultationListCreateView(generics.ListCreateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    filterset_class = TeleconsultationFilter
    filter_backends = (filters.DjangoFilterBackend,)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TeleconsultationCreateSerializer
        return TeleconsultationSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Teleconsultation.objects.all()

        if user.is_staff or user.is_superuser:
            return queryset.order_by('-created_at')

        if user.role == 'SOLICITANTE':
            queryset = queryset.filter(solicitante=user)
        elif user.role == 'ESPECIALISTA':
            specialty_q = Q()
            if user.specialty:
                specialty_q = Q(specialty=user.specialty)
            
            queryset = queryset.filter(
                Q(especialista=user) | 
                (Q(especialista__isnull=True, status=Teleconsultation.Status.PENDENTE) & specialty_q)
            )
        
        return queryset.order_by('-created_at')

    def create(self, request, *args, **kwargs):
        if request.user.role != 'SOLICITANTE':
            return Response(
                {"detail": "Apenas Solicitantes podem abrir novas teleconsultorias."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        attachment_files = request.FILES.getlist('attachment_files')
        if not attachment_files:
            return Response({"detail": "Pelo menos um documento deve ser anexado."}, status=status.HTTP_400_BAD_REQUEST)

        engine = AIEngineFactory.get_engine()
        validated_attachments_data = []
        patient_name = request.data.get('patient_name', 'Desconhecido')
        
        for file in attachment_files:
            try:
                ai_result = engine.validate_document(file)
                
                # Persist the attempt in the Attachment log regardless of result (Auditory Requirement)
                # If rejected, it won't be linked to a teleconsultation
                attachment_log = Attachment.objects.create(
                    file=file,
                    patient_name_cache=patient_name,
                    ai_score=ai_result['score'],
                    ai_provider=ai_result['provider'],
                    ai_threshold=ai_result['threshold'],
                    ai_timestamp=ai_result['timestamp']
                )

                if ai_result['score'] < ai_result['threshold']:
                    return Response(
                        {"detail": f"Documento '{file.name}' rejeitado pela triagem IA (Score {ai_result['score']} abaixo do limiar {ai_result['threshold']})."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # If approved, keep it to link to the teleconsultation later
                validated_attachments_data.append(attachment_log)
            except Exception as e:
                return Response(
                    {"detail": f"Falha na triagem IA: {str(e)}"},
                    status=status.HTTP_503_SERVICE_AVAILABLE
                )

        teleconsultation = serializer.save(solicitante=self.request.user)
        
        # Link approved attachments to the created teleconsultation
        for att in validated_attachments_data:
            att.teleconsultation = teleconsultation
            att.save()
        
        StatusHistory.objects.create(
            teleconsultation=teleconsultation,
            status=Teleconsultation.Status.PENDENTE,
            changed_by=self.request.user
        )
            
        return Response(TeleconsultationSerializer(teleconsultation, context={'request': request}).data, status=status.HTTP_201_CREATED)

class TeleconsultationDetailView(generics.RetrieveAPIView):
    serializer_class = TeleconsultationSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return Teleconsultation.objects.all()
            
        if user.role == 'SOLICITANTE':
            return Teleconsultation.objects.filter(solicitante=user)
        elif user.role == 'ESPECIALISTA':
            queryset = Teleconsultation.objects.all()
            if user.specialty:
                queryset = queryset.filter(specialty=user.specialty)
            return queryset.filter(
                Q(especialista=user) | 
                Q(especialista__isnull=True, status=Teleconsultation.Status.PENDENTE)
            )
        return Teleconsultation.objects.none()

    def get(self, request, *args, **kwargs):
        response = super().get(request, *args, **kwargs)
        if response.status_code == 200:
            instance = self.get_object()
            AccessLog.objects.create(
                user=request.user,
                teleconsultation=instance,
                ip_address=request.META.get('REMOTE_ADDR'),
                action='VIEW_DETAILS'
            )
        return response

class TeleconsultationPDFView(generics.RetrieveAPIView):
    queryset = Teleconsultation.objects.all()
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        instance = self.get_object()
        
        if not (request.user.is_staff or request.user.is_superuser):
            if request.user.role == 'SOLICITANTE' and instance.solicitante != request.user:
                return Response({"detail": "Não autorizado."}, status=status.HTTP_403_FORBIDDEN)
            
        pdf_content = generate_teleconsultation_pdf(instance)
        
        AccessLog.objects.create(
            user=request.user,
            teleconsultation=instance,
            ip_address=request.META.get('REMOTE_ADDR'),
            action='DOWNLOAD_PDF'
        )
        
        filename = f"parecer_{str(instance.id)[:8]}.pdf"
        response = HttpResponse(pdf_content, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response

class SecureFileServeView(generics.RetrieveAPIView):
    queryset = Attachment.objects.all()
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        attachment = self.get_object()
        teleconsultation = attachment.teleconsultation
        user = request.user

        has_access = False
        if user.is_staff or user.is_superuser:
            has_access = True
        elif user.role == 'SOLICITANTE' and teleconsultation.solicitante == user:
            has_access = True
        elif user.role == 'ESPECIALISTA':
            if teleconsultation.especialista == user or (teleconsultation.especialista is None and teleconsultation.specialty == user.specialty):
                has_access = True

        if not has_access:
            return Response({"detail": "Acesso negado a este documento clínico."}, status=status.HTTP_403_FORBIDDEN)

        AccessLog.objects.create(
            user=user,
            teleconsultation=teleconsultation,
            ip_address=request.META.get('REMOTE_ADDR'),
            action='VIEW_ATTACHMENT'
        )

        file_path = attachment.file.path
        with open(file_path, 'rb') as f:
            content_type = "application/pdf" if file_path.endswith('.pdf') else "image/jpeg"
            response = HttpResponse(f.read(), content_type=content_type)
            response['Content-Disposition'] = f'inline; filename="{os.path.basename(file_path)}"'
            return response

class FeedbackCreateView(generics.CreateAPIView):
    serializer_class = FeedbackSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def create(self, request, *args, **kwargs):
        if request.user.role != 'ESPECIALISTA':
            return Response({"detail": "Apenas especialistas podem emitir pareceres."}, status=status.HTTP_403_FORBIDDEN)
            
        teleconsultation_id = self.kwargs.get('pk')
        teleconsultation = get_object_or_404(Teleconsultation, pk=teleconsultation_id)
        
        # Check if specialist can access this teleconsultation
        # Permission logic:
        # 1. User is Staff/Superuser -> Allowed
        # 2. User is the assigned specialist -> Allowed
        # 3. User has the matching specialty and it's not assigned to someone else yet -> Allowed
        has_permission = False
        if request.user.is_staff or request.user.is_superuser:
            has_permission = True
        elif teleconsultation.especialista == request.user:
            has_permission = True
        elif teleconsultation.especialista is None and teleconsultation.specialty == request.user.specialty:
            has_permission = True
        elif teleconsultation.especialista is None and request.user.specialty is None:
            # If specialist has no specialty set, they can pick up anything (helpful for testing/broad specialists)
            has_permission = True

        if not has_permission:
            return Response(
                {"detail": f"Não autorizado. Sua especialidade ({request.user.specialty}) não condiz com a do caso ({teleconsultation.specialty})."}, 
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(teleconsultation=teleconsultation, specialist=self.request.user)
        
        teleconsultation.status = Teleconsultation.Status.CONCLUIDA
        teleconsultation.especialista = self.request.user
        teleconsultation.save()
        
        StatusHistory.objects.create(
            teleconsultation=teleconsultation,
            status=Teleconsultation.Status.CONCLUIDA,
            changed_by=self.request.user
        )
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
