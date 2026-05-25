import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <h1 className="font-display text-3xl font-semibold text-foreground">Política de Privacidade</h1>
        <p className="text-sm text-muted-foreground">Em conformidade com a LGPD (Lei nº 13.709/2018). Última atualização: 25 de maio de 2026</p>

        <section className="space-y-3 text-sm leading-relaxed text-foreground/90">
          <h2 className="font-display text-xl font-semibold pt-4">1. Controlador dos Dados</h2>
          <p>O CELERI é o controlador dos dados pessoais coletados neste aplicativo, conforme definido pela LGPD.</p>

          <h2 className="font-display text-xl font-semibold pt-4">2. Dados Coletados</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Cadastro:</strong> nome, e-mail, telefone, foto de perfil.</li>
            <li><strong>Mototaxista:</strong> CPF, CNH, placa, modelo e documentos do veículo.</li>
            <li><strong>Localização:</strong> geolocalização em tempo real durante uso do app.</li>
            <li><strong>Uso:</strong> histórico de corridas, avaliações, pagamentos.</li>
            <li><strong>Técnicos:</strong> identificador do dispositivo, IP, logs.</li>
          </ul>

          <h2 className="font-display text-xl font-semibold pt-4">3. Finalidades</h2>
          <p>Os dados são usados para: viabilizar corridas, conectar passageiros a mototaxistas, processar pagamentos, calcular tarifas dinâmicas, garantir segurança, atender obrigações legais e melhorar o serviço.</p>

          <h2 className="font-display text-xl font-semibold pt-4">4. Base Legal</h2>
          <p>Tratamos seus dados com base em: execução de contrato (art. 7º, V), cumprimento de obrigação legal (art. 7º, II), legítimo interesse (art. 7º, IX) e consentimento (art. 7º, I), quando aplicável.</p>

          <h2 className="font-display text-xl font-semibold pt-4">5. Compartilhamento</h2>
          <p>Compartilhamos dados estritamente necessários com: mototaxistas (para realizar a corrida), provedores de mapas e pagamento, e autoridades quando exigido por lei. Não vendemos dados a terceiros.</p>

          <h2 className="font-display text-xl font-semibold pt-4">6. Armazenamento e Segurança</h2>
          <p>Os dados são armazenados em infraestrutura segura com criptografia em trânsito e em repouso, e acesso restrito por políticas de segurança (RLS). Retemos os dados pelo tempo necessário às finalidades e obrigações legais.</p>

          <h2 className="font-display text-xl font-semibold pt-4">7. Seus Direitos (LGPD)</h2>
          <p>Você pode, a qualquer momento: confirmar tratamento, acessar, corrigir, anonimizar, portar, eliminar dados, revogar consentimento e se opor ao tratamento. Solicitações podem ser feitas pelo e-mail: <a className="text-primary hover:underline" href="mailto:privacidade@celeri.app">privacidade@celeri.app</a>.</p>

          <h2 className="font-display text-xl font-semibold pt-4">8. Cookies e Tecnologias Similares</h2>
          <p>Usamos armazenamento local e cookies essenciais para autenticação e funcionamento do app.</p>

          <h2 className="font-display text-xl font-semibold pt-4">9. Alterações</h2>
          <p>Esta política pode ser atualizada. Notificaremos mudanças relevantes no próprio aplicativo.</p>

          <h2 className="font-display text-xl font-semibold pt-4">10. Contato do Encarregado (DPO)</h2>
          <p>Para questões sobre privacidade e proteção de dados: <a className="text-primary hover:underline" href="mailto:dpo@celeri.app">dpo@celeri.app</a>.</p>
        </section>

        <p className="pt-8 text-center text-xs text-muted-foreground">desenvolvido por payn</p>
      </div>
    </div>
  );
}