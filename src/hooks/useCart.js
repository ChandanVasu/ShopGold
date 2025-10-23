"use client";

import { useState, createContext, useContext } from 'react';

// Create cart context for global cart drawer state
const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  return (
    <CartContext.Provider value={{ cartDrawerOpen, setCartDrawerOpen }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCartDrawer = () => {
  const context = useContext(CartContext);
  if (!context) {
    return { cartDrawerOpen: false, setCartDrawerOpen: () => {} };
  }
  return context;
};

export const useCart = () => {
  const [addingToCart, setAddingToCart] = useState({});
  const { setCartDrawerOpen } = useCartDrawer();

  const addToCart = (product, quantity = 1) => {
    return new Promise((resolve) => {
      setAddingToCart((prev) => ({ ...prev, [product._id]: true }));

      setTimeout(() => {
        // Add to cart logic
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        const existingIndex = cart.findIndex((item) => item.productId === product._id);

        if (existingIndex !== -1) {
          cart[existingIndex].quantity += quantity;
        } else {
          cart.push({
            productId: product._id,
            title: product.title,
            quantity: quantity,
            color: null,
            size: null,
            image: product.images?.[0]?.url || product.images?.[0],
            price: product.salePrice || product.regularPrice,
            currency: product.currencySymbol || process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$",
          });
        }

        localStorage.setItem("cart", JSON.stringify(cart));
        setAddingToCart((prev) => ({ ...prev, [product._id]: false }));
        
        // Open cart drawer after adding item
        setCartDrawerOpen(true);
        
        resolve();
      }, 500);
    });
  };

  const isAddingToCart = (productId) => {
    return addingToCart[productId] || false;
  };

  return {
    addToCart,
    isAddingToCart,
    addingToCart
  };
};