import { Link } from 'react-router-dom'
import { BookOpen, Calendar, ArrowRight, Newspaper } from 'lucide-react'
import { useArtigos } from '@/lib/queries'
import { FadeIn } from '@/components/FadeIn'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { cn } from '@/lib/utils'

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function readTime(content: string) {
  const words = content.replace(/<[^>]+>/g, '').split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

export default function Blog() {
  const { data: artigos = [], isLoading } = useArtigos()

  useDocumentMeta({
    title: 'Blog & Dicas',
    description: 'Dicas, novidades e tudo sobre o mercado imobiliário pela Ferreira & Neves.',
  })

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Header */}
      <FadeIn className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100 mb-4">
          <BookOpen className="h-3.5 w-3.5 text-orange-600" />
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Blog & Dicas</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-slate-900 tracking-tight mb-3">
          Mercado imobiliário em <span className="text-orange-600">foco</span>
        </h1>
        <p className="text-slate-500 text-base">Informação especializada para quem quer comprar, vender ou alugar com segurança.</p>
      </FadeIn>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-72 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : artigos.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
          <Newspaper className="h-12 w-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-semibold">Nenhum artigo publicado ainda.</p>
          <p className="text-slate-400 text-sm mt-1">Em breve traremos conteúdo especial para você.</p>
        </div>
      ) : (
        <>
          {/* Artigo destaque */}
          {artigos[0] && (
            <FadeIn className="mb-8">
              <Link
                to={`/blog/${artigos[0].slug}`}
                className="group grid md:grid-cols-2 gap-0 bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="relative h-56 md:h-full bg-slate-100 overflow-hidden">
                  {artigos[0].imagem_url
                    ? <img src={artigos[0].imagem_url} alt={artigos[0].titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    : <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center"><BookOpen className="h-16 w-16 text-orange-200" /></div>
                  }
                  <span className="absolute top-4 left-4 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">Destaque</span>
                </div>
                <div className="p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-medium mb-3">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(artigos[0].created_at)}
                    <span>·</span>
                    <span>{readTime(artigos[0].conteudo)} min de leitura</span>
                  </div>
                  <h2 className="text-2xl font-heading font-extrabold text-slate-900 tracking-tight mb-3 group-hover:text-orange-600 transition-colors leading-snug">
                    {artigos[0].titulo}
                  </h2>
                  {artigos[0].resumo && <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-3">{artigos[0].resumo}</p>}
                  <span className="inline-flex items-center gap-2 text-orange-600 font-bold text-sm group-hover:gap-3 transition-all">
                    Ler artigo <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            </FadeIn>
          )}

          {/* Grade restante */}
          {artigos.length > 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {artigos.slice(1).map((artigo, i) => (
                <FadeIn key={artigo.id} delay={i * 80}>
                  <Link
                    to={`/blog/${artigo.slug}`}
                    className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full"
                  >
                    <div className={cn('h-44 overflow-hidden bg-slate-100 shrink-0', !artigo.imagem_url && 'flex items-center justify-center')}>
                      {artigo.imagem_url
                        ? <img src={artigo.imagem_url} alt={artigo.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                        : <BookOpen className="h-12 w-12 text-slate-200" />
                      }
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium mb-2">
                        <Calendar className="h-3 w-3" />
                        {formatDate(artigo.created_at)}
                        <span>· {readTime(artigo.conteudo)} min</span>
                      </div>
                      <h3 className="font-heading font-bold text-slate-900 text-base line-clamp-2 mb-2 leading-snug group-hover:text-orange-600 transition-colors">
                        {artigo.titulo}
                      </h3>
                      {artigo.resumo && <p className="text-slate-500 text-sm line-clamp-2 flex-1">{artigo.resumo}</p>}
                      <span className="inline-flex items-center gap-1.5 text-orange-600 font-bold text-xs mt-4 group-hover:gap-2.5 transition-all">
                        Ler mais <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                </FadeIn>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
