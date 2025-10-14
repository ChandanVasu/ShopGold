"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input, Button } from "@heroui/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_IS_DEV == "true") {
      console.log("Development mode: Pre-filling login form");
      setEmail("login@example.com");
      setPassword("123456");
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setFormError("");

    // Don't submit if blank fields
    if (!email || !password) return;

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      router.push("/admin");
    } else {
      setFormError(data.error || "Invalid email or password");
    }
  };

  const emailInvalid = submitted && !email;
  const passwordInvalid = submitted && !password;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-sm bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl shadow-gray-200/50 p-8 border border-gray-200/50">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-light text-gray-900 mb-2">Welcome back</h1>
          <p className="text-sm text-gray-500 font-light">Sign in to your account</p>
        </div>

        <form className="space-y-6" onSubmit={handleLogin}>
          <div className="space-y-10">
            <Input
              type="email"
              label="Email address"
              labelPlacement="outside"
              variant="bordered"
              classNames={{
                inputWrapper: "border-gray-200 hover:border-gray-300 focus-within:border-gray-900 bg-white/50 backdrop-blur-sm",
                input: "text-gray-900 placeholder:text-gray-400",
                label: "text-gray-700 font-light text-sm",
              }}
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              isInvalid={emailInvalid}
              errorMessage={emailInvalid ? "Email is required" : ""}
            />

            <Input
              type="password"
              label="Password"
              labelPlacement="outside"
              variant="bordered"
              classNames={{
                inputWrapper: "border-gray-200 hover:border-gray-300 focus-within:border-gray-900 bg-white/50 backdrop-blur-sm",
                input: "text-gray-900 placeholder:text-gray-400",
                label: "text-gray-700 font-light text-sm",
              }}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              isInvalid={passwordInvalid}
              errorMessage={passwordInvalid ? "Password is required" : ""}
            />
          </div>

          {formError && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">{formError}</div>}

          <Button
            type="submit"
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-light py-6 rounded-xl transition-all duration-200 shadow-lg shadow-gray-900/25"
            size="lg"
          >
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
