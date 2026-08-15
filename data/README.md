# Dados de Reprodução — Grafolão (WFA 2026)

Dados anonimizados extraídos da instância de produção do Grafolão ao final
da fase avaliada da Copa do Mundo FIFA 2026, disponibilizados para fins de
reprodução dos resultados apresentados no artigo submetido ao Workshop de
Ferramentas e Aplicações (WFA 2026 / WebMedia).

## Anonimização

Todo `usuarioId` foi substituído por um pseudônimo estável (`user1`,
`user2`, ...). Não há nome, e-mail, avatar ou qualquer outro identificador
pessoal nestes arquivos. O mesmo pseudônimo é usado de forma consistente em
todos os CSVs, permitindo reconstruir o grafo de confrontos e reproduzir os
algoritmos descritos no artigo (detecção de ciclos, PageRank, caminho mais
longo).

Os participantes se cadastraram no Grafolão para uso recreativo do bolão,
sem consentimento formal para publicação de dados pessoais — por isso a
anonimização é uma condição obrigatória desta exportação, não uma opção.

## Arquivos

| Arquivo | Descrição |
|---|---|
| `usuarios_anonimizados.csv` | Pseudônimo de cada participante e data de criação da conta. |
| `jogos.csv` | Calendário completo da competição: times, fase, data, placar oficial. Dados públicos, sem alteração. |
| `palpites_anonimizados.csv` | Cada palpite registrado: usuário (pseudônimo), jogo, placar previsto, pontuação obtida. |
| `confrontos_anonimizados.csv` | Arestas do grafo de confrontos já agregadas: para cada par de participantes com saldo positivo, o vencedor, o perdedor e o peso (saldo de vitórias). |

## Reprodução

`confrontos_anonimizados.csv` já reflete a agregação descrita na Seção de
Modelagem do artigo (saldo de vitórias entre cada par de participantes) e
pode ser usado diretamente para reproduzir os três algoritmos: detecção de
ciclos (DFS), PageRank iterativo e busca de caminho mais longo com
orçamento de tempo.

Alternativamente, é possível reconstruir `confrontos_anonimizados.csv` do
zero a partir de `palpites_anonimizados.csv` e `jogos.csv`, comparando a
pontuação de cada par de participantes por partida — o mesmo critério
usado pelo sistema em produção. Essa via mais longa serve como verificação
independente do pipeline de agregação.

Os números resultantes devem corresponder à Tabela 1 do artigo: 197
participantes, 3.235 confrontos, 1.228 ciclos detectados no grafo
completo (dados equivalentes para a versão filtrada, `k \geq 10` palpites).

Código-fonte da implementação: [link do repositório GitHub — este mesmo repositório]
