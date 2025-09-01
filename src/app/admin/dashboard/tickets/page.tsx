// app/dashboard/tickets/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function TicketsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return <div>لطفا برای دسترسی به این بخش وارد شوید.</div>;
  }

  const tickets = await prisma.ticket.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">تیکت‌های من</h1>
        <Link href="/dashboard/tickets/new" className="bg-green-500 text-white px-4 py-2 rounded-lg">
          تیکت جدید
        </Link>
      </div>
      {/* اینجا لیست تیکت‌ها را نمایش دهید */}
    </div>
  );
}