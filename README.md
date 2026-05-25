# ReNTAI - Módulo de Teleconsultoria com Validação Inteligente

[![Licença: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Enabled-blue?logo=docker)](https://www.docker.com/)
[![Framework: Django](https://img.shields.io/badge/Backend-Django_5.2-green?logo=django)](https://www.djangoproject.com/)
[![Framework: Next.js](https://img.shields.io/badge/Frontend-Next.js_15-black?logo=next.js)](https://nextjs.org/)

Este repositório contém a solução completa para o **Desafio Técnico P01 - Desenvolvedor Fullstack** do projeto **ReNTAI (Plataforma V4H)**. O sistema permite a solicitação de segundas opiniões médicas, triagem automatizada por IA, e emissão de pareceres especializados em tempo real.

---

## 🚀 Como Executar (Quick Start)

O projeto está totalmente orquestrado via Docker Compose, garantindo que o ambiente do revisor seja idêntico ao de desenvolvimento.

### 1. Pré-requisitos
- Docker e Docker Compose instalados.
- Git instalado.

### 2. Clonagem e Configuração
```bash
git clone https://github.com/ArthurLacerda13/Desafio-ReNTAI.git
cd Desafio-ReNTAI
```

### 3. Execução
Execute o comando abaixo na raiz do projeto:
```bash
docker-compose up --build
```
*A primeira execução pode levar alguns minutos enquanto baixa as imagens e instala as dependências.*

### 4. Acesso ao Sistema
- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend (API):** [http://localhost:8082](http://localhost:8082)
- **Painel Admin Django:** [http://localhost:8082/admin/](http://localhost:8082/admin/)

### 🔑 Credenciais de Acesso (Instalação Limpa)
O banco de dados foi resetado para a homologação com um único usuário mestre:
- **Login:** `admin@gmail.com`
- **Senha:** `admin123`
*(Este usuário possui perfil de Administrador e Especialista para facilitar o teste de todos os fluxos).*

---

## 🛠️ Tecnologias e Arquitetura

- **Backend:** Python 3.13, Django 5.2, Django REST Framework.
- **Real-time:** Django Channels + WebSockets (notificações instantâneas).
- **Frontend:** React 19, Next.js 15, Tailwind CSS, Material Design 3.
- **Banco de Dados:** PostgreSQL 15 (Relacional) e Redis (Broker de Mensagens).
- **Processamento de Documentos:** PyMuPDF (Extração de metadados clínicos).

---

## 🤖 Inteligência Artificial (Seção 2.4)

Implementamos uma arquitetura agnóstica de IA baseada no padrão **Strategy**. 

- **Motor Local (Padrão):** Realiza processamento de linguagem natural (NLP) local para identificar palavras-chave clínicas (CID, Diagnóstico, CPF) em arquivos PDF, garantindo **privacidade total de dados** (Compliance LGPD).
- **Threshold Dinâmico:** O Administrador pode ajustar a sensibilidade da IA (ex: 60%) diretamente pelo Dashboard de Auditoria. Documentos com score abaixo do limite são registrados mas bloqueiam a criação da consulta.
- **Logs de Auditoria IA:** Todas as tentativas de upload (aprovadas ou rejeitadas) são salvas com score, provedor e timestamp para rastreabilidade algorítmica.

---

## 🛡️ Segurança e LGPD (Compliance SUS)

- **Secure File Serving:** Documentos clínicos sensíveis **não são públicos**. O acesso a cada arquivo PDF ou imagem requer autenticação JWT e validação de permissão RBAC (Role-Based Access Control).
- **Rastreabilidade:** Implementação de `AccessLog` que registra quem visualizou ou baixou qual documento, incluindo IP e timestamp.
- **Isolamento de Dados:** Solicitantes só visualizam seus próprios casos; Especialistas visualizam casos de sua área.

---

## 📄 Relatório de Conformidade (Checklist do Edital)

| Requisito | Descrição | Status |
| :--- | :--- | :---: |
| **RF001** | Cadastro de usuários com seleção de perfil | ✅ |
| **RF002** | Dashboard reativo para Solicitantes e Especialistas | ✅ |
| **RF005** | Triagem automática inteligente de anexos clínicos | ✅ |
| **RF008** | Configuração dinâmica de IA via Dashboard Admin | ✅ |
| **RF012** | Geração de parecer em PDF com suporte a imagens | ✅ |
| **RNF002** | Sincronismo visual via WebSockets (Sem Refresh) | ✅ |
| **Restrição 5** | Orquestração Docker Compose Uniforme | ✅ |

---

## 🏗️ Estrutura do Repositório

```text
├── backend/            # API Django e Lógica de IA
├── frontend/           # Interface Next.js (App Router)
├── docs/
│   ├── architecture/   # Diagramas C4 e MDR (PUML)
│   ├── adr/            # Registros de Decisões de Arquitetura
│   ├── management/     # Relatórios de Desenvolvimento e Status
│   └── requirements/   # Documentação de Requisitos extraída
├── docker-compose.yml  # Orquestração do ambiente
└── README.md           # Este guia
```

---

## ⚠️ Limitações de Produção

Para este desafio técnico, algumas decisões foram tomadas visando simplicidade de setup:
1. **Channel Layer:** Utiliza `InMemoryChannelLayer`. Para produção em escala, o `RedisChannelLayer` deve ser habilitado no `settings.py`.
2. **Assinatura Digital:** O PDF gerado é um registro eletrônico, mas carece de assinatura padrão ICP-Brasil para validade jurídica plena.
3. **Storage:** Arquivos são salvos localmente (Volume Docker). Recomenda-se migrar para **AWS S3** ou **Google Cloud Storage** para resiliência.

---

## 🤖 Declaração de Uso de IA (Edital)

Em conformidade com as diretrizes do edital, declaramos que ferramentas de Inteligência Artificial Generativa (como Gemini CLI e GitHub Copilot) foram utilizadas durante o ciclo de desenvolvimento deste projeto para:
1. **Produtividade de Código:** Auxílio na escrita de componentes Boilerplate e testes unitários.
2. **Documentação:** Estruturação inicial de arquivos técnicos e revisão gramatical.
3. **Refatoração:** Sugestões de otimização de algoritmos e padrões de design.

*O uso destas ferramentas serviu como co-piloto, sendo todas as decisões arquiteturais, lógicas de negócio e implementações críticas revisadas e validadas integralmente pelo desenvolvedor responsável.*

---
**Desenvolvedor:** Arthur Felipe Almeida Lacerda  
**Consórcio:** LAVID/UFPB, RNP e FUNETEC-PB.
