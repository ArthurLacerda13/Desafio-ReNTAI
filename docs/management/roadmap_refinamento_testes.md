# Roadmap de Refinamento e Testes - Projeto ReNTAI

Este documento detalha os próximos passos necessários para estabilizar as funcionalidades de filtro e garantir a qualidade do sistema através de testes automatizados.

## 1. Refinamento de Filtros (Prioridade Alta)
Atualmente, a lógica de filtros apresenta inconsistências que precisam ser resolvidas:

- [ ] **Sincronização de Estado:** Garantir que o `DashboardPage` não sofra de "race conditions" quando múltiplos filtros são alterados rapidamente.
- [ ] **Filtros de Data no Backend:** Validar se o `DjangoFilterBackend` está interpretando corretamente o formato ISO enviado pelo Next.js para os campos `start_date` e `end_date`.
- [ ] **Persistência de Filtros na URL:** Implementar o uso de `searchParams` para que o usuário possa atualizar a página ou compartilhar o link com os filtros aplicados.
- [ ] **Debounce Robusto:** Refinar o tempo de resposta da busca textual para que não ocorram requisições vazias ou duplicadas.

## 2. Estratégia de Testes (Próxima Fase)
Para garantir que futuras mudanças não quebrem o sistema de notificações e filtros:

### Backend (Pytest)
- [ ] **Testes de Integração de Filtros:** Criar casos de teste que validem a combinação de `status`, `specialty` e `patient_name`.
- [ ] **Testes de RBAC:** Garantir que um Solicitante nunca consiga filtrar ou ver teleconsultorias de outros usuários.
- [ ] **Mock de IA Engine:** Testar o comportamento da triagem com diferentes scores para validar as transições de status.

### Frontend (Jest/Cypress)
- [ ] **Unitários de Contexto:** Testar se o `NotificationContext` reconecta corretamente em caso de queda do WebSocket.
- [ ] **E2E de Filtragem:** Simular um usuário selecionando "Concluída" e verificar se a tabela reflete a mudança sem refresh manual.

## 3. Melhorias de UI/UX Relacionadas
- [ ] **Estados de Empty Search:** Melhorar o feedback visual quando uma busca não retorna resultados.
- [ ] **Skeleton Screens:** Substituir o spinner atual por esqueletos de tabela para uma percepção de velocidade maior.

---
**Data de Criação:** 22 de Maio de 2026
**Status:** Aguardando início do refinamento de filtros.
