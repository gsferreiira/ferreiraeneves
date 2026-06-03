import { useRef, useState } from 'react'
import { Upload, X, Loader2, ImagePlus, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { uploadFoto, deleteFoto } from '@/lib/queries'
import { cn } from '@/lib/utils'

const MAX_MB = 8
const MAX_BYTES = MAX_MB * 1024 * 1024

async function comprimirParaWebP(file: File, maxWidth = 1920, quality = 0.85): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      let { width, height } = img
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas não suportado')); return }
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(blob => {
        if (!blob) { reject(new Error('Falha ao comprimir')); return }
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }))
      }, 'image/webp', quality)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Falha ao ler imagem')) }
    img.src = url
  })
}

interface PhotoUploaderProps {
  fotos: string[]
  onChange: (fotos: string[]) => void
  maxFotos?: number
}

export function PhotoUploader({ fotos, onChange, maxFotos = 10 }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<{ atual: number; total: number } | null>(null)
  const [dragging, setDragging] = useState(false)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return

    const remaining = maxFotos - fotos.length
    const candidatos = Array.from(files).slice(0, remaining)

    const muitoGrandes = candidatos.filter(f => f.size > MAX_BYTES)
    if (muitoGrandes.length > 0) {
      toast.error(`Arquivo(s) acima de ${MAX_MB}MB: ${muitoGrandes.map(f => f.name).join(', ')}`)
      return
    }

    setProgress({ atual: 0, total: candidatos.length })
    const novasUrls: string[] = []

    try {
      for (let i = 0; i < candidatos.length; i++) {
        setProgress({ atual: i + 1, total: candidatos.length })
        const arquivo = candidatos[i]
        const comprimido = arquivo.type !== 'image/gif'
          ? await comprimirParaWebP(arquivo)
          : arquivo
        const url = await uploadFoto(comprimido)
        novasUrls.push(url)
      }
      onChange([...fotos, ...novasUrls])
      toast.success(`${novasUrls.length} foto(s) enviada(s) — convertidas para WebP`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao enviar foto(s)')
    } finally {
      setProgress(null)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleRemove(url: string) {
    onChange(fotos.filter(f => f !== url))
    try { await deleteFoto(url) } catch { /* silencia */ }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const atLimit = fotos.length >= maxFotos
  const uploading = progress !== null

  return (
    <div className="space-y-4">
      <div
        className={cn(
          'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200',
          dragging ? 'border-orange-400 bg-orange-50 scale-[1.01]' : 'border-slate-200 hover:border-orange-300 hover:bg-slate-50',
          atLimit && 'opacity-50 pointer-events-none cursor-not-allowed',
        )}
        onClick={() => !atLimit && !uploading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
            <p className="text-sm font-semibold text-slate-700">
              Comprimindo e enviando {progress!.atual}/{progress!.total}…
            </p>
            <div className="w-48 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-300"
                style={{ width: `${(progress!.atual / progress!.total) * 100}%` }}
              />
            </div>
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
            <p className="text-sm font-semibold text-slate-700">Clique para selecionar fotos</p>
            <p className="text-xs text-slate-400">ou arraste e solte aqui — JPG, PNG, WEBP</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-3 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                {fotos.length}/{maxFotos} fotos
              </span>
              <span className="px-3 py-1 rounded-full bg-green-50 text-xs font-bold text-green-600 flex items-center gap-1">
                <Zap className="h-3 w-3" /> Auto WebP · máx {MAX_MB}MB
              </span>
            </div>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => handleFiles(e.target.files)} />
      </div>

      {fotos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {fotos.map((url, i) => (
            <div key={url} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group">
              <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity md:flex hidden" />
              <button type="button" onClick={() => handleRemove(url)}
                className={cn(
                  'absolute top-1 right-1 h-7 w-7 rounded-lg bg-red-500 text-white flex items-center justify-center shadow-md transition-all',
                  'md:opacity-0 md:group-hover:opacity-100 md:scale-75 md:group-hover:scale-100',
                )} aria-label="Remover foto">
                <X className="h-3.5 w-3.5" />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 text-[10px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded-md">Capa</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
