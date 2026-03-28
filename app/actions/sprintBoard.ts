'use server'

import { verifySession } from '@/lib/dal'
import prisma from '@/lib/prisma'
import { randomUUID } from 'crypto'
import {
  getSprintColumns,
  createSprintColumn,
  initSprintColumns,
  moveCardInSprint,
  renameSprintColumn,
  deleteSprintColumn,
  reorderSprintColumns,
} from '@/services/sprintColumnService'

export async function getSprintBoardAction(sprintId: string) {
  try {
    await verifySession()
    const sprint = await prisma.sprint.findUnique({ where: { id: sprintId } })
    if (!sprint) return { error: 'Sprint não encontrado' }

    let columns = await getSprintColumns(sprintId)
    if (columns.length === 0) {
      await initSprintColumns(sprintId)
      columns = await getSprintColumns(sprintId)
    }

    const [users, tags] = await Promise.all([
      prisma.user.findMany({ select: { id: true, name: true, email: true, avatarUrl: true } }),
      prisma.tag.findMany({ where: { boardId: sprint.boardId } }),
    ])

    return { sprint, columns, users, tags }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erro ao carregar sprint board' }
  }
}

export async function addSprintColumnAction(sprintId: string, title: string) {
  try {
    await verifySession()
    const existing = await getSprintColumns(sprintId)
    const position = existing.length
    const column = await createSprintColumn(sprintId, title, position)
    return { column }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erro ao criar coluna' }
  }
}

export async function moveCardInSprintAction(cardId: string, sprintColumnId: string, sprintPosition: number) {
  try {
    await verifySession()
    await moveCardInSprint(cardId, sprintColumnId, sprintPosition)
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erro ao mover card' }
  }
}

export async function createCardInSprintAction(input: {
  sprintId: string
  sprintColumnId: string
  title: string
  description?: string
  color?: string
}) {
  try {
    await verifySession()

    // Find first available board column (fallback for required columnId)
    const sprint = await prisma.sprint.findUnique({ where: { id: input.sprintId } })
    if (!sprint) return { error: 'Sprint não encontrado' }

    const firstColumn = await prisma.column.findFirst({
      where: { boardId: sprint.boardId },
      orderBy: { position: 'asc' },
    })
    if (!firstColumn) return { error: 'Nenhuma coluna encontrada no board' }

    const existingCards = await prisma.card.count({
      where: { sprintColumnId: input.sprintColumnId },
    })

    const card = await prisma.card.create({
      data: {
        id: randomUUID(),
        title: input.title,
        description: input.description ?? '',
        responsible: '',
        color: input.color ?? '#3b82f6',
        position: 0,
        columnId: firstColumn.id,
        sprintId: input.sprintId,
        sprintColumnId: input.sprintColumnId,
        sprintPosition: existingCards,
      },
    })
    return { card }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erro ao criar card' }
  }
}

export async function renameSprintColumnAction(columnId: string, title: string) {
  try {
    await verifySession()
    const column = await renameSprintColumn(columnId, title)
    return { column }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erro ao renomear coluna' }
  }
}

export async function deleteSprintColumnAction(columnId: string) {
  try {
    await verifySession()
    await deleteSprintColumn(columnId)
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erro ao excluir coluna' }
  }
}

export async function reorderSprintColumnsAction(columnIds: string[]) {
  try {
    await verifySession()
    await reorderSprintColumns(columnIds)
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erro ao reordenar colunas' }
  }
}

export async function updateCardInSprintAction(
  cardId: string,
  data: {
    title: string
    description: string
    responsible: string
    color: string
    responsibleId?: string | null
  },
) {
  try {
    await verifySession()
    const card = await prisma.card.update({ where: { id: cardId }, data })
    return { card }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erro ao atualizar card' }
  }
}

export async function deleteCardInSprintAction(cardId: string) {
  try {
    await verifySession()
    await prisma.card.delete({ where: { id: cardId } })
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erro ao excluir card' }
  }
}

export async function updateSprintMetaAction(
  sprintId: string,
  data: { qualidade?: number; dificuldade?: number; description?: string },
) {
  try {
    await verifySession()
    const sprint = await prisma.sprint.update({ where: { id: sprintId }, data })
    return { sprint }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erro ao atualizar sprint' }
  }
}
