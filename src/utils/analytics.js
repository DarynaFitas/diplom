function sendEvent(eventName, params) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params)
  } else {
    console.log(`[GA4 mock] ${eventName}`, params)
  }
}

export function trackViewItem(product) {
  sendEvent('view_item', {
    currency: 'UAH',
    value: product.price,
    items: [
      {
        item_id: String(product.id),
        item_name: product.name,
        item_category: product.category,
        price: product.price,
      },
    ],
  })
}

export function trackAddToCart(product) {
  sendEvent('add_to_cart', {
    currency: 'UAH',
    value: product.price,
    items: [
      {
        item_id: String(product.id),
        item_name: product.name,
        item_category: product.category,
        price: product.price,
        quantity: 1,
      },
    ],
  })
}

export function trackPurchase(cartItems) {
  const totalValue = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  sendEvent('purchase', {
    transaction_id: `T-${Date.now()}`,
    currency: 'UAH',
    value: totalValue,
    items: cartItems.map((item) => ({
      item_id: String(item.id),
      item_name: item.name,
      item_category: item.category,
      price: item.price,
      quantity: item.quantity,
    })),
  })
}
