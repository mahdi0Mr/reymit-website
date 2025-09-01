import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.isAdmin) {
    redirect('/'); // اگر ادمین نبود، به صفحه اصلی برود
  }

  return (
    <div>
      {/* اینجا می‌توانید یک منوی مخصوص ادمین قرار دهید */}
      <main>{children}</main>
    </div>
  );
}