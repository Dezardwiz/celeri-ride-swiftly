
# O que falta para o Celeri rodar 100% em produção

Hoje o app já tem o núcleo funcional: autenticação, mapa, corrida, motorista, carteira interna, comissão, cancelamento com taxa, tarifa dinâmica, onboarding com documentos, painel admin e páginas legais.

Para virar um produto real (com dinheiro entrando de verdade e pronto para as lojas), faltam os blocos abaixo, organizados por prioridade.

---

## 1. Monetização real — entrada e saída de dinheiro (CRÍTICO)

Hoje a "carteira" só soma saldo fictício (`addCredits` faz INSERT direto, sem cobrança real). Para receber de verdade:

### 1a. Recarga / pagamento do passageiro (entrada)
Três opções, da mais simples à mais completa:

- **PIX via Mercado Pago / Asaas / PagSeguro** (recomendado para Brasil)
  - Edge function `create-pix-charge` gera QR Code e copia-e-cola.
  - Webhook `pix-webhook` recebe confirmação e credita a `wallets` automaticamente.
  - Mais barato (≈ R$ 0,99/transação) e instantâneo.
- **Cartão de crédito** via mesmo gateway (taxa ≈ 3,99% + R$ 0,39).
- **Stripe** (mais simples de plugar via Lovable Payments, mas não tem PIX nativo no Brasil).

Recomendação: **Mercado Pago** (PIX + cartão + saldo MP, ideal para o público de Montes Claros).

### 1b. Repasse para o mototaxista (saída)
- Tabela `driver_payouts` já existe mas só registra "pending".
- Falta: tela do motorista "Sacar saldo" → pede chave PIX → cria transferência via API do gateway → marca como `paid`.
- Edge function `process-payout` + webhook de confirmação.
- Regras: saldo mínimo (ex.: R$ 20), limite diário, retenção de comissão.

### 1c. Cobrança automática da taxa de cancelamento
Hoje a taxa é registrada mas não é cobrada. Opções:
- Debitar do saldo da carteira se houver.
- Bloquear novas corridas até quitar a dívida pendente.

### 1d. Recibo / nota
- Edge function que gera PDF ou HTML do recibo da corrida (já dá para enviar por e-mail).

---

## 2. Confiabilidade operacional

- **Matching automático de motoristas**: hoje a corrida fica `REQUESTED` esperando aceite manual. Falta um algoritmo que ofereça em sequência ao motorista mais próximo (10-15s cada) com timeout.
- **Geolocalização em background do motorista**: usar `@capacitor/geolocation` + foreground service Android para atualizar `drivers.location_lat/lng` mesmo com o app em segundo plano.
- **Chat passageiro ↔ motorista** durante a corrida (mensagens rápidas pré-definidas para não tirar a atenção).
- **SOS / botão de pânico** com envio de localização para contato de emergência + admin.
- **Reconexão e retry** de chamadas falhas (perda de rede no meio da corrida).

---

## 3. Compliance e segurança (obrigatório para as lojas)

- **Validação real de CNH e CRLV**: hoje o admin aprova visualmente. Integrar com serviço tipo **Idwall, Unico Check ou SERPRO** para validar documento + biometria facial.
- **LGPD operacional**:
  - Tela "Meus dados" com exportação (já há a política, falta a função).
  - Tela "Excluir minha conta" (exigência Apple desde 2022).
- **Background check** do motorista (antecedentes criminais) — pode ser manual via planilha no MVP.
- **Termos versionados com aceite registrado** (campo `accepted_terms_version` na profile).

---

## 4. Notificações e engajamento

- **Push notifications** já tem infraestrutura (VAPID configurado), falta:
  - Cobrir todos os eventos: corrida aceita, motorista chegou, corrida finalizada, promoção.
  - Notificação de "nova corrida" para motorista com som diferenciado.
- **E-mails transacionais**: recibo, confirmação de cadastro, recuperação de senha personalizada.
- **Programa de indicação**: código do passageiro/motorista → bônus na carteira.
- **Cupons promocionais** (ex.: primeiro mês com 20% off).

---

## 5. Empacotamento e publicação nas lojas

- **Configuração final do Capacitor**: ícones em todas as resoluções, splash screens, permissões certas (geolocalização "sempre", notificações, câmera).
- **Build Android (AAB)** para Google Play + conta de desenvolvedor (US$ 25 único).
- **Build iOS (IPA)** para App Store + conta Apple Developer (US$ 99/ano) + Mac para assinar (ou usar serviço como Codemagic).
- **Screenshots, descrição, vídeo de apresentação** para as fichas das lojas.
- **Política de privacidade pública** já temos — só precisa estar acessível por URL fixa.

---

## 6. Monitoramento e operação

- **Sentry ou LogRocket** para capturar erros em produção.
- **Dashboard de saúde** no admin: corridas/hora, tempo médio de aceite, motoristas online agora, receita do dia.
- **Backup automático** do banco (Supabase já faz, mas vale checar a retenção).
- **Atendimento ao cliente**: WhatsApp Business ou chat integrado (Crisp/Tawk.to).

---

## 7. Pequenos polimentos pendentes no app atual

- Botão "Esqueci minha senha" no /auth.
- Edição de perfil (nome, foto, telefone).
- Histórico de corridas com filtros e recibo individual.
- Avaliação obrigatória após corrida (hoje é opcional).
- Modo escuro/claro (atualmente só escuro — talvez seja decisão de design manter).

---

## Sugestão de ordem de execução

1. **Pagamento real (PIX + cartão via Mercado Pago)** — sem isso, o app não gera receita.
2. **Saque do motorista** — sem isso, ninguém quer dirigir.
3. **Matching automático + geolocalização em background** — qualidade do serviço.
4. **Validação de documentos + exclusão de conta (LGPD)** — exigências legais e da Apple.
5. **Polimentos de UX (esqueci senha, edição de perfil, etc.)**.
6. **Empacotamento e publicação nas lojas**.
7. **Monitoramento e suporte**.

---

## Próximo passo recomendado

Começar pelo **bloco 1 (pagamento real com Mercado Pago via PIX)**, porque destrava a operação inteira: passageiro recarrega → motorista recebe → comissão entra para o admin.

Quer que eu detalhe a implementação do Mercado Pago (entrada + saída) como próxima entrega?
