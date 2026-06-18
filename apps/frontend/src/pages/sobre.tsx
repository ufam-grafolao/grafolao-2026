export default function SobrePage() {
  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8 py-4">
      <div>
        <h1 className="text-2xl font-bold mb-1">Sobre o Grafolão da Copa</h1>
        <p className="text-sm text-muted-foreground">Copa do Mundo 2026 · IComp/UFAM</p>
      </div>

      <div className="flex flex-col gap-4 text-sm leading-relaxed text-foreground/90">
        <p>
          O <strong>GRAFOLÃO DA COPA</strong> está no ar, misturando Bolão da Copa do Mundo 2026
          com Grafos — teoria e algoritmos, e transformando tudo em um dashboard lúdico e interativo,
          usando técnicas de desenvolvimento de software acelerado por IA Generativa. Une dados reais
          (resultados dos jogos), comportamento dos participantes (palpites) e visualização dinâmica.
        </p>

        <p>
          O Grafolão da Copa é fruto de Trabalho Final da disciplina de{' '}
          <strong>Introdução à Teoria dos Grafos</strong>, período 2026/01, ministrada pela{' '}
          <strong>Profa. Rosiane de Freitas</strong>, que concebeu a proposta que está sendo
          desenvolvida por um grupo de alunos de Ciência da Computação do IComp/UFAM, com
          desenvolvimento liderado pelo graduando <strong>Samuel Davi Silva de Lima Chagas</strong> sob
          orientação da Profa. Rosiane, como parte das ações do grupo de pesquisa CNPq{' '}
          <strong>ALGOX</strong> (Algoritmos, Otimização, Inteligência e Complexidade Computacional)
          — Instituto de Computação da Universidade Federal do Amazonas (IComp/UFAM).
        </p>

        <p>
          O sistema ainda está sendo construído (o registro de palpites está disponível durante a Copa,
          por jogo e em lotes) com as suas diversas funcionalidades baseadas em teoria e algoritmos em
          grafos. Os melhores palpiteiros terão destaque após a fase de grupos e, principalmente, ao
          final — totalmente gratuito e não envolvendo apostas financeiras, é a essência saudável dos
          bolões tradicionais, agora envolvendo ciência &amp; computação.
        </p>
      </div>

      <div>
        <h2 className="text-base font-semibold mb-3">
          Após a Fase de Grupos, a brincadeira ficará mais divertida:
        </h2>
        <ul className="flex flex-col gap-2">
          {[
            { nome: 'Grafo de Confrontos', desc: 'Duelo de Palpiteiros' },
            { nome: 'Cliques e Panelinhas', desc: 'Comunidades Máximas' },
            { nome: 'Redes de Similaridades', desc: 'Laços de Palpites' },
            { nome: 'Aventura da Zebra', desc: 'MST da Divergência' },
            { nome: 'Caminho Mínimo para o Título', desc: '' },
          ].map(f => (
            <li
              key={f.nome}
              className="flex items-start gap-2 rounded-lg border border-border px-4 py-3 text-sm"
            >
              <span className="text-primary mt-0.5">▸</span>
              <span>
                <strong>{f.nome}</strong>
                {f.desc && <span className="text-muted-foreground"> — {f.desc}</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-muted-foreground border-t border-border pt-4">
        IComp/UFAM · Manaus, AM · 2026
      </p>
    </div>
  )
}
