import prisma from '@/lib/prisma'

export async function migrateOrphanCards(boardId: string): Promise<{ sprintId: string; migrated: number }> {
  const orphans = await prisma.card.findMany({
    where: { column: { boardId }, sprintId: null },
    include: { column: true },
  })

  if (orphans.length === 0) return { sprintId: '', migrated: 0 }

  const sprint = await prisma.sprint.create({
    data: { boardId, name: 'Sprint Backlog Inicial', status: 'ACTIVE' },
  })

  const [colTodo, colDoing, colDone] = await Promise.all([
    prisma.sprintColumn.create({ data: { sprintId: sprint.id, title: 'A Fazer', position: 0 } }),
    prisma.sprintColumn.create({ data: { sprintId: sprint.id, title: 'Em Andamento', position: 1 } }),
    prisma.sprintColumn.create({ data: { sprintId: sprint.id, title: 'Concluído', position: 2 } }),
  ])

  const posCounters: Record<string, number> = {}

  await Promise.all(orphans.map(card => {
    const colTitle = card.column.title
    const isDone = /conclu|done|feito|finish/i.test(colTitle)
    const isDoing = /andamento|progress|doing/i.test(colTitle)
    const sprintCol = isDone ? colDone : isDoing ? colDoing : colTodo
    const pos = posCounters[sprintCol.id] ?? 0
    posCounters[sprintCol.id] = pos + 1
    return prisma.card.update({
      where: { id: card.id },
      data: { sprintId: sprint.id, sprintColumnId: sprintCol.id, sprintPosition: pos },
    })
  }))

  return { sprintId: sprint.id, migrated: orphans.length }
}
