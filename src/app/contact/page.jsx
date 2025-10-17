"use client";

import { useState } from "react";
import { Input, Textarea, Button } from "@heroui/react";
import { Send } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      setStatus("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collection: "contact-submissions",
          ...formData,
          submittedAt: new Date().toISOString(),
          status: "unread",
        }),
      });

      if (res.ok) {
        setStatus("✓ Thank you! We'll get back to you soon.");
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
        });
      } else {
        setStatus("✗ Failed to send. Please try again.");
      }
    } catch (error) {
      setStatus("✗ An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 md:px-20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Get In Touch
          </h1>
          <p className="text-gray-600">
            Have a question? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        {/* Contact Form */}
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Input
                  label="Name *"
                  name="name"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={handleChange}
                  labelPlacement="outside"
                  required
                />
                <Input
                  label="Email *"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  labelPlacement="outside"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Input
                  label="Phone"
                  name="phone"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={handleChange}
                  labelPlacement="outside"
                />
                <Input
                  label="Subject"
                  name="subject"
                  placeholder="How can we help?"
                  value={formData.subject}
                  onChange={handleChange}
                  labelPlacement="outside"
                />
              </div>

              <div className="mb-6">
                <Textarea
                  label="Message *"
                  name="message"
                  placeholder="Tell us more about your inquiry..."
                  value={formData.message}
                  onChange={handleChange}
                  labelPlacement="outside"
                  minRows={6}
                  required
                />
              </div>

              <Button
                type="submit"
                size="lg"
                isLoading={loading}
                className="w-full bg-gray-900 text-white font-medium"
                startContent={!loading && <Send className="w-4 h-4" />}
              >
                {loading ? "Sending..." : "Send Message"}
              </Button>

              {status && (
                <p
                  className={`mt-4 text-sm text-center ${
                    status.includes("✓") ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {status}
                </p>
              )}
          </form>
        </div>
      </div>
    </div>
  );
}
