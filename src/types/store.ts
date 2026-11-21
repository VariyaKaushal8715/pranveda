export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export interface ProductReview {
  id: string;
  productId: string;
  authorName: string;
  rating: number;
  title?: string | null;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  subtitle?: string | null;
  description: string;
  ingredients?: string | null;
  benefits?: string | null;
  howToUse?: string | null;
  price: number;
  compareAtPrice?: number | null;
  packSize: string;
  stock: number;
  categoryId: string;
  category: Category;
  concerns: string[];
  images: string[];
  isFeatured: boolean;
  isBestSeller: boolean;
  isActive: boolean;
  reviewCount: number;
  avgRating: number;
  reviews?: ProductReview[];
}

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  packSize: string;
  image: string;
  quantity: number;
  stock: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: "CUSTOMER" | "ADMIN" | string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
}

export interface StoreSettings {
  id: string;
  storeName: string;
  tagline: string;
  whatsappNumber: string;
  supportEmail: string;
  address: string;
  instagramUrl: string;
  upiId?: string;
  upiName?: string;
  upiEnabled?: boolean;
  razorpayKeyId?: string | null;
  razorpayKeySecret?: string | null;
  razorpayEnabled?: boolean;
  freeShippingThreshold: number;
  shippingFee: number;
}

export interface OrderItemData {
  id: string;
  productId?: string | null;
  productName: string;
  productImage?: string | null;
  packSize?: string | null;
  price: number;
  quantity: number;
}

export interface OrderData {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  notes?: string | null;
  subtotal: number;
  discount: number;
  couponCode?: string | null;
  shippingFee: number;
  total: number;
  paymentMethod: "COD" | "RAZORPAY" | string;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | string;
  razorpayPaymentId?: string | null;
  orderStatus: "PLACED" | "PACKED" | "SHIPPED" | "DELIVERED" | "CANCELLED" | string;
  trackingNote?: string | null;
  createdAt: string;
  items: OrderItemData[];
}
