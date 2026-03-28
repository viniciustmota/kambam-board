'use server'

import { verifySession } from '@/lib/dal'
import prisma from '@/lib/prisma'
import { migrateOrphanCards } from '@/services/migrationService'

export async function migrateOrphanCardsAction(boardId: string) {
  try {
    await verifySession()
    return await migrateOrphanCards(boardId)
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erro na migração' }
  }
}

export async function getOrphanCardCountAction(boardId: string): Promise<number> {
  try {
    await verifySession()
    return await prisma.card.count({
      where: { column: { boardId }, sprintId: null },
    })
  } catch {
    return 0
  }
}
