
# CELERI — o que falta para ficar 100% funcional e com UX/UI nível Uber/99

## Onde estamos hoje
Já funcionam: autenticação (passageiro/motorista), mapa Leaflet + OSRM, ciclo completo da corrida, matching automático sequencial com countdown, geolocalização em background, chat em tempo real, carteira interna, comissão, cancelamento com taxa, tarifa dinâmica, onboarding com documentos, painel admin, push notifications, indicação e cupons, páginas legais.

Faltam três frentes: **dinheiro real**, **confiabilidade/segurança**, e **acabamento de produto (UX/UI)**.

---

## Bloco A — Dinheiro real (bloqueia a operação)

1. **Recarga PIX + cartão (Mercado Pago)**
   - Edge function que gera cobrança PIX (QR Code + copia-e-cola) e checkout de cartão.
   - Webhook que confirma o pagamento e credita a carteira automaticamente.
   - Tela de recarga na Carteira com valores rápidos (R$ 10 / 20 / 50 / outro), estados de "aguardando pagamento" e confirmação em tempo real.
2. **Saque do mototaxista**
   - Tela "Sacar" com chave PIX, saldo mínimo, histórico de saques e status.
   - Edge function de transferência + webhook de confirmação; admin vê a fila de repasses.
3. **Cobrança efetiva da taxa de cancelamento** — debitar da carteira; se não houver saldo, registrar dívida e bloquear novas corridas até quitar.
4. **Recibo da corrida** — recibo visual no histórico com valor, trajeto, motorista e forma de pagamento; opção de compartilhar.

## Bloco B — Segurança e confiança

5. **SOS / botão de pânico** durante a corrida: envia localização ao vivo para contato de emergência e admin, com confirmação em duas etapas para evitar disparo acidental.
6. **Contatos de emergência** no perfil.
7. **Exclusão de conta e exportação de dados** (LGPD + exigência da Apple).
8. **Aceite de termos versionado** no cadastro.
9. **Indicador global de conexão** ("Sem conexão — tentando reconectar") no topo do app.

## Bloco C — UX/UI nível Uber/99 (o "ponta de linha")

10. **Mapa premium**: tema escuro customizado combinando com o preto/dourado, marcadores animados, moto que gira conforme o rumo, rota desenhada com animação, câmera que segue o veículo suavemente e faz auto-fit em origem+destino.
11. **Bottom sheet com snap points reais** (recolhido / meio / expandido), arrastável com gesto, como no Uber — hoje é fixo.
12. **Fluxo de pedido em etapas claras**: escolher destino → escolher categoria e ver preço → confirmar → buscando → a caminho → em viagem → concluído, cada etapa com transição de mapa e sheet coordenada.
13. **Estados de carregamento reais**: skeletons em todas as listas (histórico, carteira, métricas), zero telas "carregando" travadas.
14. **Estados vazios ilustrados** com ação sugerida (sem corridas, sem saldo, sem favoritos).
15. **Feedback tátil e sonoro**: vibração ao aceitar/receber corrida, som distinto de nova corrida para o motorista.
16. **Micro-interações**: botões com press-state, contadores animados de valor, pulso no pin durante a busca, transições entre abas.
17. **Acessibilidade e polimento**: áreas de toque de 44px, contraste conferido, safe areas em todos os telefones com notch, textos que não quebram em telas pequenas.
18. **Tela de acompanhamento da corrida repaginada**: foto e nota do motorista, placa, ETA ao vivo grande, ações rápidas (ligar, chat, compartilhar, SOS) em barra fixa.
19. **Onboarding do primeiro uso**: 3 telas explicando o app + pedido de permissão de localização com contexto (aumenta muito a taxa de aceite).

## Bloco D — Operação e publicação

20. **Dashboard de saúde no admin**: corridas/hora, tempo médio de aceite, motoristas online agora, receita do dia.
21. **Monitoramento de erros** em produção.
22. **Suporte ao cliente** (WhatsApp Business ou chat).
23. **Empacotamento nas lojas**: ícones e splash em todas as resoluções, permissões, build AAB/IPA, screenshots e fichas das lojas.

---

## Ordem sugerida de execução
1. Bloco C (11, 10, 12, 13, 14) — impacto visual imediato, sem dependências externas.
2. Bloco A (1, 2, 3) — destrava a receita (precisa da sua conta Mercado Pago).
3. Bloco B (5, 7, 8) — exigências legais e das lojas.
4. Bloco C restante (15–19) — acabamento fino.
5. Bloco D — operação e publicação.

## Detalhes técnicos
- Sheet arrastável: implementar com gesto do Framer Motion (já é dependência) + snap points, sem adicionar biblioteca nova.
- Mapa: manter Leaflet vanilla (regra do projeto), aplicar tema de tiles escuro, rotação do marcador via CSS transform e interpolação de posição entre updates do realtime.
- Pagamentos: edge functions no backend Lovable Cloud; o token do Mercado Pago entra como secret, nunca no frontend.
- Recibos e dashboard admin: consultas agregadas via RPC com política restrita a admin.
- Todos os novos estilos usam os tokens semânticos já definidos (preto/dourado), sem cores hardcoded.
