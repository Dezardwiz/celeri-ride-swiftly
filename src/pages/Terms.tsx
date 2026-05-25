import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <h1 className="font-display text-3xl font-semibold text-foreground">Termos de Uso</h1>
        <p className="text-sm text-muted-foreground">Última atualização: 25 de maio de 2026</p>

        <section className="space-y-3 text-sm leading-relaxed text-foreground/90">
          <h2 className="font-display text-xl font-semibold pt-4">1. Aceitação dos Termos</h2>
          <p>Ao utilizar o aplicativo CELERI, você concorda integralmente com estes Termos de Uso. Caso não concorde, não utilize o serviço.</p>

          <h2 className="font-display text-xl font-semibold pt-4">2. Sobre o Serviço</h2>
          <p>O CELERI é uma plataforma tecnológica que conecta passageiros a mototaxistas independentes na cidade de Montes Claros - MG. O CELERI não presta diretamente o serviço de transporte, atuando como intermediador.</p>

          <h2 className="font-display text-xl font-semibold pt-4">3. Cadastro</h2>
          <p>Para utilizar o app é necessário cadastro com dados verdadeiros. O usuário é responsável pela veracidade das informações e pela guarda das credenciais.</p>

          <h2 className="font-display text-xl font-semibold pt-4">4. Tarifas e Pagamentos</h2>
          <p>As tarifas são calculadas dinamicamente com base em distância, tempo, horário e demanda. O CELERI retém uma comissão administrativa sobre cada corrida. Pagamentos podem ser realizados via carteira digital, dinheiro ou Pix, conforme disponibilidade.</p>

          <h2 className="font-display text-xl font-semibold pt-4">5. Cancelamentos</h2>
          <p>Cancelamentos após a aceitação da corrida pelo mototaxista podem gerar taxa, conforme regras vigentes exibidas no momento do cancelamento.</p>

          <h2 className="font-display text-xl font-semibold pt-4">6. Conduta do Usuário</h2>
          <p>É vedado usar o serviço para fins ilícitos, transportar materiais proibidos, ou desrespeitar mototaxistas e demais usuários. Condutas inadequadas podem resultar em suspensão.</p>

          <h2 className="font-display text-xl font-semibold pt-4">7. Limitação de Responsabilidade</h2>
          <p>O CELERI não se responsabiliza por danos decorrentes da relação entre passageiro e mototaxista, ressalvadas as obrigações legais aplicáveis.</p>

          <h2 className="font-display text-xl font-semibold pt-4">8. Alterações</h2>
          <p>Estes Termos podem ser alterados a qualquer momento. O uso contínuo do app após alterações implica aceitação.</p>

          <h2 className="font-display text-xl font-semibold pt-4">9. Foro</h2>
          <p>Fica eleito o foro da Comarca de Montes Claros - MG para dirimir quaisquer controvérsias.</p>
        </section>

        <p className="pt-8 text-center text-xs text-muted-foreground">desenvolvido por payn</p>
      </div>
    </div>
  );
}