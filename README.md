# Módulo de Teleconsultoria com Validação Inteligente (Projeto ReNTAI)

Este repositório contém o desenvolvimento do **Módulo de Teleconsultoria** para a plataforma **V4H (Video for Health)**, integrante do ecossistema **ReNTAI**. O sistema foca na otimização do fluxo de segundas opiniões médicas utilizando Inteligência Artificial para triagem de documentos.

## 📌 Status do Projeto: Fase de Concepção & Arquitetura (Dia 1)
Atualmente, o projeto encontra-se com a sua **fundação arquitetural e engenharia de requisitos 100% concluída**, seguindo rigorosos padrões de qualidade e manutenibilidade.

---

## 📂 Guia de Navegação para Auditores

Para facilitar a auditoria técnica e a transferência de tecnologia, a estrutura está organizada da seguinte forma:

### 1. Documentação de Requisitos (`/docs/requirements`)
Aqui encontram-se as definições de escopo e as dores de negócio mapeadas:
*   **Visão do Produto:** Propósito e stakeholders.
*   **Elicitação:** Mapeamento do cenário atual e gargalos.
*   **Definição de Requisitos:** Lista formal de RFs e RNFs (funcionais e não-funcionais).

### 2. Registros de Decisão de Arquitetura (`/docs/adr`)
Contém as justificativas técnicas, alternativas descartadas e trade-offs das tecnologias escolhidas:
*   `ADR-001`: Escolha da Stack (Next.js, Django, PostgreSQL, Docker).
*   `ADR-002`: Estratégia de Persistência e Auditoria de IA.
*   `ADR-003`: Comunicação em Tempo Real via WebSockets.
*   `ADR-004`: Autenticação JWT e Controle de Acesso (RBAC).
*   `ADR-005`: Desacoplamento do Motor de IA (Strategy Pattern).

### 3. Modelagem Técnica - C4 Model (`/docs/architecture`)
Diagramas estruturados utilizando PlantUML (Diagram-as-Code):
*   `1-contexto.puml`: Visão de alto nível e sistemas externos.
*   `2-containers.puml`: Divisão dos containers Docker e fluxos de dados.
*   `mdr.puml`: Modelo Lógico / Relacional do Banco de Dados.

### 4. Gestão de Engenharia (`/docs/management`)
*   **Relatório Diário:** Registro das atividades executadas, objetivos de engenharia e status de progresso diário.

---

## 🛠️ Próximos Passos (Dia 2)
- [ ] Implementação da infraestrutura Docker Compose.
- [ ] Inicialização do Backend (Django) com implementação dos Models (MDR).
- [ ] Inicialização do Frontend (Next.js).

---
**Desenvolvedor:** Arthur Felipe Almeida Lacerda  
**Consórcio:** LAVID/UFPB, RNP e FUNETEC-PB.
