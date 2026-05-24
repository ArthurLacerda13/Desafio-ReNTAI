# Checklist de Conformidade e Evolução - Painel Administrativo

Este checklist baseia-se na análise técnica comparativa entre o protótipo `auditoria.html`, as exigências do Edital ReNTAI e as normas de sistemas de saúde (LGPD/RNP).

## 1. Governança de IA (Concluído no Protótipo)
- [x] **Painel de Controle:** Slider para ajuste de Threshold de confiança.
- [x] **Logs de Triagem:** Tabela com ID, Score da IA e decisão tomada.
- [x] **Monitoramento de Erros:** Exibição da taxa de rejeição da IA.
- [x] **Gestão de Provedores:** Seleção entre diferentes motores de IA (OpenAI, Mock, etc).

## 2. Gestão Operacional e Saúde (Concluído no Protótipo)
- [x] **Monitoramento de SLA:** Visualização do Tempo Médio de Resposta.
- [x] **Alertas Críticos:** Identificação de teleconsultorias com tempo de espera excedido.
- [x] **Distribuição por Especialidade:** Gráfico de demanda por área médica.
- [x] **Notificação Ativa:** Botão para alertar especialistas em atraso.

## 3. Lacunas de Conformidade (Pendentes de Implementação)
- [ ] **Rastreabilidade LGPD:** Log de visualização de documentos sensíveis (Quem acessou o quê e quando).
- [ ] **Controle de Qualidade:** Gráfico de satisfação/rating dos pareceres emitidos.
- [ ] **Fluxo de Credenciamento:** Interface para aprovação manual de novos especialistas (validação de CRM).
- [ ] **Exportação de BI:** Funcionalidade real para gerar relatório consolidado em PDF/Excel para prestação de contas.

## 4. Requisitos Técnicos de Integração (Próximos Passos)
- [ ] **Backend de Estatísticas:** Criar endpoints que agreguem dados (count, average, group_by).
- [ ] **Segurança de Rota:** Implementar middleware que restrinja `/admin` apenas para `role='ADMIN'`.
- [ ] **WebSockets Gerenciais:** Notificar o admin em tempo real quando um SLA entrar em estado crítico.

---
**Status Final:** O protótipo atual atende aos requisitos funcionais, mas a inclusão da rastreabilidade LGPD é recomendada como o principal diferencial de segurança.
