
## Entrega 5: Tarifa dinâmica por demanda
- Nova tabela `surge_rules` (regras por dia/hora com multiplicador).
- RPC `get_active_surge()` retorna multiplicador combinando regra horária ativa + boost automático por demanda (corridas REQUESTED nos últimos 5 min vs motoristas disponíveis).
- `calculatePrice` aceita multiplicador; UI mostra badge "Tarifa dinâmica xN".
- Tela admin em `/admin` para CRUD das regras.
## Roadmap Celeri — próximas evoluções

Com base nas suas escolhas, organizei o avanço em **6 entregas** focadas em experiência do passageiro, do mototaxista, regras operacionais e preparação para lançamento.

---

### 1. Experiência do passageiro
- **Autocomplete de endereços melhorado**: já usamos Nominatim — vamos adicionar histórico de buscas, locais favoritos (Casa, Trabalho) e ícones por categoria.
- **ETA em tempo real**: mostrar tempo estimado de chegada do mototaxista ao ponto de embarque, atualizado conforme ele se move (usa a localização ao vivo já existente).
- **Compartilhar viagem**: botão "Compartilhar trajeto" gera link público temporário com mapa ao vivo da corrida para um contato de confiança.
- **Tela de acompanhamento aprimorada**: foto, nome, placa, modelo da moto e avaliação do mototaxista visíveis durante toda a corrida.

### 2. Experiência do mototaxista
- **Navegação externa integrada**: botão "Iniciar navegação" abre Google Maps/Waze com o destino preenchido (deep link nativo via Capacitor).
- **Métricas pessoais**: tela de desempenho com taxa de aceitação, taxa de cancelamento, corridas/hora e ganho médio.
- **Modo descanso**: pausar recebimento de novas corridas por 15/30/60 min sem ficar offline (mantém aparição no mapa do admin).
- **Resumo da corrida antes de aceitar**: distância até o passageiro + distância da corrida + ganho líquido (já descontada a comissão).

### 3. Cancelamento com regras e taxas
- Janela gratuita de **2 minutos** após aceitar.
- Após o estado **ARRIVED** (motorista no local), cancelamento do passageiro gera taxa configurável (ex.: R$ 5,00) debitada da carteira ou cobrada na próxima corrida.
- Motoristas com taxa de cancelamento alta entram em alerta no painel admin.
- Motivos pré-definidos (passageiro não apareceu, endereço errado, problema com a moto, outro).
- Registro completo de cancelamentos para auditoria.

### 4. Tarifa dinâmica por demanda
- Cálculo automático de multiplicador (1.0x → 2.5x) baseado em:
  - razão `corridas em REQUESTED / motoristas disponíveis` por região.
  - faixas de horário configuráveis (rush, madrugada).
- Multiplicador exibido com transparência ao passageiro **antes** de confirmar ("Tarifa 1.4× — alta demanda").
- Configuração no painel admin: faixas, multiplicador máximo, ativação por região.

### 5. Onboarding e verificação de motoristas
Fluxo completo após o cadastro inicial em `/driver/auth`:
1. Upload de **CNH** (frente/verso).
2. Upload de **CRLV** da moto.
3. Upload de **selfie segurando documento**.
4. Foto da moto (frontal e placa).
5. Aceite dos termos do mototaxista.
6. Status "Em análise" até aprovação no painel admin (já existente, será expandido com visualização dos documentos e botões aprovar/recusar com motivo).
- Documentos armazenados em bucket privado, acessíveis somente ao admin.

### 6. Páginas legais e políticas (pré-lançamento)
Páginas públicas necessárias para Apple App Store e Google Play:
- **Termos de Uso** (passageiro e mototaxista — versões separadas).
- **Política de Privacidade** (compatível com LGPD: dados coletados, finalidade, retenção, direitos do titular, contato do DPO).
- **Política de Cancelamento e Reembolso**.
- **Código de Conduta** (passageiro e mototaxista).
- Aceite obrigatório registrado no banco no primeiro login após publicação (`accepted_terms_at`, `accepted_terms_version`).
- Links no rodapé do app, na tela de cadastro e no perfil.

---

### Detalhes técnicos

**Banco de dados (novas tabelas/colunas)**
- `saved_places` (passageiro): label, endereço, lat/lng.
- `search_history` (passageiro): últimos endereços buscados.
- `cancellations`: ride_id, canceled_by, reason, fee_amount, occurred_at.
- `surge_zones` + `surge_rules`: regiões e regras de multiplicador.
- `driver_documents`: tipo, url, status (pending/approved/rejected), reviewed_by.
- `legal_documents` + `user_consents`: versões e aceites.
- Adições em `drivers`: rating médio, taxa de cancelamento (calculadas).
- Adições em `rides`: surge_multiplier, cancellation_fee.

**Storage**
- Novo bucket privado `driver-documents` com RLS (motorista vê os próprios; admin vê todos).

**Edge functions**
- `calculate-surge`: roda periodicamente atualizando multiplicadores por zona.
- `process-cancellation`: aplica taxa, atualiza estatísticas, libera motorista.

**Frontend**
- Novas telas: `/driver/onboarding`, `/driver/stats`, `/share/:rideId`, `/legal/*`.
- Componentes: `DriverInfoCard`, `SurgeBadge`, `CancellationDialog`, `DocumentUpload`, `SavedPlacesList`.
- Deep links nativos via `@capacitor/app` para Waze/Google Maps.

---

### Ordem sugerida de implementação

1. **Cancelamento com regras e taxas** (curto, destrava confiança).
2. **Onboarding e verificação de motoristas** (essencial para qualidade da frota).
3. **Experiência do passageiro** (favoritos, ETA, info do mototaxista).
4. **Experiência do mototaxista** (navegação externa, métricas, modo descanso).
5. **Tarifa dinâmica** (precisa de volume mínimo para calibrar).
6. **Páginas legais** (último passo antes de empacotar para as lojas).

Posso começar pela entrega 1 ou você prefere outra ordem?