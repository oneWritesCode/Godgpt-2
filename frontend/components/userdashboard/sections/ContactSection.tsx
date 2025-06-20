import React, { useState } from "react";

function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // Here you can integrate with an API or email service
    // For now, just log the form
    console.log(form);
  };

  return (
    <div className="w-full dark:bg-[var(--bg)] bg-white flex justify-center items-start">
      <div className="rounded-lg border p-8 w-full max-w-5xl flex flex-col md:flex-row gap-10">
        {/* Contact Form */}
        <div className="flex-1 space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Contact Us</h2>
          <p className="text-gray-600 dark:text-gray-400">Get in touch with our support team.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="name">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[var(--bg)] text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[var(--bg)] text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                placeholder="Your message..."
                value={form.message}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[var(--bg)] text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-60"
              disabled={submitted}
            >
              {submitted ? "Thank you!" : "Send"}
            </button>
          </form>
        </div>

        {/* Info Section */}
        <div className="flex-1 text-sm space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span>📧</span>
              <p className="text-gray-700 dark:text-gray-300">support@bharateducationhub.com</p>
            </div>
            <div className="flex items-center gap-2">
              <span>❓</span>
              <a href="/faq" className="text-blue-600 dark:text-blue-400 hover:underline">
                Check out our FAQ
              </a>
            </div>
            <div className="flex items-center gap-2">
              <span>⏱</span>
              <p className="text-gray-700 dark:text-gray-300">We typically respond within 24 - 48 hours.</p>
            </div>
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          <div className="text-sm text-gray-500 dark:text-gray-400">
            Built with ❤️ by Deepak & Neeraj
          </div>

          <div className="flex flex-col gap-2">
            <a href="https://x.com/we_deep_126" className="text-blue-600 dark:text-blue-400 hover:underline">@we_deep_126</a>
            <a href="https://x.com/Neerajscript" className="text-blue-600 dark:text-blue-400 hover:underline">@Neerajscript </a>
          </div>
        </div>
      </div>

      {/* Buy Me a Coffee Button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <a
          href="#"
          className="inline-flex items-center gap-2 px-5 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded shadow transition-colors text-sm"
        >
          <span role="img" aria-label="coffee">☕</span> Buy me a Coffee
        </a>
      </div>
    </div>
  );
}

export default ContactSection;
