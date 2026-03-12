import { ProjectDetailClient } from '@/components/dashboard/projects/ProjectDetailClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params
  return <ProjectDetailClient projectId={id} />
}
