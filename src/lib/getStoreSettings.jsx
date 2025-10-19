// Utility to fetch store settings on server side
export async function getStoreSettings() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/setting?type=store`, {
      cache: "no-store",
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    return data && Object.keys(data).length > 0 ? data : null;
  } catch (error) {
    console.error("Failed to fetch store settings:", error);
    return null;
  }
}

// Client-side hook for fetching settings
export async function fetchStoreSettings() {
  try {
    const res = await fetch("/api/setting?type=store", {
      cache: "force-cache",
      next: { revalidate: 300 }
    });
    if (!res.ok) return null;
    
    const data = await res.json();
    return data && Object.keys(data).length > 0 ? data : null;
  } catch (error) {
    console.error("Failed to fetch store settings:", error);
    return null;
  }
}
