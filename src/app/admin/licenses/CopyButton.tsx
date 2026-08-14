"use client";

import { useState } from "react";

export default function CopyButton({ licenseKey }: { licenseKey: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(licenseKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // در صورت عدم دسترسی به clipboard، پیام آگاه‌دهنده نشان بده
      alert("کپی ناموفق بود؛ لطفاً دستی کپی کنید.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`text-xs px-2 py-1 rounded transition whitespace-nowrap ${
        copied ? "bg-green-600 text-white" : "bg-gray-600 hover:bg-gray-500"
      }`}
    >
      {copied ? "✓ کپی شد" : "کپی"}
    </button>
  );
}
