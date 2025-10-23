// app/providers.tsx
"use client";

import { HeroUIProvider } from "@heroui/react";
import { CartProvider, useCartDrawer } from "@/hooks/useCart";
import CartDrawer from "@/components/CartDrawer";

function CartDrawerWrapper() {
  const { cartDrawerOpen, setCartDrawerOpen } = useCartDrawer();
  
  return (
    <CartDrawer 
      isOpen={cartDrawerOpen} 
      onClose={() => setCartDrawerOpen(false)} 
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <CartProvider>
        {children}
        <CartDrawerWrapper />
      </CartProvider>
    </HeroUIProvider>
  );
}
