import { ProjectDetailClient } from '@/components/dashboard/projects/ProjectDetailClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ChangeControlDetailPage({ params }: Props) {
  const { id } = await params
  return <ProjectDetailClient projectId={id} backHref="/change-controls" backLabel="Volver a Control de Cambios" />
}
