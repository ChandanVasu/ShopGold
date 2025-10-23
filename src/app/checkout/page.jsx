"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to address page for the new checkout flow
    router.push("/checkout/address");
  }, [router]);

  return (
    <div className="container mx-auto px-4 md:px-20 my-14">
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to checkout...</p>
        </div>
      </div>
    </div>
  );
}
