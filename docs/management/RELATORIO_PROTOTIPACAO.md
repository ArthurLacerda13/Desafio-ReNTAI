# Relatório de Prototipação e Design de Interface

## 1. Objetivo
Este documento formaliza a conclusão da fase de design de UI/UX do **Módulo de Teleconsultoria V4H** (Projeto ReNTAI). Optou-se pela metodologia de **Prototipação Funcional em HTML/Tailwind CSS** (Living Documentation), visando:
1. Validar imediatamente a viabilidade técnica do design.
2. Acelerar a futura implementação de componentes no Next.js (aproveitamento direto das classes utilitárias).
3. Homologar os fluxos de requisitos diretamente em um formato navegável.

## 2. Localização dos Artefatos
Os protótipos em HTML estático encontram-se estruturados por perfil de ator e armazenados na seguinte estrutura de diretórios:
`/docs/prototyping/`

## 3. Matriz de Cobertura de Requisitos
A prototipação alcançou cobertura integral dos fluxos principais exigidos pela Elicitação de Requisitos e pelo DVP.

| Fluxo / Tela | Caminho do Arquivo | Requisitos Funcionais / Não-Funcionais |
| :--- | :--- | :--- |
| **Autenticação e Registro** | `login/login.html` | **RF001** (Cadastro), **RF002** (Login), **RNF008** (Termos LGPD) |
| **Dashboards Operacionais** | `solicitante/visao_geral.html`<br>`especialista/dashboard_especialista.html` | **RF004** (Listagem de Casos), **RF005** (Filtros e Buscas) |
| **Nova Teleconsultoria** | `solicitante/nova_teleconsultoria.html` | **RF006** (Formulário Clínico), **RF007** (Anexos), **RF008** (Feedback IA) |
| **Visualização e Parecer** | `especialista/analise_parecer.html` | **RF009** (Timeline Visual), **RF010** (Editor de Parecer), **RF011** (Encerramento) |
| **Painel de Auditoria (Admin)** | `admin/dashboard.html` | **RNF003** (Ajuste de Limiar/Threshold), **RNF005** (Rastreabilidade de IA) |

## 4. Tratamento de Exceções e Controle de Acesso (RBAC)
A documentação viva também cobre as restrições impostas pela **ADR-004** e regras de negócio:
*   **Separação Visual:** A escolha do perfil de atuação no registro (`RF001`) determina o layout final. Apenas o perfil 'Solicitante' visualiza a opção de "Nova Teleconsultoria", enquanto o 'Especialista' tem exclusividade na "Fila de Trabalho".
*   **Feedback Reativo:** A validação dos documentos via Inteligência Artificial (`RF008`) foi prototipada considerando o estado de carregamento (*Pulse Animation*) e a representação visual da auditoria.

## 5. Próximos Passos (Handoff para Engenharia)
Com a aprovação dos layouts e dos componentes visuais (Tailwind CSS), a próxima etapa do ciclo de vida do projeto consistirá em:
1.  **Backend:** Mapear estes formulários para as entidades do banco de dados (Criação dos `models.py` no Django).
2.  **Frontend:** Fatiar os arquivos HTML em componentes React (`.tsx`) para o projeto Next.js.
