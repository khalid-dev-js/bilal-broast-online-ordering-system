'use client'

import Image from 'next/image'
import {
  Bell, CalendarDays, Check, ChevronDown, CircleDollarSign,
  ClipboardList, CreditCard, Home as HomeIcon, LogOut, Minus, Plus, Search, Trash2,
  ShoppingBag, UserPlus, Users, WalletCards, X,
} from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'

const PRODUCTS_URL = '/api/products'
const ORDERS_URL = '/api/orders/local'
const CUSTOMERS_URL = '/api/customers'
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85'
const LOGIN_CREDENTIALS = { id: 'admin@bilalbroast.test', password: 'changeme123' }

const navigation = [
  { label: 'Home', icon: HomeIcon },
  { label: 'Orders', icon: ClipboardList },
  { label: 'Customers', icon: Users },
]

const paymentMethods = [
  { label: 'Cash', icon: CircleDollarSign },
  { label: 'Card', icon: CreditCard },
  { label: 'Wallet', icon: WalletCards },
]

type Product = {
  id: string
  slug: string
  name: string
  price: number
  image: string
  category: string
  description: string
}

type CartItem = Product & { quantity: number }
type Customer = { id: string; name: string; phone: string; address: string }
type OrderItem = { nameSnapshot?: string; quantity?: number; priceSnapshot?: number; lineTotal?: number }
type SavedOrder = {
  _id?: string
  orderNumber?: string
  items?: OrderItem[]
  grandTotal?: number
  deliveryCharges?: number
  createdAt?: string
  orderStatus?: string
  customerName?: string
}

function money(value: number) {
  return `Rs. ${Number(value || 0).toLocaleString('en-PK', { maximumFractionDigits: 2 })}`
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character] || character)
}

function receiptHtml(order: SavedOrder, customer: Customer, payment: string, deliveryCharges: number) {
  const createdAt = order.createdAt ? new Date(order.createdAt) : new Date()
  const items = order.items || []
  const subtotal = items.reduce((sum, item) => sum + Number(item.lineTotal ?? Number(item.priceSnapshot || 0) * Number(item.quantity || 0)), 0)
  const totalDue = Number(order.grandTotal ?? subtotal) + deliveryCharges
  const rows = items.map((item) => `<tr><td>${escapeHtml(item.nameSnapshot || 'Item')}</td><td class="qty">x${Number(item.quantity || 0)}</td><td class="price">${Number(item.lineTotal ?? Number(item.priceSnapshot || 0) * Number(item.quantity || 0)).toLocaleString('en-PK')}</td></tr>`).join('')
  return `<!doctype html><html><head><meta charset="utf-8"><title>Order ${escapeHtml(order.orderNumber || '')}</title><style>
    @page{size:58mm auto;margin:0}*{box-sizing:border-box}html,body{width:58mm;margin:0;background:#fff;color:#111;font:10px Arial,sans-serif}.receipt{width:50mm;margin:0 auto;padding:4mm 1mm 6mm}.logo{display:block;width:44mm;max-height:27mm;object-fit:contain;margin:0 auto 1mm}.store-info{text-align:center;font-size:9px;line-height:1.45;margin-bottom:3mm}.store-phone{font-weight:700;letter-spacing:.2px}.rule{border-top:1px solid #111;margin:2.5mm 0}.meta{line-height:1.55;overflow-wrap:anywhere}.meta strong{font-size:12px}table{width:100%;border-collapse:collapse;table-layout:fixed;font-weight:700}th,td{padding:1.5mm 0;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{font-size:9px}th:first-child,td:first-child{width:43%;padding-right:1mm;font-size:9px}th:nth-child(2),td.qty{width:17%;text-align:center;white-space:nowrap}th:last-child,td.price{width:40%;padding-right:32px;text-align:right;white-space:nowrap}.totals{line-height:1.6;font-weight:700}.charge-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:baseline;column-gap:1mm;padding-right:14mm}.charge-row>span:last-child{text-align:right;white-space:nowrap}.grand{margin-top:1mm;border-top:1px dashed #777;padding-top:1mm;font-size:12px;font-weight:900}.thanks{margin-top:4mm;text-align:center;font-weight:700;line-height:1.5}
  </style></head><body><main class="receipt"><img class="logo" src="${window.location.origin}/bilal-broast-logo.png" alt="Bilal Broast"><div class="store-info"><div>Shop No. 12, New Town</div><div class="store-phone">Phone: 03314919145</div></div><div class="rule"></div><div class="meta"><strong>Online Order</strong><br>Date: ${createdAt.toLocaleDateString('en-GB')} ${createdAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}<br>Customer: ${escapeHtml(customer.name)}<br>Contact: ${escapeHtml(customer.phone)}<br>Address: ${escapeHtml(customer.address)}<br>Payment: ${escapeHtml(payment)}</div><div class="rule"></div><table><thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead><tbody>${rows}</tbody></table><div class="rule"></div><div class="totals"><div class="charge-row"><span>Subtotal</span><span>${subtotal.toLocaleString('en-PK', { maximumFractionDigits: 2 })}</span></div><div class="charge-row"><span>Delivery charges</span><span>${deliveryCharges.toLocaleString('en-PK', { maximumFractionDigits: 2 })}</span></div><div class="charge-row grand"><span>Total Due</span><span>${totalDue.toLocaleString('en-PK', { maximumFractionDigits: 2 })}</span></div></div><div class="rule"></div><div class="thanks">Thank You For Choosing Bilal Broast<br>Visit Again!</div></main></body></html>`
}

