export default async function orderCreate({ products, paymentDetails, billingDetails, status = "success", extraData = {} }) {
  try {
    // Check if there's a pending order to update
    const pendingOrderId = localStorage.getItem("pendingOrderId");
    
    if (pendingOrderId) {
      // Update existing pending order with payment details
      const updatePayload = {
        _id: pendingOrderId,
        paymentDetails: {
          paymentMethod: paymentDetails.paymentMethod,
          total: paymentDetails.total,
          status: paymentDetails.status,
          paymentStatus: paymentDetails.status === "paid" ? "success" : "failed",
          paymentIntentId: paymentDetails.paymentIntentId || null,
          ...paymentDetails.extra, // support gateway-specific fields
        },
        status: paymentDetails.status === "paid" ? "success" : "failed",
        ...extraData,
      };

      const res = await fetch("/api/order", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      });

      if (res.ok) {
        // Clear pending order ID
        localStorage.removeItem("pendingOrderId");
        return pendingOrderId;
      } else {
        throw new Error("Failed to update pending order");
      }
    } else {
      // Fallback: Create new order if no pending order exists
      const payload = {
        name: billingDetails?.customer?.fullName,
        email: billingDetails?.customer?.email,
        shipping: {
          address: billingDetails?.address,
          name: billingDetails?.customer?.fullName,
          phone: billingDetails?.customer?.phone,
        },
        products: {
          items: products.map((item) => ({
            productId: item._id,
            title: item.title,
            quantity: item.quantity,
            price: item.salePrice || item.regularPrice,
            sellingPrice: item.salePrice || item.regularPrice,
            regularPrice: item.regularPrice,
            images: item.images,
            variants: item.variants || [],
          })),
        },
        paymentDetails: {
          paymentMethod: paymentDetails.paymentMethod,
          total: paymentDetails.total,
          status: paymentDetails.status,
          paymentStatus: paymentDetails.status === "paid" ? "success" : "failed",
          paymentIntentId: paymentDetails.paymentIntentId || null,
          ...paymentDetails.extra, // support gateway-specific fields
        },
        status: paymentDetails.status === "paid" ? "success" : "failed",
        ...extraData, // optional metadata (storeId, userId, etc.)
      };

      const res = await fetch("/api/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create order");

      const data = await res.json();
      return data?._id || null;
    }
  } catch (error) {
    console.error("Order creation error:", error.message || error);
    return null;
  }
}
