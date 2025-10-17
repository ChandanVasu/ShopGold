"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input, Button } from "@heroui/react";

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [formError, setFormError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_IS_DEV == "true") {
      console.log("Development mode: Pre-filling login form");
      setPin("123456");
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setFormError("");

    // Don't submit if blank PIN
    if (!pin) return;

    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/admin");
      } else {
        setFormError(data.error || "Invalid PIN");
      }
    } catch (error) {
      setFormError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const pinInvalid = submitted && !pin;

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden px-4">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-gray-50">
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Animated Glow Effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary glow - blue */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/15 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: '4s' }} />
        
        {/* Secondary glow - purple */}
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-400/12 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: '6s', animationDelay: '2s' }} />
        
        {/* Tertiary glow - cyan */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-cyan-300/10 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: '8s', animationDelay: '4s' }} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl  border border-gray-200/50 p-8 relative overflow-hidden">
          {/* Card inner glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-gray-50/20 rounded-3xl" />
          
          <div className="relative z-10">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100/80 to-purple-100/80 rounded-2xl mb-6 backdrop-blur-sm border border-gray-200/30">
                <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-3xl font-light mb-3 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Welcome back
              </h1>
              <p className="text-gray-600 font-light">Enter your PIN to access admin panel</p>
            </div>

            <form className="space-y-6" onSubmit={handleLogin}>
              <div className="space-y-10">
                <div className="relative">
                  <Input
                    type="password"
                    label="PIN"
                    labelPlacement="outside"
                    variant="bordered"
                    classNames={{
                      inputWrapper: "border-gray-300/60 hover:border-gray-400/70 focus-within:border-blue-500/60 bg-white/60 backdrop-blur-sm transition-all duration-300",
                      input: "text-gray-800 placeholder:text-gray-500 text-center text-2xl tracking-widest",
                      label: "text-gray-700 font-light text-sm mb-2",
                    }}
                    placeholder="Enter your PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    isInvalid={pinInvalid}
                    errorMessage={pinInvalid ? "PIN is required" : ""}
                    maxLength={6}
                  />
                </div>
              </div>

              {formError && (
                <div className="text-red-600 text-sm bg-red-50/80 border border-red-200/50 p-4 rounded-xl backdrop-blur-sm">
                  {formError}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-7 rounded-2xl transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                size="lg"
                disabled={loading}
              >
                <span className="flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </>
                  )}
                </span>
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-gray-500 text-sm">
                Secure login powered by advanced encryption
              </p>
              
              {/* Development Mode Credentials Display */}
              {process.env.NEXT_PUBLIC_IS_DEV === "true" && (
                <div className="mt-4 p-4 bg-yellow-50/80 border border-yellow-200/50 rounded-xl backdrop-blur-sm">
                  <p className="text-yellow-800 text-xs font-medium mb-2">Demo PIN</p>
                  <div className="text-xs text-yellow-700 space-y-1">
                    <p><span className="font-medium">PIN:</span> {pin || "123456"}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
