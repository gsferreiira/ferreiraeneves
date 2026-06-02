import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { PublicLayout } from '@/layouts/PublicLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { ProtectedRoute } from '@/layouts/ProtectedRoute'

const Home = lazy(() => import('@/pages/Home'))
const Imoveis = lazy(() => import('@/pages/Imoveis'))
const ImovelDetail = lazy(() => import('@/pages/ImovelDetail'))
const Favoritos = lazy(() => import('@/pages/Favoritos'))
const Blog = lazy(() => import('@/pages/Blog'))
const BlogPost = lazy(() => import('@/pages/BlogPost'))
const NotFound = lazy(() => import('@/pages/NotFound'))

const AdminLogin = lazy(() => import('@/pages/admin/Login'))
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'))
const AdminImoveisLista = lazy(() => import('@/pages/admin/imoveis/Lista'))
const AdminImoveisFormulario = lazy(() => import('@/pages/admin/imoveis/Formulario'))
const AdminProprietarios = lazy(() => import('@/pages/admin/Proprietarios'))
const AdminContratos = lazy(() => import('@/pages/admin/Contratos'))
const AdminAgendamentos = lazy(() => import('@/pages/admin/Agendamentos'))
const AdminPerfil = lazy(() => import('@/pages/admin/Perfil'))
const AdminEquipe = lazy(() => import('@/pages/admin/Equipe'))
const AdminHistorico = lazy(() => import('@/pages/admin/Historico'))
const AdminBlog = lazy(() => import('@/pages/admin/Blog'))

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  )
}

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <Suspense fallback={<Loading />}><Home /></Suspense> },
      { path: '/imoveis', element: <Suspense fallback={<Loading />}><Imoveis /></Suspense> },
      { path: '/imoveis/:id', element: <Suspense fallback={<Loading />}><ImovelDetail /></Suspense> },
      { path: '/favoritos', element: <Suspense fallback={<Loading />}><Favoritos /></Suspense> },
      { path: '/blog', element: <Suspense fallback={<Loading />}><Blog /></Suspense> },
      { path: '/blog/:slug', element: <Suspense fallback={<Loading />}><BlogPost /></Suspense> },
      { path: '*', element: <Suspense fallback={<Loading />}><NotFound /></Suspense> },
    ],
  },
  {
    path: '/admin/login',
    element: <Suspense fallback={<Loading />}><AdminLogin /></Suspense>,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin', element: <Suspense fallback={<Loading />}><AdminDashboard /></Suspense> },
          { path: '/admin/imoveis', element: <Suspense fallback={<Loading />}><AdminImoveisLista /></Suspense> },
          { path: '/admin/imoveis/novo', element: <Suspense fallback={<Loading />}><AdminImoveisFormulario /></Suspense> },
          { path: '/admin/imoveis/:id/editar', element: <Suspense fallback={<Loading />}><AdminImoveisFormulario /></Suspense> },
          { path: '/admin/proprietarios', element: <Suspense fallback={<Loading />}><AdminProprietarios /></Suspense> },
          { path: '/admin/contratos', element: <Suspense fallback={<Loading />}><AdminContratos /></Suspense> },
          { path: '/admin/agendamentos', element: <Suspense fallback={<Loading />}><AdminAgendamentos /></Suspense> },
          { path: '/admin/perfil', element: <Suspense fallback={<Loading />}><AdminPerfil /></Suspense> },
          { path: '/admin/equipe', element: <Suspense fallback={<Loading />}><AdminEquipe /></Suspense> },
          { path: '/admin/historico', element: <Suspense fallback={<Loading />}><AdminHistorico /></Suspense> },
          { path: '/admin/blog', element: <Suspense fallback={<Loading />}><AdminBlog /></Suspense> },
        ],
      },
    ],
  },
])

export function Router() {
  return <RouterProvider router={router} />
}
