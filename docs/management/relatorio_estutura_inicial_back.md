# Relatório de Estrutura Inicial do Backend - Módulo de Teleconsultoria (V4H / ReNTAI)

**Data:** 20 de Maio de 2026  
**Status:** Infraestrutura Base Concluída  
**Responsável:** Engenheiro de Software Sênior (Gemini CLI)

## 1. Visão Geral
Este documento detalha a infraestrutura inicial e as configurações de segurança implementadas para o backend do projeto ReNTAI. O foco principal foi estabelecer um ambiente robusto, escalável e seguro utilizando Docker e Django.

## 2. Tecnologias e Dependências
- **Linguagem:** Python 3.11-slim
- **Framework Web:** Django 4.2+
- **API:** Django Rest Framework (DRF)
- **Autenticação:** SimpleJWT (JSON Web Tokens)
- **Comunicação em Tempo Real:** Django Channels + Redis
- **Banco de Dados:** PostgreSQL 15
- **Servidor ASGI:** Uvicorn

## 3. Infraestrutura (Docker)
A aplicação está totalmente conteinerizada para garantir paridade entre os ambientes de desenvolvimento e produção.

- **`Dockerfile`:** Configurado para otimização de imagem, instalação de dependências de sistema (`libpq-dev`, `build-essential`) e execução via servidor ASGI.
- **`docker-compose.yml`:**
    - `database`: PostgreSQL com persistência de dados em volume local.
    - `cache`: Redis utilizado como Broker para o Django Channels.
    - `backend`: Aplicação Django com mapeamento de volume para Hot-Reload em desenvolvimento.

## 4. Segurança e Identidade
- **Custom User Model:** Implementado em `users/`, substituindo o modelo padrão do Django. 
    - **Identificador:** O login é realizado via **E-mail**, removendo a necessidade de `username`.
    - **UserManager:** Customizado para gerenciar a criação de usuários e superusuários com e-mail único.
- **Variáveis de Ambiente:** Implementação do `python-dotenv` para separação de segredos e configurações sensíveis do código-fonte.
- **CORS:** Configurado via `django-cors-headers` para permitir integração segura com o frontend.

## 5. Estrutura de Diretórios Criada
```text
backend/
├── core/                # Configurações centrais (settings, asgi, wsgi, urls)
├── users/               # Gestão de usuários e autenticação customizada
├── manage.py            # Utilitário de gerenciamento do Django
├── requirements.txt     # Dependências do projeto
└── Dockerfile           # Definição da imagem da aplicação
.env                     # Variáveis de ambiente (não versionado em prod)
docker-compose.yml       # Orquestração de serviços
```

## 6. Próximos Passos
1. Execução de migrações (`python manage.py migrate`).
2. Implementação dos modelos de domínio (Teleconsultorias, Pareceres, Triagem).
3. Integração com IA para triagem automática.
4. Desenvolvimento de WebSockets para notificações em tempo real.
