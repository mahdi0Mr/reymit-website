"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TrackTicketForm() {
  const [trackingId, setTrackingId] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingId.trim()) {
      router.push(`/support/track/${trackingId.trim()}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mt-4">
      <input
        type="text"
        value={trackingId}
        onChange={(e) => setTrackingId(e.target.value)}
        placeholder="کد پیگیری خود را وارد کنید..."
        className="flex-grow bg-[#1e1e2e] border border-gray-600 rounded-md p-3 focus:ring-sky-500 focus:border-sky-500"
      />
      <button 
        type="submit" 
        className="bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-700 transition"
      >
        پیگیری
      </button>
    </form>
  );
}