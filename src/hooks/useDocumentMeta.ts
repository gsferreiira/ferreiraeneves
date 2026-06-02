import { useEffect } from 'react'

interface Meta {
  title?: string
  description?: string
  image?: string
}

const DEFAULT_TITLE = 'Ferreira & Neves — Empreendimentos Imobiliários'
const DEFAULT_DESCRIPTION = 'Ferreira & Neves Empreendimentos Imobiliários — compra, venda e locação de imóveis com assessoria jurídica completa.'

function setMetaTag(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function useDocumentMeta({ title, description, image }: Meta) {
  useEffect(() => {
    const finalTitle = title ? `${title} · Ferreira & Neves` : DEFAULT_TITLE
    const finalDesc = description ?? DEFAULT_DESCRIPTION
    document.title = finalTitle
    setMetaTag('name', 'description', finalDesc)
    setMetaTag('property', 'og:title', finalTitle)
    setMetaTag('property', 'og:description', finalDesc)
    if (image) setMetaTag('property', 'og:image', image)

    return () => {
      document.title = DEFAULT_TITLE
      setMetaTag('name', 'description', DEFAULT_DESCRIPTION)
    }
  }, [title, description, image])
}
