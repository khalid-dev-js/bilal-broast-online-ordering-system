import { NextRequest } from 'next/server'
import { backendApiBaseUrl } from '@/lib/backend-api'

const ordersUrl = `${backendApiBaseUrl}/admin/orders/local`

export async function GET(request: NextRequest) {
  const url = new URL(ordersUrl)
  for (const key of ['dateFrom', 'dateTo']) {
    const value = request.nextUrl.searchParams.get(key)
    if (value) url.searchParams.set(key, value)
  }
  url.searchParams.set('isCallOrder', 'true')
  try {
    const response = await fetch(url, { cache: 'no-store' })
    return Response.json(await response.json(), { status: response.status })
  } catch {
    return Response.json({ success: false, data: [], total: 0, message: 'Unable to load local orders.' }, { status: 502 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const response = await fetch(ordersUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, isCallOrder: true }),
      cache: 'no-store',
    })
    return Response.json(await response.json(), { status: response.status })
  } catch {
    return Response.json({ success: false, message: 'Unable to create order.' }, { status: 502 })
  }
}