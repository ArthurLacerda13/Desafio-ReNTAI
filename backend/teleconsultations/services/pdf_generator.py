from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.units import cm
import os
from django.conf import settings

def generate_teleconsultation_pdf(instance):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=12,
        alignment=1, # Center
        textColor=colors.HexColor("#1A1C1E")
    )
    
    section_style = ParagraphStyle(
        'SectionStyle',
        parent=styles['Heading2'],
        fontSize=12,
        spaceBefore=10,
        spaceAfter=6,
        textColor=colors.HexColor("#0061A4") # Brand color
    )

    content = []

    # Header
    content.append(Paragraph("Relatório de Teleconsultoria - V4H", title_style))
    content.append(Spacer(1, 0.5*cm))

    # Patient Info Table
    data = [
        ["Paciente:", instance.patient_name],
        ["Data de Nascimento:", str(instance.patient_birth_date)],
        ["Especialidade:", instance.specialty],
        ["Data da Solicitação:", instance.created_at.strftime("%d/%m/%Y %H:%M")],
        ["ID Solicitação:", str(instance.id).upper()[:8]]
    ]
    
    t = Table(data, colWidths=[4*cm, 12*cm])
    t.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('BACKGROUND', (0,0), (0,-1), colors.whitesmoke),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    content.append(t)
    content.append(Spacer(1, 1*cm))

    # Clinical Info
    content.append(Paragraph("Informações Clínicas", section_style))
    content.append(Paragraph(f"<b>Hipótese Diagnóstica:</b> {instance.diagnostic_hypothesis}", styles['Normal']))
    content.append(Spacer(1, 0.3*cm))
    content.append(Paragraph("<b>Histórico Clínico:</b>", styles['Normal']))
    content.append(Paragraph(instance.clinical_history, styles['Normal']))
    content.append(Spacer(1, 0.5*cm))

    # Inclusion of Attached Images (RF012 Enhancement)
    attachments = instance.attachments.all()
    images_found = False
    for att in attachments:
        ext = os.path.splitext(att.file.name)[1].lower()
        if ext in ['.png', '.jpg', '.jpeg']:
            if not images_found:
                content.append(Paragraph("Anexos Fotográficos", section_style))
                images_found = True
            
            try:
                img_path = att.file.path
                img = Image(img_path, width=12*cm, height=8*cm, kind='proportional')
                content.append(img)
                content.append(Spacer(1, 0.5*cm))
            except Exception as e:
                content.append(Paragraph(f"[Erro ao carregar imagem: {str(e)}]", styles['Italic']))

    content.append(Spacer(1, 0.5*cm))

    # Specialist Feedback
    content.append(Paragraph("Parecer do Especialista", section_style))
    try:
        feedback = instance.feedback
        content.append(Paragraph(feedback.content, styles['Normal']))
        content.append(Spacer(1, 0.5*cm))
        content.append(Paragraph(f"<b>Especialista Responsável:</b> {feedback.specialist.get_full_name() or feedback.specialist.email}", styles['Normal']))
        content.append(Paragraph(f"<b>Data do Parecer:</b> {feedback.created_at.strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
    except:
        content.append(Paragraph("Parecer ainda não emitido.", styles['Italic']))

    # Footer
    content.append(Spacer(1, 2*cm))
    content.append(Paragraph("-" * 80, styles['Normal']))
    content.append(Paragraph("Este documento é um registro eletrônico gerado pela plataforma V4H - ReNTAI.", styles['Normal']))

    doc.build(content)
    pdf = buffer.getvalue()
    buffer.close()
    return pdf
