# Módulo de Teleconsultoria com Validação Inteligente (Projeto ReNTAI)

Este repositório contém o desenvolvimento do **Módulo de Teleconsultoria** para a plataforma **V4H (Video for Health)**, integrante do ecossistema **ReNTAI**. O sistema foi projetado para otimizar o fluxo de segunda opinião médica utilizando Inteligência Artificial para triagem automática de documentos.

---

## 🤖 Etapa 4: Declaração de Uso de IA e Arquitetura

Conforme exigido pelo edital (Seção 2.4 e Etapa 4), declaramos o uso de Inteligência Artificial para a **Triagem Automática e Validação Inteligente** de anexos clínicos.

### Arquitetura de IA (Strategy Pattern)
O sistema foi implementado utilizando o padrão de projeto **Strategy**, permitindo que o motor de IA seja agnóstico ao provedor. Isso garante escalabilidade e conformidade com diferentes cenários de infraestrutura.

#### Motores Disponíveis:
1.  **LocalContentAIEngine (Padrão):** Um motor de processamento de linguagem natural (NLP) que roda localmente usando a biblioteca `PyMuPDF`. Ele extrai o texto dos documentos PDF e analisa a presença de marcadores clínicos (como CID, Diagnóstico, CPF do paciente).
    *   *Vantagem:* Baixo custo e total privacidade de dados (Conformidade LGPD).
2.  **OpenAIEngine (Pronto para Produção):** Uma estratégia que integra o sistema ao modelo **GPT-4o** da OpenAI para uma análise semântica profunda.
3.  **MockAIEngine:** Utilizado para testes e homologação de fluxos sem consumo de recursos.

### Governança e Auditabilidade (RNF005)
O administrador do sistema possui controle total sobre a IA através do **Dashboard de Auditoria**, onde pode:
*   Ajustar o **Threshold de Confiança** em tempo real.
*   Alternar entre Provedores de IA sem downtime.
*   Visualizar logs detalhados de cada decisão tomada pela IA (Score, Provedor e Timestamp).

---

## 🛡️ Segurança e Rastreabilidade (LGPD)

O sistema implementa rigorosos controles de acesso e rastreabilidade:
*   **RBAC (Role-Based Access Control):** Diferenciação rígida entre Solicitante, Especialista e Admin.
*   **AccessLogs (Novo):** Todas as visualizações de dados sensíveis e downloads de pareceres são registrados em um log de auditoria imutável, identificando o usuário, o IP e o timestamp da ação.

---

## 🚀 Como Executar

### Pré-requisitos
- Docker e Docker Compose instalados.

### Passos
1.  Clone o repositório.
2.  Configure o arquivo `.env` (use o `.env.example` como base).
3.  Execute o comando:
    ```bash
    docker-compose up --build
    ```
4.  Acesse:
    - **Frontend:** `http://localhost:3000`
    - **API (Backend):** `http://localhost:8082`

---
**Desenvolvedor:** Arthur Felipe Almeida Lacerda  
**Consórcio:** LAVID/UFPB, RNP e FUNETEC-PB.
