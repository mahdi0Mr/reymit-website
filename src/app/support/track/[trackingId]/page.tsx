import prisma from "@/lib/prisma";
import Link from 'next/link';
import { ArrowRight, Clock, CheckCircle, XCircle } from 'lucide-react';
import ClientReplyForm from './ClientReplyForm'; // اطمینان از ایمپورت صحیح
import Image from 'next/image';

// تابعی برای دریافت آیکون و رنگ بر اساس وضعیت تیکت
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'OPEN':
      return { icon: <Clock size={18} />, text: 'باز', color: 'text-yellow-400' };
    case 'ANSWERED':
      return { icon: <CheckCircle size={18} />, text: 'پاسخ داده شده', color: 'text-green-400' };
    case 'CLOSED':
      return { icon: <XCircle size={18} />, text: 'بسته شده', color: 'text-red-400' };
    default:
      return { icon: null, text: status, color: 'text-gray-400' };
  }
};

// تابع برای دریافت اطلاعات تیکت
async function getTicketByTrackingId(trackingId: string) {
  if (!trackingId) return null;
  return await prisma.ticket.findUnique({
    where: { trackingId },
    include: { 
      replies: {
        orderBy: {
          createdAt: 'asc',
        }
      } 
    },
  });
}

// کامپوننت اصلی صفحه
export default async function TrackTicketPage({ params }: { params: { trackingId: string } }) {
  const trackingId = params.trackingId;
  const ticket = await getTicketByTrackingId(trackingId);

  if (!ticket) {
    return (
        <div className="container mx-auto px-4 py-12 text-center">
            <div className="max-w-md mx-auto bg-[#2a2a40] p-8 rounded-lg border border-gray-700">
                <h1 className="text-2xl mb-4 font-bold text-red-400">تیکت یافت نشد</h1>
                <p className="text-gray-400 mb-6">تیکتی با این کد پیگیری یافت نشد. لطفا کد را بررسی کرده و دوباره تلاش کنید.</p>
                <Link href="/" className="inline-block bg-sky-600 text-white py-2 px-4 rounded-md hover:bg-sky-700 transition">
                    بازگشت به صفحه اصلی
                </Link>
            </div>
        </div>
    );
  }

  const badge = getStatusBadge(ticket.status);

  // ساخت آرایه پیام‌ها با در نظر گرفتن imageUrl
  const messages = [
    { 
      type: 'user', 
      content: ticket.content, 
      createdAt: ticket.createdAt, 
      imageUrl: ticket.imageUrl,
      id: 'initial' 
    },
    ...ticket.replies.map(r => ({ 
      type: r.authorIsAdmin ? 'admin' : 'user', 
      content: r.content, 
      createdAt: r.createdAt, 
      imageUrl: r.imageUrl,
      id: r.id 
    }))
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-sky-400">پیگیری تیکت</h1>
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition">
            <ArrowRight size={18} />
            <span>بازگشت</span>
          </Link>
        </div>

        <div className="bg-[#2a2a40] p-8 rounded-lg border border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
            <h2 className="text-2xl font-bold">{ticket.title}</h2>
            <div className={`flex items-center gap-2 font-semibold p-2 rounded-md bg-gray-900/50 ${badge.color}`}>
              {badge.icon}
              <span>وضعیت: {badge.text}</span>
            </div>
          </div>
          
          <p className="text-gray-400 text-sm">ایمیل: {ticket.email}</p>
          <p className="text-gray-400 text-sm mb-4">اطلاعات تماس ثبت شده: {ticket.contactInfo}</p>

          <hr className="my-6 border-gray-600" />
          
          <div className="space-y-6">
            <h3 className="text-xl font-bold mb-4">تاریخچه گفتگو</h3>
            
            {messages.map((message) => (
              <div key={message.id} className={`p-4 rounded-lg ${
                message.type === 'admin' 
                ? 'bg-sky-900/50 border-l-4 border-sky-500' 
                : 'bg-[#1e1e2e]'
              }`}>
                <p className={`font-bold mb-2 ${message.type === 'admin' ? 'text-sky-400' : 'text-gray-300'}`}>
                  {message.type === 'admin' ? 'پاسخ پشتیبانی' : 'پیام شما'}
                </p>
                <p className="whitespace-pre-wrap">{message.content}</p>
                
                {message.imageUrl && (
                  <a href={message.imageUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block">
                    <Image 
                      src={message.imageUrl} 
                      alt="پیوست" 
                      width={200} 
                      height={200} 
                      className="rounded-md max-w-full h-auto object-cover" 
                    />
                  </a>
                )}

                <p className="text-xs text-gray-500 mt-2 text-left">
                  ارسال شده در {new Date(message.createdAt).toLocaleString('fa-IR')}
                </p>
              </div>
            ))}
          </div>

          {ticket.status !== 'CLOSED' ? (
            <ClientReplyForm ticketId={ticket.id} trackingId={ticket.trackingId} />
          ) : (
            <div className="mt-8 text-center bg-red-900/50 p-4 rounded-lg border border-red-700">
              <p className="font-bold text-red-400">این تیکت بسته شده است و امکان ارسال پاسخ جدید وجود ندارد.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}