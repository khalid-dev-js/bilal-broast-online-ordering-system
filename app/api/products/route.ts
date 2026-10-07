import { backendApiBaseUrl } from '@/lib/backend-api'

export async function GET() {
  try {
    const response = await fetch(`${backendApiBaseUrl}/products?page=1&limit=100`, { cache: 'no-store' })
    return Response.json(await response.json(), { status: response.status })
  } catch {
    return Response.json({ success: false, data: { products: [] }, message: 'Unable to fetch products.' }, { status: 502 })
  }
}