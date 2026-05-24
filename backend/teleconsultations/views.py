from django.db.models import Q, Avg, Count, F
from django.utils import timezone
from datetime import timedelta
from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from .models import Teleconsultation, Attachment, Feedback, StatusHistory, GlobalConfig
from .serializers import (
    TeleconsultationSerializer, 
    TeleconsultationCreateSerializer, 
    FeedbackSerializer,
    GlobalConfigSerializer
)

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
            # Simple duration between creation and last update (opinion)
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
                'active_specialists': get_user_model().objects.filter(role='ESPECIALISTA').count(),
            },
            'specialty_distribution': specialty_stats,
            'ai_logs': Attachment.objects.order_by('-ai_timestamp')[:10].values(
                'id', 'ai_score', 'ai_threshold', 'ai_provider', 'ai_timestamp', 'teleconsultation__patient_name'
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
        # We only have one global config
        obj, created = GlobalConfig.objects.get_or_create(id=1)
        return obj

    def list(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
from .services.ai_engine import AIEngineFactory
from .filters import TeleconsultationFilter
from django.conf import settings
from django_filters import rest_framework as filters

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
            # Base logic for specialists: pending in their area OR cases already assigned to them
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
        
        # RF008: AI Triage BEFORE creation
        attachment_files = request.FILES.getlist('attachment_files')
        if not attachment_files:
            return Response({"detail": "Pelo menos um documento deve ser anexado."}, status=status.HTTP_400_BAD_REQUEST)

        engine = AIEngineFactory.get_engine()
        validated_attachments_data = []
        
        for file in attachment_files:
            try:
                ai_result = engine.validate_document(file)
                if ai_result['score'] < ai_result['threshold']:
                    return Response(
                        {"detail": f"Documento '{file.name}' rejeitado pela triagem IA (Score {ai_result['score']} abaixo do limiar {ai_result['threshold']})."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                validated_attachments_data.append({'file': file, 'ai': ai_result})
            except Exception as e:
                return Response(
                    {"detail": f"Falha na triagem IA: {str(e)}"},
                    status=status.HTTP_503_SERVICE_AVAILABLE
                )

        # If all passed, create Teleconsultation
        teleconsultation = serializer.save(solicitante=self.request.user)
        
        # Create Attachments with AI audit data (RNF005)
        for item in validated_attachments_data:
            Attachment.objects.create(
                teleconsultation=teleconsultation,
                file=item['file'],
                ai_score=item['ai']['score'],
                ai_provider=item['ai']['provider'],
                ai_threshold=item['ai']['threshold'],
                ai_timestamp=item['ai']['timestamp']
            )
        
        # Log Initial History
        StatusHistory.objects.create(
            teleconsultation=teleconsultation,
            status=Teleconsultation.Status.PENDENTE,
            changed_by=self.request.user
        )
            
        return Response(TeleconsultationSerializer(teleconsultation).data, status=status.HTTP_201_CREATED)

from .models import Teleconsultation, Attachment, Feedback, StatusHistory, GlobalConfig, AccessLog

class TeleconsultationDetailView(generics.RetrieveAPIView):
    serializer_class = TeleconsultationSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        # ... (same as before)
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
            # LGPD: Log access
            instance = self.get_object()
            AccessLog.objects.create(
                user=request.user,
                teleconsultation=instance,
                ip_address=request.META.get('REMOTE_ADDR'),
                action='VIEW_DETAILS'
            )
        return response

from django.http import HttpResponse
from .services.pdf_generator import generate_teleconsultation_pdf

class TeleconsultationPDFView(generics.RetrieveAPIView):
    queryset = Teleconsultation.objects.all()
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Check permissions: only the solicitante or an especialista assigned can download
        if not (request.user.is_staff or request.user.is_superuser):
            if request.user.role == 'SOLICITANTE' and instance.solicitante != request.user:
                return Response({"detail": "Não autorizado."}, status=status.HTTP_403_FORBIDDEN)
            
        pdf_content = generate_teleconsultation_pdf(instance)
        
        # LGPD: Log PDF download
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

        # RBAC Check for file access
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

        # Log Access
        AccessLog.objects.create(
            user=user,
            teleconsultation=teleconsultation,
            ip_address=request.META.get('REMOTE_ADDR'),
            action='VIEW_ATTACHMENT'
        )

        # Serve file
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
        if teleconsultation.specialty != request.user.specialty and teleconsultation.especialista != request.user:
             if not (request.user.is_staff or request.user.is_superuser):
                return Response({"detail": "Não autorizado para esta especialidade."}, status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(teleconsultation=teleconsultation, specialist=self.request.user)
        
        # Update teleconsultation status
        teleconsultation.status = Teleconsultation.Status.CONCLUIDA
        teleconsultation.especialista = self.request.user
        teleconsultation.save()
        
        # Log history
        StatusHistory.objects.create(
            teleconsultation=teleconsultation,
            status=Teleconsultation.Status.CONCLUIDA,
            changed_by=self.request.user
        )
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
