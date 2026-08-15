// src/app/admin/platforms/page.tsx
// مدیریت پلتفرم‌های API: کاتالوگ سراسری + فعال‌سازی اختصاصی هر دستگاه
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { PERMISSIONS } from '@/lib/permissions';
import { requirePermission } from '@/lib/permissions-server';
import PlatformCatalogManager, { CatalogPlatform } from './PlatformCatalogManager';
import MachinePlatformsSection from './MachinePlatformsSection';

export const dynamic = 'force-dynamic';

export default async function AdminPlatformsPage() {
  const permError = await requirePermission(PERMISSIONS.MANAGE_PLATFORMS);
  if (permError) notFound();

  const catalogRaw = await prisma.apiPlatform.findMany({
    orderBy: [{ sortOrder: 'asc' }, { displayName: 'asc' }],
  });
  const machines = await prisma.appStatus.findMany({
    orderBy: { lastSeenAt: 'desc' },
    select: { machineId: true, computerName: true },
  });
  const canEdit = true; // صفحه فقط برای دارندگان دسترسی باز است

  const catalog: CatalogPlatform[] = catalogRaw.map((p) => ({
    id: p.id,
    key: p.key,
    displayName: p.displayName,
    apiUrl: p.apiUrl,
    listPath: p.listPath,
    idField: p.idField,
    nameField: p.nameField,
    amountField: p.amountField,
    amountUnit: p.amountUnit,
    advancedJson: p.advancedJson,
    enabled: p.enabled,
    sortOrder: p.sortOrder,
  }));

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">مدیریت پلتفرم‌های API</h1>
      <p className="text-gray-400 mb-8">
        تعریف الگوهای پلتفرم (درگاه پرداخت/هدیه) و انتخاب نوع استفاده هر دستگاه.
      </p>

      <div className="max-w-6xl mx-auto">
        <PlatformCatalogManager initialCatalog={catalog} canEdit={canEdit} />

        <div className="mt-10">
          <MachinePlatformsSection machines={machines} canEdit={canEdit} />
        </div>
      </div>
    </div>
  );
}
