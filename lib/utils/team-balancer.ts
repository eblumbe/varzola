interface PlayerForBalancing {
  id: string
  name: string
  isUser: boolean
  technicalLevel: number
  recentPerformance?: number
}

export function balanceTeams(
  players: PlayerForBalancing[],
  numberOfTeams: number = 2
): PlayerForBalancing[][] {
  const scored = players.map((p) => ({
    ...p,
    score:
      p.technicalLevel * 0.6 +
      (p.recentPerformance ?? p.technicalLevel) * 0.4,
  }))

  scored.sort((a, b) => b.score - a.score)

  const teams: PlayerForBalancing[][] = Array.from(
    { length: numberOfTeams },
    () => []
  )

  scored.forEach((player, index) => {
    const round = Math.floor(index / numberOfTeams)
    const teamIndex =
      round % 2 === 0
        ? index % numberOfTeams
        : numberOfTeams - 1 - (index % numberOfTeams)
    teams[teamIndex].push(player)
  })

  return teams
}
