import { useRef, useState } from 'react'
import { Upload, X, Loader2, ImagePlus } from 'lucide-react'
import { toast } from 'sonner'
import { uploadFoto, deleteFoto } from '@/lib/queries'
import { cn } from '@/lib/utils'

interface PhotoUploaderProps {
  fotos: string[]
  onChange: (fotos: string[]) => void
  maxFotos?: number
}

export function PhotoUploader({ fotos, onChange, maxFotos = 10 }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const remaining = maxFotos - fotos.length
    const toUpload = Array.from(files).slice(0, remaining)
    setUploading(true)
    try {
      const urls = await Promise.all(toUpload.map(f => uploadFoto(f)))
      onChange([...fotos, ...urls])
      toast.success(`${urls.length} foto(s) enviada(s)`)
    } catch {
      toast.error('Erro ao enviar foto(s). Verifique se o bucket foi criado no Supabase.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleRemove(url: string) {
    onChange(fotos.filter(f => f !== url))
    try { await deleteFoto(url) } catch { /* silencia erros do storage */ }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const atLimit = fotos.length >= maxFotos

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className={cn(
          'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200',
          dragging ? 'border-orange-400 bg-orange-50 scale-[1.01]' : 'border-slate-200 hover:border-orange-300 hover:bg-slate-50',
          atLimit && 'opacity-50 pointer-events-none cursor-not-allowed',
        )}
        onClick={() => !atLimit && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
            <p className="text-sm font-medium text-slate-500">Enviando fotos...</p>
          </div>
        ) : atLimit ? (
          <div className="flex flex-col items-center gap-2">
            <ImagePlus className="h-10 w-10 text-slate-300" />
            <p className="text-sm font-semibold text-slate-400">Limite de {maxFotos} fotos atingido</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="h-14 w-14 rounded-2xl bg-orange-50 flex items-center justify-center mb-1">
              <Upload className="h-7 w-7 text-orange-500" />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              Clique para selecionar fotos
            </p>
            <p className="text-xs text-slate-400">ou arraste e solte aqui — JPG, PNG, WEBP</p>
            <div className="mt-2 px-3 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-500">
              {fotos.length}/{maxFotos} fotos
            </div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {/* Grade de fotos */}
      {fotos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {fotos.map((url, i) => (
            <div key={url} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group">
              <img
                src={url}
                alt={`Foto ${i + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Overlay no hover (desktop) */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity md:flex hidden" />

              {/* Botão excluir — sempre visível no mobile, hover no desktop */}
              <button
                type="button"
                onClick={() => handleRemove(url)}
                className={cn(
                  'absolute top-1 right-1 h-7 w-7 rounded-lg bg-red-500 text-white flex items-center justify-center shadow-md transition-all',
                  'md:opacity-0 md:group-hover:opacity-100 md:scale-75 md:group-hover:scale-100', // desktop: aparece no hover
                  // mobile: sempre visível (não tem md: prefix abaixo)
                )}
                aria-label="Remover foto"
              >
                <X className="h-3.5 w-3.5" />
              </button>

              {/* Badge capa */}
              {i === 0 && (
                <span className="absolute bottom-1 left-1 text-[10px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded-md">
                  Capa
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
