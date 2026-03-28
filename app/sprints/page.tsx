import { getOrCreateBoard } from '@/app/actions'
import { getSprintsWithMetricsAction } from '@/app/actions/dashboard'
import SprintListPage from '@/components/sprint/SprintListPage'

export const dynamic = 'force-dynamic'

export default async function SprintsPage() {
  const { boardId } = await getOrCreateBoard()
  const result = await getSprintsWithMetricsAction(boardId)

  const sprintsWithMetrics = Array.isArray(result) ? result.map(item => ({
    sprint: {
      ...item.sprint,
      status: item.sprint.status as 'PLANNED' | 'ACTIVE' | 'COMPLETED',
    },
    metrics: item.metrics,
  })) : []

  return (
    <SprintListPage
      sprintsWithMetrics={sprintsWithMetrics}
      boardId={boardId}
    />
  )
}
