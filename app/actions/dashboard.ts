'use server'

import { verifySession } from '@/lib/dal'
import prisma from '@/lib/prisma'
import { getGlobalKPIs, getUserMetrics, getSprintMetrics, getSprintDashboard, getSprintsWithMetrics, getMemberCardMetrics, getOverdueCards } from '@/services/dashboardService'

export async function getDashboardDataAction() {
  try {
    await verifySession()
    const [kpis, userMetrics, memberMetrics, overdueCards, sprints] = await Promise.all([
      getGlobalKPIs(),
      getUserMetrics(),
      getMemberCardMetrics(),
      getOverdueCards(),
      prisma.sprint.findMany({ orderBy: { createdAt: 'asc' } }),
    ])

    const sprintMetrics = await Promise.all(sprints.map(s => getSprintMetrics(s.id).then(m => ({ ...m, name: s.name, id: s.id }))))

    return { kpis, userMetrics, memberMetrics, overdueCards, sprintMetrics }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erro ao carregar dashboard' }
  }
}

export async function getSprintsWithMetricsAction() {
  try {
    await verifySession()
    return await getSprintsWithMetrics()
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erro ao carregar sprints' }
  }
}

export async function getSprintDashboardAction(sprintId: string) {
  try {
    await verifySession()
    return await getSprintDashboard(sprintId)
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erro ao carregar dashboard da sprint' }
  }
}
