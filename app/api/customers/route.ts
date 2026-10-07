import { NextRequest } from 'next/server'
import { backendApiBaseUrl } from '@/lib/backend-api'

const customersUrl = `${backendApiBaseUrl}/customers`

export async function GET() {
  try {
    const response = await fetch(customersUrl, { cache: 'no-store' })
    return Response.json(await response.json(), { status: response.status })
  } catch {
    return Response.json({ success: false, data: [], message: 'Unable to load customers.' }, { status: 502 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const response = await fetch(customersUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(await request.json()),
      cache: 'no-store',
    })
    return Response.json(await response.json(), { status: response.status })
  } catch {
    return Response.json({ success: false, message: 'Unable to save customer.' }, { status: 502 })
  }
}