import prisma from './prisma.js'
 
const FASE_MAP: Record<string, string> = {
  'Matchday 1':  'GRUPOS',
  'Matchday 2':  'GRUPOS',
  'Matchday 3':  'GRUPOS',
  'Matchday 4':  'GRUPOS',
  'Matchday 5':  'GRUPOS',
  'Matchday 6':  'GRUPOS',
  'Matchday 7':  'GRUPOS',
  'Matchday 8':  'GRUPOS',
  'Matchday 9':  'GRUPOS',
  'Matchday 10': 'GRUPOS',
  'Matchday 11': 'GRUPOS',
  'Matchday 12': 'GRUPOS',
  'Matchday 13': 'GRUPOS',
  'Matchday 14': 'GRUPOS',
  'Matchday 15': 'GRUPOS',
  'Matchday 16': 'GRUPOS',
  'Matchday 17': 'GRUPOS',
  'Round of 32': 'ROUND_OF_32',
  'Round of 16': 'ROUND_OF_16',
  'Quarter-final': 'QUARTAS',
  'Semi-final': 'SEMIFINAL',
  'Match for third place': 'TERCEIRO_LUGAR',
  'Final': 'FINAL',
}
 
// Converte "2026-06-11" + "13:00 UTC-6" pra Date UTC
function parseDataHora(date: string, time: string): Date {
  const [hora, minuto] = time.split(' ')[0].split(':').map(Number)
  const offsetMatch = time.match(/UTC([+-]\d+)/)
  const offsetHoras = offsetMatch ? parseInt(offsetMatch[1]) : 0
  const local = new Date(`${date}T${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}:00`)
  // Converte para UTC subtraindo o offset
  local.setHours(local.getHours() - offsetHoras)
  return local
}
 
async function seed() {
  console.log('🌱 Iniciando seed...')
 
  // Carrega o JSON do calendário
  const { default: copa } = await import('../../data/copa2026.json', {
    assert: { type: 'json' },
  })
 
  const matches = (copa as any).matches as any[]
 
  // Coleta todos os times únicos da fase de grupos
  const timesSet = new Set<string>()
  for (const match of matches) {
    if (match.group && match.team1 && match.team2) {
      timesSet.add(match.team1)
      timesSet.add(match.team2)
    }
  }
 
  // Cria os times
  console.log(`⚽ Criando ${timesSet.size} times...`)
  const timesMap = new Map<string, string>() // nome → id
 
  for (const nome of timesSet) {
    // Descobre o grupo do time
    const jogo = matches.find((m) => m.team1 === nome || m.team2 === nome)
    const grupo = jogo?.group ?? null
 
    const time = await prisma.time.upsert({
      where: { nome },
      update: {},
      create: { nome, grupo },
    })
    timesMap.set(nome, time.id)
  }
 
  // Cria os jogos
  console.log(`📅 Criando ${matches.length} jogos...`)
 
  for (const match of matches) {
    const fase = FASE_MAP[match.round] ?? 'GRUPOS'
    const dataHora = parseDataHora(match.date, match.time)
 
    const isGrupos = !!match.group
    const timeCasaId = isGrupos ? timesMap.get(match.team1) ?? null : null
    const timeVisitanteId = isGrupos ? timesMap.get(match.team2) ?? null : null
 
    // No mata-mata, team1/team2 são refs como "W73", "1A"
    const timeCasaRef = !isGrupos ? match.team1 ?? null : null
    const timeVisitanteRef = !isGrupos ? match.team2 ?? null : null
 
    // Status: mata-mata começa bloqueado
    const status = isGrupos ? 'AGENDADO' : 'BLOQUEADO'
 
    await prisma.jogo.create({
      data: {
        num: match.num ?? null,
        fase: fase as any,
        rodada: match.round,
        grupo: match.group ?? null,
        dataHora,
        local: match.ground,
        timeCasaId,
        timeVisitanteId,
        timeCasaRef,
        timeVisitanteRef,
        status: status as any,
      },
    })
  }
 
  console.log('✅ Seed concluído!')
  console.log(`   ${timesSet.size} times criados`)
  console.log(`   ${matches.length} jogos criados`)
}
 
seed()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })