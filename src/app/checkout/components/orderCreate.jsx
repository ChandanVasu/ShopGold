export default async function orderCreate({ products, paymentDetails, billingDetails, status, extraData = {} }) {
  try {
    // Build order payload 
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
        paymentIntentId: paymentDetails.paymentIntentId || null,
        paymentStatus: paymentDetails.paymentStatus || null,
        ...paymentDetails.extra, // support gateway-specific fields
      },
      status,
      ...extraData, // optional metadata (storeId, userId, etc.)
    };

    // 🔹 Send to API
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
  } catch (error) {
    console.error("Order creation error:", error.message || error);
    return null;
  }
}
