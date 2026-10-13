import { backendApiBaseUrl } from '@/lib/backend-api'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  try {
    const response = await fetch(`${backendApiBaseUrl}/customers/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      cache: 'no-store',
    })
    return Response.json(await response.json(), { status: response.status })
  } catch {
    return Response.json({ success: false, message: 'Unable to delete customer.' }, { status: 502 })
  }
}
