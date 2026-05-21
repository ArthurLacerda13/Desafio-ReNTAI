Funcionalidade: Triagem Automática de Inteligência Artificial e Controle RBAC
  Como o ecossistema de telessaúde do ReNTAI
  Quero garantir que as teleconsultas passem por critérios rígidos de corte de IA e perfil
  Para que dados clínicos sejam acessados apenas por profissionais homologados

  Cenário: Solicitante abre teleconsulta com documento legível (Sucesso da IA)
    Dado que o usuário "Dr. Arthur" está autenticado como "SOLICITANTE"
    E o limiar "AI_THRESHOLD" configurado no ambiente é 0.60
    Quando ele envia uma teleconsulta com um anexo que retorna score 0.75
    Então o sistema deve aprovar o anexo com status "APROVADO"
    E o status da teleconsulta deve ser definido como "PENDENTE"

  Cenário: Solicitante abre teleconsulta com documento ilegível (Auto-cancelamento)
    Dado que o usuário "Dr. Arthur" está autenticado como "SOLICITANTE"
    E o limiar "AI_THRESHOLD" configurado no ambiente é 0.60
    Quando ele envia uma teleconsulta com um anexo corrompido que retorna score 0.45
    Então o sistema deve rejeitar o anexo com status "REJEITADO"
    E a teleconsulta deve ser marcada automaticamente como "CANCELADA" para auditoria

  Cenário: Especialista tenta acessar a fila de outra especialidade médica
    Dado que o usuário "Dr. Carlos" está cadastrado como "ESPECIALISTA" na área "CARDIOLOGIA"
    Quando ele requisita a fila de teleconsultas médicas
    Então o sistema não deve exibir nenhuma teleconsulta pertencente à área "ODONTOLOGIA"