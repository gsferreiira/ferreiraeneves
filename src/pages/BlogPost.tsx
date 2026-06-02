import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, BookOpen } from 'lucide-react'
import { useArtigo } from '@/lib/queries'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { Button } from '@/components/ui/button'

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function readTime(content: string) {
  const words = content.replace(/<[^>]+>/g, '').split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const { data: artigo, isLoading, error } = useArtigo(slug!)

  useDocumentMeta({
    title: artigo?.titulo,
    description: artigo?.resumo ?? undefined,
    image: artigo?.imagem_url ?? undefined,
  })

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
        <div className="h-8 w-48 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-4 bg-slate-100 rounded animate-pulse" />)}
        </div>
      </div>
    )
  }

  if (error || !artigo) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <BookOpen className="h-12 w-12 text-slate-200 mx-auto mb-4" />
        <p className="text-lg font-semibold text-slate-500 mb-4">Artigo não encontrado.</p>
        <Button asChild><Link to="/blog">Voltar ao Blog</Link></Button>
      </div>
    )
  }

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-8">
        <ArrowLeft className="h-4 w-4" /> Voltar ao Blog
      </Link>

      {artigo.imagem_url && (
        <div className="h-56 sm:h-80 rounded-2xl overflow-hidden mb-8 bg-slate-100">
          <img src={artigo.imagem_url} alt={artigo.titulo} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex items-center gap-4 text-sm text-slate-400 font-medium mb-5">
        <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{formatDate(artigo.created_at)}</span>
        <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{readTime(artigo.conteudo)} min de leitura</span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
        {artigo.titulo}
      </h1>

      {artigo.resumo && (
        <p className="text-lg text-slate-500 leading-relaxed border-l-4 border-orange-400 pl-5 mb-8 font-medium">
          {artigo.resumo}
        </p>
      )}

      <div
        className="prose prose-slate prose-lg max-w-none prose-headings:font-heading prose-headings:font-extrabold prose-a:text-orange-600 prose-strong:text-slate-900 prose-img:rounded-2xl"
        dangerouslySetInnerHTML={{ __html: artigo.conteudo }}
      />

      <div className="mt-12 pt-8 border-t border-slate-100">
        <p className="text-sm text-slate-400 mb-4">Precisa de ajuda para encontrar seu imóvel?</p>
        <Link to="/imoveis" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-md shadow-orange-500/20">
          Ver imóveis disponíveis
        </Link>
      </div>
    </article>
  )
}
