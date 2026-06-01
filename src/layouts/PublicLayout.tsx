import { Outlet } from 'react-router-dom'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      {/* pb-20 garante que a navbar mobile no fundo não cobre o conteúdo */}
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}
