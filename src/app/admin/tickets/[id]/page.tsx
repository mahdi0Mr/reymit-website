import prisma from '@/lib/prisma';
import ReplyForm from '../../../components/ReplyForm'; // کامپوننت فرم پاسخ

async function getTicketDetails(id: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      replies: {
        orderBy: {
          createdAt: 'asc', // پاسخ‌ها به ترتیب زمانی باشند
        },
      },
    },
  });
  return ticket;
}

export default async function ViewTicketPage({ params }: { params: { id: string } }) {
  const ticket = await getTicketDetails(params.id);

  if (!ticket) {
    return <div className="text-center py-20">تیکت مورد نظر یافت نشد.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#2a2a40] p-8 rounded-lg border border-gray-700 mb-8">
          <h1 className="text-3xl font-bold mb-2">{ticket.title}</h1>
          <p className="text-gray-400 mb-4">
            از طرف: {ticket.email} | کد پیگیری: {ticket.trackingId}
          </p>
          <hr className="border-gray-600 my-4" />
          <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap">
            {ticket.content}
          </div>
          <p className="text-xs text-gray-500 mt-4">
            ایجاد شده در: {new Date(ticket.createdAt).toLocaleString('fa-IR')}
          </p>
        </div>

        {/* بخش نمایش پاسخ‌ها */}
        <div className="space-y-6 mb-8">
          <h2 className="text-2xl font-bold">تاریخچه گفتگو</h2>
          {ticket.replies.map((reply) => (
            <div
              key={reply.id}
              className={`p-6 rounded-lg ${
                reply.authorIsAdmin
                  ? 'bg-sky-900/50 border-r-4 border-sky-500'
                  : 'bg-gray-700/50'
              }`}
            >
              <p className="font-bold mb-2 ${reply.authorIsAdmin ? 'text-sky-400' : 'text-gray-300'}">
                {reply.authorIsAdmin ? 'پاسخ پشتیبانی' : 'پاسخ کاربر (در آینده اضافه شود)'}
              </p>
              <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap">
                {reply.content}
              </div>
              <p className="text-xs text-gray-500 mt-4">
                {new Date(reply.createdAt).toLocaleString('fa-IR')}
              </p>
            </div>
          ))}
           {ticket.replies.length === 0 && (
            <p className="text-gray-500">هنوز پاسخی برای این تیکت ثبت نشده است.</p>
           )}
        </div>

        {/* بخش فرم پاسخ */}
        <ReplyForm ticketId={ticket.id} currentStatus={ticket.status} />
      </div>
    </div>
  );
}