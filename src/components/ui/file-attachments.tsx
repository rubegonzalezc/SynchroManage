'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Paperclip, Upload, X, FileText, Image as ImageIcon, Loader2, Download,
  Trash2, Eye, File, FileSpreadsheet,
} from 'lucide-react'

interface Attachment {
  id: string
  file_name: string
  file_size: number
  file_type: string
  file_url: string
  created_at: string
  uploaded_by: { id: string; full_name: string; avatar_url: string | null } | null
}

interface FileAttachmentsProps {
  taskId?: string
  projectId?: string
  bugId?: string
  currentUserId: string
}

const ALLOWED_EXTENSIONS = '.jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.doc,.docx,.xls,.xlsx'

function isImage(fileType: string) {
  return fileType.startsWith('image/')
}

function isPdf(fileType: string) {
  return fileType === 'application/pdf'
}

function isExcel(fileType: string) {
  return fileType === 'application/vnd.ms-excel' || fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(fileType: string) {
  if (isImage(fileType)) return <ImageIcon className="w-4 h-4" />
  if (isPdf(fileType)) return <FileText className="w-4 h-4 text-red-500" />
  if (isExcel(fileType)) return <FileSpreadsheet className="w-4 h-4 text-green-600" />
  return <File className="w-4 h-4 text-blue-500" />
}

export function FileAttachments({ taskId, projectId, bugId, currentUserId }: FileAttachmentsProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewName, setPreviewName] = useState<string>('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [attachmentToDelete, setAttachmentToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [fetched, setFetched] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchAttachments = useCallback(async () => {
    setLoading(true)
    try {
      const params = taskId ? `task_id=${taskId}` : bugId ? `bug_id=${bugId}` : `project_id=${projectId}`
      const res = await fetch(`/api/dashboard/attachments?${params}`)
      const data = await res.json()
      if (res.ok) setAttachments(data.attachments || [])
    } catch (err) {
      console.error('Error fetching attachments:', err)
    } finally {
      setLoading(false)
      setFetched(true)
    }
  }, [taskId, projectId, bugId])

  // Cargar al montar
  useEffect(() => {
    if (!fetched) fetchAttachments()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (taskId) formData.append('task_id', taskId)
      if (projectId) formData.append('project_id', projectId)
      if (bugId) formData.append('bug_id', bugId)

      const res = await fetch('/api/dashboard/attachments/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (res.ok && data.attachment) {
        setAttachments(prev => [data.attachment, ...prev])
      } else {
        alert(data.error || 'Error al subir archivo')
      }
    } catch (err) {
      console.error('Error uploading:', err)
      alert('Error al subir archivo')
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleUpload(file)
  }

  const handleDelete = async () => {
    if (!attachmentToDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/dashboard/attachments/${attachmentToDelete}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setAttachments(prev => prev.filter(a => a.id !== attachmentToDelete))
      }
    } catch (err) {
      console.error('Error deleting:', err)
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setAttachmentToDelete(null)
    }
  }

  const openPreview = (attachment: Attachment) => {
    setPreviewUrl(attachment.file_url)
    setPreviewName(attachment.file_name)
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-foreground flex items-center gap-2">
          <Paperclip className="w-4 h-4" />
          Archivos adjuntos
          {attachments.length > 0 && (
            <span className="text-xs text-muted-foreground">({attachments.length})</span>
          )}
        </h4>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Subiendo...</>
          ) : (
            <><Upload className="w-4 h-4 mr-1" />Subir archivo</>
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_EXTENSIONS}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-4 text-center transition-colors
          ${dragOver
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-muted-foreground/50'
          }
        `}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Subiendo archivo...</span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Arrastra archivos aquí o haz clic en &quot;Subir archivo&quot;
            <br />
            <span className="text-xs">Imágenes, PDF, Word, Excel · Máx. 10MB</span>
          </p>
        )}
      </div>

      {/* Lista de archivos */}
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : attachments.length > 0 ? (
        <div className="space-y-2">
          {/* Vista previa de imágenes en grid */}
          {attachments.filter(a => isImage(a.file_type)).length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {attachments.filter(a => isImage(a.file_type)).map(attachment => (
                <div
                  key={attachment.id}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-border bg-muted cursor-pointer"
                  onClick={() => openPreview(attachment)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={attachment.file_url}
                    alt={attachment.file_name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button
                        className="p-1.5 bg-background/90 rounded-full text-foreground hover:bg-background"
                        onClick={(e) => { e.stopPropagation(); openPreview(attachment) }}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={attachment.file_url}
                        download={attachment.file_name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-background/90 rounded-full text-foreground hover:bg-background"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button
                        className="p-1.5 bg-background/90 rounded-full text-red-600 dark:text-red-400 hover:bg-background"
                        onClick={(e) => {
                          e.stopPropagation()
                          setAttachmentToDelete(attachment.id)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                    <p className="text-xs text-white truncate">{attachment.file_name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Documentos en lista */}
          {attachments.filter(a => !isImage(a.file_type)).map(attachment => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                {getFileIcon(attachment.file_type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{attachment.file_name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatFileSize(attachment.file_size)}</span>
                  {attachment.uploaded_by && (
                    <>
                      <span>·</span>
                      <div className="flex items-center gap-1">
                        <Avatar className="w-4 h-4">
                          <AvatarImage src={attachment.uploaded_by.avatar_url || undefined} />
                          <AvatarFallback className="text-[8px]">
                            {getInitials(attachment.uploaded_by.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{attachment.uploaded_by.full_name}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {isPdf(attachment.file_type) && (
                  <button
                    onClick={() => openPreview(attachment)}
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                    title="Vista previa"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
                <a
                  href={attachment.file_url}
                  download={attachment.file_name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                  title="Descargar"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => {
                    setAttachmentToDelete(attachment.id)
                    setDeleteDialogOpen(true)
                  }}
                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-red-600"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <DialogTitle className="sr-only">{previewName}</DialogTitle>
          <div className="flex items-center justify-between p-4 pr-12 border-b border-border">
            <p className="text-sm font-medium text-foreground truncate pr-4">{previewName}</p>
            <div className="flex items-center gap-2">
              <a
                href={previewUrl || ''}
                download={previewName}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          </div>
          <div className="flex items-center justify-center bg-muted/30 min-h-[400px] max-h-[calc(90vh-60px)] overflow-auto">
            {previewUrl && previewName.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={previewUrl}
                alt={previewName}
                className="max-w-full max-h-[calc(90vh-60px)] object-contain"
              />
            ) : previewUrl && previewName.match(/\.pdf$/i) ? (
              <iframe
                src={previewUrl}
                className="w-full h-[calc(90vh-60px)]"
                title={previewName}
              />
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Vista previa no disponible</p>
                <a
                  href={previewUrl || ''}
                  download={previewName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline mt-2 inline-block"
                >
                  Descargar archivo
                </a>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar archivo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El archivo será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Eliminando...</> : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
