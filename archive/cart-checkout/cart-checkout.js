/* ==========================================================================
   ARCHIVED: Shopping Cart & Checkout Engine (Moved in Phase 1A)
   Date: 8 Nov 2026
   Reason: Transitioned to Social Hub (Sales happen via WhatsApp & Instagram DM)
   ========================================================================== */

const CART_STORAGE_KEY = 'hum_cart_items';
const FREE_SHIPPING_THRESHOLD = 2500;
const STANDARD_SHIPPING_FEE = 200;
const OWNER_WHATSAPP = '923071771829';

export function getCart() {
  try {
    const data = localStorage.getItem(CART_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveCart(cart, updateCartUI) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    if (updateCartUI) updateCartUI();
  } catch (e) {}
}

export function addToCart(item) {
  const cart = getCart();
  const existingIndex = cart.findIndex(c => c.id === item.id && c.variant === item.variant);
  if (existingIndex > -1) {
    cart[existingIndex].qty += (item.qty || 1);
  } else {
    cart.push({
      id: item.id,
      title: item.title,
      variant: item.variant || 'Standard',
      price: Number(item.price),
      image: item.image,
      qty: item.qty || 1
    });
  }
  saveCart(cart);
}

export function updateItemQty(index, delta) {
  const cart = getCart();
  if (cart[index]) {
    cart[index].qty += delta;
    if (cart[index].qty <= 0) {
      cart.splice(index, 1);
    }
    saveCart(cart);
  }
}

export function removeCartItem(index) {
  const cart = getCart();
  if (cart[index]) {
    cart.splice(index, 1);
    saveCart(cart);
  }
}
