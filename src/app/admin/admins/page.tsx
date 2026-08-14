// src/app/admin/admins/page.tsx
import { getAdminsList } from "@/app/actions/adminActions";
import AdminList from "./AdminList";

export const dynamic = "force-dynamic";

export default async function AdminsPage() {
  const admins = await getAdminsList();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">مدیریت ادمین‌ها</h1>
      </div>
      <AdminList admins={admins} />
    </div>
  );
}