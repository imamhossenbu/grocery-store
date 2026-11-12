# FreshBasket Grocery Storefront

A modern, responsive grocery e-commerce storefront built with Next.js (App Router), Tailwind CSS, TypeScript, and Supabase Cloud.

## ✨ Features
- **Cash on Delivery (COD)** checkout flow with delivery slot selection and notes
- **Live Supabase Synchronization**: Real-time product inventory, order placement, and discount coupons
- **Design System**: Farm-fresh organic green palette, custom typography, reusable components
- **Interactive UI**: Category filters, live search, quick view modal, animated cart slide-over, loading skeletons, and empty states
- **Order Tracking**: Real-time order status tracking with order ID

## 🔑 Environment Variables
Copy `.env.example` to `.env.local` and add your keys:
```env
NEXT_PUBLIC_SUPABASE_URL=https://qaqrxudzecgtqcmfjiij.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SECRET_KEY=your_supabase_secret_key
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=gki6moqt
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ecommerce
```

## 🚀 Getting Started
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the storefront.
