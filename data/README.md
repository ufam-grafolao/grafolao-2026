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
| `confrontos_anonimizados.csv` | Um confronto por linha (14.188 linhas): em um jogo, o participante que fez mais pontos (`vencedorId`) e o que fez menos (`perdedorId`), com `peso` = 1. **Não** são as arestas agregadas. |

## Reprodução

`confrontos_anonimizados.csv` traz os confrontos brutos, um por par de
participantes em cada jogo. As arestas do grafo saem da agregação por saldo:
para cada par, vitórias de A sobre B menos vitórias de B sobre A; só há aresta
se o saldo for > 0, do vencedor líquido para o perdedor, com o saldo como peso.
O grafo filtrado usa apenas participantes com pelo menos 10 palpites.

Conferido sobre estes CSVs (contagem, 2026-11-13): 3.235 arestas no grafo
completo e 1.612 no filtrado, com 72 participantes com ≥ 10 palpites.

Ainda **não** foram reproduzidos a partir destes arquivos: os ciclos (1.228 e
841), o caminho mais longo (85 e 62, ambos com `completou=false` na coleta de
produção) e o PageRank. O número de vértices da coleta de produção (197) não
foi reconciliado com estes CSVs: eles têm 198 usuários, 154 com ao menos um
palpite e 139 presentes em arestas.

Os números de produção foram coletados em 2026-08-14, com a base ainda viva,
e podem variar entre coletas. Os arquivos não trazem rótulo de fase de grupo
ou mata-mata nos confrontos; ver `jogos.csv` para o calendário.
