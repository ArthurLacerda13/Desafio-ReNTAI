Funcionalidade: Triagem Automática de Inteligência Artificial e Controle RBAC
  Como o ecossistema de telessaúde do ReNTAI
  Quero garantir que as teleconsultas passem por critérios rígidos de corte de IA e perfil
  Para que dados clínicos sejam acessados apenas por profissionais homologados

  Contexto:
    Dado que o limiar "AI_THRESHOLD" configurado no ambiente é 0.60

  Esquema do Cenário: Validação de diferentes níveis de score da IA (RNF005)
    Dado que o usuário "Dr. Arthur" está autenticado como "SOLICITANTE"
    Quando ele envia uma teleconsulta com um anexo que retorna score <score_ia>
    Então o sistema deve processar o anexo com o status <resultado_esperado>
    E a teleconsulta deve ser definida como <status_final>

    Exemplos:
      | score_ia | resultado_esperado | status_final |
      | 0.75     | "APROVADO"         | "PENDENTE"   |
      | 0.60     | "APROVADO"         | "PENDENTE"   |
      | 0.59     | "REJEITADO"        | "CANCELADA"  |
      | 0.45     | "REJEITADO"        | "CANCELADA"  |

  Cenário: Falha técnica no motor de IA durante a triagem
    Dado que o usuário "Dr. Arthur" está autenticado como "SOLICITANTE"
    Quando ele tenta enviar uma teleconsulta mas o motor de IA retorna um erro técnico (503)
    Então o sistema deve exibir uma mensagem de erro "Falha na triagem IA"
    E nenhuma teleconsulta deve ser persistida no banco de dados

  Cenário: Especialista acessa sua fila de trabalho correta (RBAC)
    Dado que o usuário "Dr. Carlos" está cadastrado como "ESPECIALISTA" na área "CARDIOLOGIA"
    E existem teleconsultas pendentes nas áreas "CARDIOLOGIA" e "ODONTOLOGIA"
    Quando ele requisita a fila de teleconsultas médicas
    Então o sistema deve exibir apenas as teleconsultas da área "CARDIOLOGIA"
    E o sistema deve ocultar todas as teleconsultas da área "ODONTOLOGIA"



Funcionalidade: Notificações em tempo real (RNF002)
  Como um usuário da plataforma V4H
  Quero receber alertas instantâneos sobre mudanças no status das teleconsultas
  Para que o fluxo de atendimento seja ágil e sem necessidade de recarregar a página

  Contexto:
    Dado que os usuários estão autenticados e conectados ao WebSocket via protocolo WSS

  Esquema do Cenário: Recebimento de alertas por mudança de status
    Quando ocorre o evento <evento_disparado> no backend
    Então o servidor ASGI deve encaminhar o payload via Redis Channel Layer
    E o usuário <destinatario> deve visualizar um Toast com a mensagem <mensagem_alerta>

    Exemplos:
      | evento_disparado        | destinatario  | mensagem_alerta                                     |
      | "Novo Caso Criado"      | Especialista  | "Nova teleconsulta pendente na sua especialidade"  |
      | "Parecer Emitido"       | Solicitante   | "O parecer do paciente A.F.A.L já está disponível"  |
      | "Cancelamento por IA"   | Solicitante   | "Documento reprovado. Verifique os critérios de IA" |

  Cenário: Persistência de conexão e resiliência
    Dado que o solicitante "Dr. Arthur" perdeu a conexão com a internet
    Quando a conexão for restabelecida
    Então o frontend deve realizar o "reconnect" automático ao WebSocket
    E sincronizar o estado atual das notificações pendentes