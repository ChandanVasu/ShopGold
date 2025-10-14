"use client";

import { useState } from 'react';

export const useCart = () => {
  const [addingToCart, setAddingToCart] = useState({});

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