async function printOrder(order: SavedOrder, customer: Customer, payment: string, deliveryCharges: number, printWindow: Window) {
  printWindow.document.open()
  printWindow.document.write(receiptHtml(order, customer, payment, deliveryCharges))
  printWindow.document.close()
  const logo = printWindow.document.querySelector<HTMLImageElement>('.logo')
  if (logo) await Promise.race([logo.decode().catch(() => undefined), new Promise<void>((resolve) => window.setTimeout(resolve, 1200))])
  printWindow.focus()
  printWindow.print()
  window.setTimeout(() => printWindow.close(), 800)
}

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginId, setLoginId] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [section, setSection] = useState('Home')
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerId, setCustomerId] = useState('')
  const [payment, setPayment] = useState('Cash')
  const [deliveryChargesInput, setDeliveryChargesInput] = useState('')
  const [category, setCategory] = useState('All Items')
  const [menuSearch, setMenuSearch] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [customerModalOpen, setCustomerModalOpen] = useState(false)
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', address: '' })
  const [customerError, setCustomerError] = useState('')
  const [customerActionError, setCustomerActionError] = useState('')
  const [deletingCustomerId, setDeletingCustomerId] = useState('')
  const [productError, setProductError] = useState('')
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [orderError, setOrderError] = useState('')
  const [saving, setSaving] = useState(false)
  const [ordersDate, setOrdersDate] = useState('')
  const [ordersNameFilter, setOrdersNameFilter] = useState('')
  const [orders, setOrders] = useState<SavedOrder[] | null>(null)
  const [ordersError, setOrdersError] = useState('')

  useEffect(() => {
    fetch(CUSTOMERS_URL).then(async (response) => {
      const payload: { success?: boolean; message?: string; data?: unknown } = await response.json()
      if (!response.ok || payload?.success === false) throw new Error(payload?.message || 'Could not load customers.')
      const data = payload.data && typeof payload.data === 'object' ? payload.data as Record<string, unknown> : {}
      const list = Array.isArray(payload.data) ? payload.data : Array.isArray(data.customers) ? data.customers : []
      setCustomers(list.map((entry: unknown) => {
        const customer = entry && typeof entry === 'object' ? entry as Record<string, unknown> : {}
        return {
          id: String(customer._id || customer.id || ''),
          name: String(customer.name || ''),
          phone: String(customer.mobileNumber || customer.phone || ''),
          address: String(customer.address || ''),
        }
      }).filter((customer) => customer.id))
    }).catch((error: unknown) => setCustomerError(error instanceof Error ? error.message : 'Could not load customers.'))

    fetch(PRODUCTS_URL).then(async (response) => {
      const payload: { success?: boolean; message?: string; data?: unknown } = await response.json()
      if (!response.ok || payload?.success === false) throw new Error(payload?.message || 'Could not load the live menu.')
      const data = payload.data && typeof payload.data === 'object' ? payload.data as Record<string, unknown> : {}
      const list = Array.isArray(data.products) ? data.products : []
      setProducts(list.map((entry: unknown) => {
        const item = entry && typeof entry === 'object' ? entry as Record<string, unknown> : {}
        const productCategory = item.category && typeof item.category === 'object' ? item.category as Record<string, unknown> : {}
        const id = String(item._id || item.id || '')
        return {
          id,
          slug: String(item.slug || item._id || item.id || ''),
          name: String(item.name || 'Menu item'),
          price: Number(item.price || 0),
          image: String(item.image || productCategory.image || FALLBACK_IMAGE),
          category: String(productCategory.name || 'General'),
          description: String(item.description || 'Freshly prepared from our kitchen.'),
        }
      }))
    }).catch((error: unknown) => setProductError(error instanceof Error ? error.message : 'Could not load menu.'))
      .finally(() => setLoadingProducts(false))
  }, [])

  useEffect(() => {
    if (section !== 'Orders') return
    const controller = new AbortController()
    const params = new URLSearchParams({ isCallOrder: 'true' })
    if (ordersDate) {
      params.set('dateFrom', ordersDate)
      params.set('dateTo', ordersDate)
    }
    const query = `?${params.toString()}`
    fetch(`${ORDERS_URL}${query}`, { signal: controller.signal }).then(async (response) => {
      const payload: { success?: boolean; message?: string; data?: unknown } = await response.json()
      if (!response.ok || payload?.success === false) throw new Error(payload?.message || 'Could not load orders.')
      setOrders(Array.isArray(payload?.data) ? payload.data as SavedOrder[] : [])
    }).catch((error: unknown) => {
      if (error instanceof Error && error.name === 'AbortError') return
      setOrders([])
      setOrdersError(error instanceof Error ? error.message : 'Could not load orders.')
    })
    return () => controller.abort()
  }, [section, ordersDate])

  const categories = useMemo(() => ['All Items', ...new Set(products.map((item) => item.category))], [products])
  const shownProducts = useMemo(() => products.filter((item) => (category === 'All Items' || item.category === category) && item.name.toLowerCase().includes(menuSearch.trim().toLowerCase())), [products, category, menuSearch])
  const selectedCustomer = customers.find((customer) => customer.id === customerId) || null
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const deliveryCharges = Number(deliveryChargesInput)
  const hasValidDeliveryCharges = deliveryChargesInput.trim() !== '' && Number.isFinite(deliveryCharges) && deliveryCharges >= 0
  const totalDue = total + (hasValidDeliveryCharges ? deliveryCharges : 0)
  const visibleOrders = (orders || []).filter((order) => (order.customerName || '').toLowerCase().includes(ordersNameFilter.trim().toLowerCase()))
  const customerQuery = customerSearch.trim().toLowerCase()
  const shownCustomers = customers.filter((customer) =>
    `${customer.name} ${customer.phone} ${customer.address}`.toLowerCase().includes(customerQuery),
  )
  const directoryCustomers = customers.filter((customer) => `${customer.name} ${customer.phone} ${customer.address}`.toLowerCase().includes(customerFilter.trim().toLowerCase()))

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loginId.trim().toLowerCase() !== LOGIN_CREDENTIALS.id || loginPassword !== LOGIN_CREDENTIALS.password) {
      setLoginError('ID or password is incorrect.')
      return
    }
    setLoginError('')
    setIsAuthenticated(true)
  }

  async function saveCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = customerForm.name.trim()
    const phone = customerForm.phone.trim()
    const address = customerForm.address.trim()
    if (!name || !phone || !address) {
      setCustomerError('Name, contact number, and address are required.')
      return
    }
    setCustomerError('')
    try {
      const response = await fetch(CUSTOMERS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mobileNumber: phone, address }),
      })
      const payload = await response.json()
      const saved = payload?.data?.customer ?? payload?.data
      if (!response.ok || payload?.success === false || !saved || Array.isArray(saved)) {
        throw new Error(payload?.message || 'Could not save customer.')
      }
      const customer: Customer = {
        id: String(saved._id || saved.id || ''),
        name: saved.name || name,
        phone: saved.mobileNumber || saved.phone || phone,
        address: saved.address || address,
      }
      if (!customer.id) throw new Error('Customer saved, but the API response did not include its ID.')
      setCustomers((current) => [customer, ...current.filter((entry) => entry.id !== customer.id)])
      setCustomerId(customer.id)
      setCustomerForm({ name: '', phone: '', address: '' })
      setCustomerModalOpen(false)
    } catch (error) {
      setCustomerError(error instanceof Error ? error.message : 'Could not save customer.')
    }
  }

  async function deleteCustomer(customer: Customer) {
    if (deletingCustomerId || !window.confirm(`Delete ${customer.name}? This action cannot be undone.`)) return

    setDeletingCustomerId(customer.id)
    setCustomerActionError('')
    try {
      const response = await fetch(`${CUSTOMERS_URL}/${encodeURIComponent(customer.id)}`, { method: 'DELETE' })
      const payload: { success?: boolean; message?: string } = await response.json()
      if (!response.ok || payload.success === false) {
        throw new Error(payload.message || 'Could not delete customer.')
      }
      setCustomers((current) => current.filter((entry) => entry.id !== customer.id))
      setCustomerId((current) => current === customer.id ? '' : current)
    } catch (error) {
      setCustomerActionError(error instanceof Error ? error.message : 'Could not delete customer.')
    } finally {
      setDeletingCustomerId('')
    }
  }

  function addToCart(product: Product) {
    setOrderError('')
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id)
      return existing ? current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { ...product, quantity: 1 }]
    })
  }

  function adjustItem(id: string, difference: number) {
    setCart((current) => current.map((item) => item.id === id ? { ...item, quantity: item.quantity + difference } : item).filter((item) => item.quantity > 0))
  }

  async function finishOrder() {
    if (saving || cart.length === 0) return
    if (!hasValidDeliveryCharges) {
      setOrderError('Enter valid delivery charges before completing this order.')
      return
    }
    if (!selectedCustomer) {
      setOrderError('Select a customer before completing this order.')
      setDropdownOpen(true)
      return
    }
    const printWindow = window.open('', '_blank', 'width=420,height=900')
    if (printWindow) {
      printWindow.document.write('<!doctype html><title>Saving order</title><body style="font:16px Arial,sans-serif;padding:24px">Saving orderâ€¦</body>')
      printWindow.document.close()
    }
    setSaving(true)
    setOrderError('')
    try {
      const response = await fetch(ORDERS_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((item) => ({ productId: item.slug || item.id, quantity: item.quantity })),
          paymentMethod: payment === 'Cash' ? 'cash' : 'online',
          customerName: selectedCustomer.name,
          deliveryCharges,
          isCallOrder: true,
        }),
      })
      const payload = await response.json()
      const order: SavedOrder | undefined = payload?.data?.order ?? payload?.data
      if (!response.ok || payload?.success === false || !order || Array.isArray(order)) throw new Error(payload?.message || 'The backend did not confirm this order.')
      if (printWindow) await printOrder({ ...order, deliveryCharges }, selectedCustomer, payment, deliveryCharges, printWindow)
      else setOrderError('Order saved. Allow pop-ups to print the receipt.')
      setCart([])
      setDeliveryChargesInput('')
    } catch (error) {
      printWindow?.close()
      setOrderError(error instanceof Error ? error.message : 'Could not save this order.')
    } finally {
      setSaving(false)
    }
  }

  if (!isAuthenticated) return <main className="login-shell"><form className="login-card" onSubmit={handleLogin}><div className="login-brand"><span>Bilal</span><strong>Broast</strong><small>ONLINE ORDERING</small></div><h1>Sign in to continue</h1><label className="login-field">ID / Email<input autoComplete="username" autoFocus required type="email" value={loginId} onChange={(event) => setLoginId(event.target.value)} /></label><label className="login-field">Password<input autoComplete="current-password" required type="password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} /></label>{loginError && <p className="login-error" role="alert">{loginError}</p>}<button className="primary-button login-submit" type="submit">Login</button></form></main>

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand-lockup"><Image alt="Bilal Broast" className="brand-logo" height={661} priority src="/bilal-broast-logo-color.png" width={1000} /><small>ONLINE ORDERING</small></div>
      <nav className="side-nav" aria-label="Main navigation">{navigation.map(({ label, icon: Icon }) => <button className={section === label ? 'nav-item active' : 'nav-item'} key={label} onClick={() => { if (label === 'Orders') { setOrders(null); setOrdersError('') } setSection(label) }}><Icon size={21} />{label}</button>)}</nav>
      <div className="sidebar-bottom"><span className="status-dot" /> Live ordering <button aria-label="Sign out" title="Sign out" onClick={() => setIsAuthenticated(false)}><LogOut size={18} /></button></div>
    </aside>

    <section className="workspace">
      <header className="topbar"><div><p className="eyebrow">BILAL BROAST / POS</p><h1>{section === 'Home' ? 'Online ordering' : section}</h1></div><label className="global-search"><Search size={18} /><input aria-label="Search menu items" placeholder="Search menu items" value={menuSearch} onChange={(event) => setMenuSearch(event.target.value)} /><kbd>Ctrl K</kbd></label><div className="terminal"><span>TERMINAL</span><strong>Online Â· T2</strong></div><button className="icon-button notification-button" aria-label="Notifications"><Bell size={19} /><i /></button><div className="avatar">BA</div></header>

      <div className="page-content">
        {section === 'Home' && <div className="order-layout">
          <section className="catalog-panel"><div className="catalog-title"><div><p className="eyebrow">TODAYâ€™S MENU</p><h2>Choose your items</h2></div><span className="live-label"><i /> MENU LIVE</span></div><div className="category-strip">{categories.map((item) => <button className={category === item ? 'category-chip selected' : 'category-chip'} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div><ProductGrid products={shownProducts} loading={loadingProducts} error={productError} addProduct={addToCart} /></section>
          <aside className="order-panel"><div className="order-panel-heading"><div><p className="eyebrow">CURRENT SALE</p><h2>Order panel</h2></div><span className="walkin-tag">ONLINE</span></div><div className="cart-column-head"><span>Item</span><span>Price</span><span>Qty</span></div><div className="cart-lines">{cart.map((item) => <div className="cart-line" key={item.id}><span className="cart-item-name">{item.name}<small>{item.category}</small></span><span>{money(item.price)}</span><div className="quantity-control"><button aria-label={`Remove one ${item.name}`} onClick={() => adjustItem(item.id, -1)}><Minus size={13} /></button><strong>{item.quantity}</strong><button aria-label={`Add one ${item.name}`} onClick={() => adjustItem(item.id, 1)}><Plus size={13} /></button></div></div>)}{cart.length === 0 && <div className="cart-empty"><ShoppingBag size={22} /><span>Your order is empty</span><small>Select items from the menu</small></div>}</div>
            <div className="customer-picker-wrap"><div className="picker-label-row"><label htmlFor="customer-picker">Customer</label><button className="text-button" onClick={() => setCustomerModalOpen(true)}><UserPlus size={15} /> Add new</button></div><button aria-expanded={dropdownOpen} aria-haspopup="listbox" className="customer-picker" id="customer-picker" onClick={() => setDropdownOpen(!dropdownOpen)}><span>{selectedCustomer ? <><strong>{selectedCustomer.name}</strong><small>{selectedCustomer.address}</small></> : <span className="placeholder">Select a customerâ€¦</span>}</span><ChevronDown size={17} /></button>
              {dropdownOpen && <div className="customer-dropdown"><label className="dropdown-search"><Search size={16} /><input autoFocus placeholder="Search name, contact, or address" value={customerSearch} onChange={(event) => setCustomerSearch(event.target.value)} /></label><div className="customer-options" role="listbox" aria-label="Saved customers">{shownCustomers.map((customer) => <button aria-selected={customerId === customer.id} className="customer-option" key={customer.id} onClick={() => { setCustomerId(customer.id); setDropdownOpen(false); setCustomerSearch(''); setOrderError('') }} role="option"><strong>{customer.name}</strong><span>{customer.address}</span></button>)}{shownCustomers.length === 0 && <p className="no-customer-match">No matching customers</p>}</div><button className="dropdown-add" onClick={() => { setDropdownOpen(false); setCustomerModalOpen(true) }}><UserPlus size={16} /> Add customer</button></div>}
              {selectedCustomer && <div className="selected-customer-detail"><span>{selectedCustomer.phone}</span><span>{selectedCustomer.address}</span></div>}
            </div>
            <div className="payment-block"><div className="picker-label-row"><span>Payment method</span></div><div className="payment-options">{paymentMethods.map(({ label, icon: Icon }) => <button className={payment === label ? 'payment-option selected' : 'payment-option'} key={label} onClick={() => setPayment(label)}><Icon size={18} /><span>{label}</span></button>)}</div></div>
            <label className="delivery-charge-field" htmlFor="delivery-charges"><span>Delivery charges</span><div><span>Rs.</span><input id="delivery-charges" min="0" placeholder="Enter amount" required step="0.01" type="number" value={deliveryChargesInput} onChange={(event) => { setDeliveryChargesInput(event.target.value); setOrderError('') }} /></div></label>
            <div className="totals-block"><div><span>Subtotal</span><strong>{money(total)}</strong></div><div><span>Delivery charges</span><strong>{hasValidDeliveryCharges ? money(deliveryCharges) : '—'}</strong></div><div className="total-due"><span>Total due</span><strong>{money(totalDue)}</strong></div></div>{orderError && <p className="inline-error" role="alert">{orderError}</p>}<button className="complete-button" disabled={!cart.length || saving || !hasValidDeliveryCharges} onClick={() => void finishOrder()}><Check size={18} />{saving ? 'Saving orderâ€¦' : 'Order done'}</button><p className="checkout-note">Enter delivery charges and choose a customer before completing this order.</p>
          </aside>
        </div>}

        {section === 'Customers' && <section className="content-section"><SectionHeading eyebrow="CUSTOMER DIRECTORY" title="Customers" count={customers.length} action={<button className="primary-button" onClick={() => setCustomerModalOpen(true)}><UserPlus size={17} /> Add customer</button>} /><label className="directory-search"><Search size={17} /><input placeholder="Find by name, contact or address" value={customerFilter} onChange={(event) => setCustomerFilter(event.target.value)} /></label>{customerActionError && <p className="inline-error" role="alert">{customerActionError}</p>}<div className="table-wrap"><table className="data-table"><thead><tr><th>Customer</th><th>Contact</th><th>Delivery address</th><th>Actions</th></tr></thead><tbody>{directoryCustomers.map((customer) => <tr key={customer.id}><td><strong>{customer.name}</strong></td><td>{customer.phone}</td><td>{customer.address}</td><td><div className="customer-actions"><button className="text-button" onClick={() => { setCustomerId(customer.id); setSection('Home') }}>Select for order</button><button aria-label={`Delete ${customer.name}`} className="customer-delete-button" disabled={Boolean(deletingCustomerId)} onClick={() => void deleteCustomer(customer)}><Trash2 size={14} />{deletingCustomerId === customer.id ? 'Deleting…' : 'Delete'}</button></div></td></tr>)}</tbody></table>{directoryCustomers.length === 0 && <EmptyState title="No customers found" action={<button className="text-button" onClick={() => setCustomerModalOpen(true)}>Add a customer</button>} />}</div></section>}

        {section === 'Orders' && <section className="content-section"><SectionHeading eyebrow="ONLINE ORDERS" title="Saved orders" action={<div className="orders-filters"><label className="directory-search"><Search size={17} /><input aria-label="Filter orders by customer name" placeholder="Filter customer name" value={ordersNameFilter} onChange={(event) => setOrdersNameFilter(event.target.value)} /></label><label className="date-filter"><CalendarDays size={17} /><input aria-label="Filter orders by date" type="date" value={ordersDate} onChange={(event) => { setOrders(null); setOrdersError(''); setOrdersDate(event.target.value) }} /></label></div>} /><div className="table-wrap"><table className="data-table"><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Placed</th><th>Total</th><th>Status</th></tr></thead><tbody>{visibleOrders.map((order, index) => <tr key={order._id || order.orderNumber || index}><td><strong>{order.orderNumber || order._id}</strong></td><td>{order.customerName || '—'}</td><td>{(order.items || []).map((item) => `${item.nameSnapshot || 'Item'} ×${item.quantity || 0}`).join(', ')}</td><td>{order.createdAt ? new Date(order.createdAt).toLocaleString() : '—'}</td><td><strong>{money(Number(order.grandTotal || 0))}</strong></td><td><span className="status-pill">{order.orderStatus || 'delivered'}</span></td></tr>)}</tbody></table>{orders === null && <EmptyState title="Loading orders…" />}{ordersError && <EmptyState title={ordersError} />}{orders !== null && !ordersError && visibleOrders.length === 0 && <EmptyState title="No online orders match these filters" />}</div></section>}

      </div>
    </section>

    {customerModalOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCustomerModalOpen(false) }}><section aria-labelledby="customer-modal-title" aria-modal="true" className="customer-modal" role="dialog"><div className="modal-heading"><div><p className="eyebrow">CUSTOMER RECORD</p><h2 id="customer-modal-title">Add customer</h2></div><button aria-label="Close add customer" className="icon-button" onClick={() => { setCustomerModalOpen(false); setCustomerError('') }}><X size={19} /></button></div><form onSubmit={saveCustomer}><label className="form-field">Full name<input autoFocus value={customerForm.name} onChange={(event) => setCustomerForm({ ...customerForm, name: event.target.value })} placeholder="Customer name" /></label><label className="form-field">Contact number<input inputMode="tel" value={customerForm.phone} onChange={(event) => setCustomerForm({ ...customerForm, phone: event.target.value })} placeholder="03xx xxxxxxx" /></label><label className="form-field">Delivery address<textarea rows={3} value={customerForm.address} onChange={(event) => setCustomerForm({ ...customerForm, address: event.target.value })} placeholder="House, street, area, city" /></label>{customerError && <p className="inline-error" role="alert">{customerError}</p>}<div className="modal-actions"><button className="secondary-button" onClick={() => setCustomerModalOpen(false)} type="button">Cancel</button><button className="primary-button" type="submit"><Check size={17} /> Save customer</button></div></form></section></div>}
  </main>
}

function ProductGrid({ products, loading, error, addProduct }: { products: Product[]; loading: boolean; error: string; addProduct: (product: Product) => void }) {
  if (loading) return <EmptyState title="Loading live menuâ€¦" />
  if (error) return <EmptyState title={error} />
  if (products.length === 0) return <EmptyState title="No menu items match this filter" />
  return <div className="product-grid">{products.map((product) => <button className="product-card" key={product.id} onClick={() => addProduct(product)}><div className="product-photo"><img alt={product.name} loading="lazy" src={product.image || FALLBACK_IMAGE} /><span className="add-product"><Plus size={17} /></span></div><div className="product-info"><span className="product-category">{product.category}</span><strong>{product.name}</strong><span className="product-price">{money(product.price)}</span></div></button>)}</div>
}

function SectionHeading({ eyebrow, title, count, action }: { eyebrow: string; title: string; count?: number; action?: ReactNode }) {
  return <div className="section-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}{count !== undefined && <span>{count}</span>}</h2></div>{action}</div>
}

function EmptyState({ title, action }: { title: string; action?: ReactNode }) {
  return <div className="empty-state"><span>{title}</span>{action}</div>
}
