import { put, del } from '@vercel/blob'
import { v4 as uuidv4 } from 'uuid'
import prisma from '@/lib/prisma'
import { FileUploadSchema } from '@/lib/validation/fileSchemas'

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export async function saveUpload(file: File, cardId: string) {
  const validation = FileUploadSchema.safeParse({
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
  })

  if (!validation.success) {
    throw new ValidationError(validation.error.issues[0].message)
  }

  const ext = file.name.includes('.') ? `.${file.name.split('.').pop()!.toLowerCase()}` : ''
  const safeFileName = `${uuidv4()}${ext}`
  const blob = await put(`uploads/${cardId}/${safeFileName}`, file, { access: 'public' })

  const attachment = await prisma.attachment.create({
    data: {
      cardId,
      fileName: file.name,
      fileType: file.type,
      filePath: blob.url,
      fileSize: file.size,
    },
  })

  return attachment
}

export async function deleteUpload(attachmentId: string) {
  const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } })
  if (!attachment) return

  try {
    await del(attachment.filePath)
  } catch {
    // blob may already be gone
  }

  await prisma.attachment.delete({ where: { id: attachmentId } })
}
