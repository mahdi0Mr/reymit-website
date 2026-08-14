import fs from 'fs/promises';
import path from 'path';
// آیکون Telegram را اضافه کنید
import { Download, Gem, ShieldCheck, Gamepad2, Palette, MessageCircleMore, Ticket } from 'lucide-react'; 
// کامپوننت فرم پیگیری را وارد کنید
import TrackTicketForm from '@/app/components/TrackTicketForm'; 

// تعریف نوع داده‌ها برای TypeScript
interface VersionInfo {
  latest_version: string;
  release_date: string;
  download_url: string;
  changelog: string[];
}

// تابع برای خواندن اطلاعات از فایل JSON
async function getVersionData(): Promise<VersionInfo> {
  const filePath = path.join(process.cwd(), 'public', 'version.json');
  const fileContent = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(fileContent);
}

// کامپوننت اصلی صفحه
export default async function HomePage() {
  const versionData = await getVersionData();

  const features = [
    { icon: <Gem size={28} className="text-pink-400" />, title: "پشتیبانی از دو پلتفرم", description: "اتصال مستقیم به API پلتفرم‌های محبوب ریمیت و دونیتو." },
    { icon: <ShieldCheck size={28} className="text-green-400" />, title: "قوانین شرطی قدرتمند", description: "بر اساس مبلغ دونیت، کلیدهای مختلف با تکرار دلخواه ارسال کنید." },
    { icon: <Gamepad2 size={28} className="text-sky-400" />, title: "انتخاب پنجره هدف", description: "دستورات فقط به پنجره‌ی بازی یا نرم‌افزار مورد نظر شما ارسال می‌شود." },
    { icon: <Palette size={28} className="text-yellow-400" />, title: "تم‌های متنوع", description: "از بین تم‌های تاریک، روشن و پیش‌فرض سیستم، ظاهر دلخواه خود را انتخاب کنید." },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-[#2a2a40]/50 border-b border-gray-700 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 text-center">
          <h1 className="text-4xl font-bold text-sky-400">کنترلر دونیت</h1>
          <p className="text-gray-400 mt-1">اتوماسیون هوشمند دونیت‌های Reymit و Donito</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 flex-grow">
        {/* Hero Section */}
        <section className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">استریم خود را حرفه‌ای‌تر کنید!</h2>
          <p className="max-w-3xl mx-auto text-lg text-gray-300 mb-8">
            با کنترلر دونیت، به سادگی برای هر مبلغ دونیت، یک دستور کیبورد تعریف کنید تا افکت‌های صوتی، تصویری یا هر دستور دیگری در بازی یا نرم‌افزار استریم شما اجرا شود.
          </p>
          <a
            href={versionData.download_url}
            className="inline-flex items-center gap-2 px-8 py-3 bg-sky-500 text-white font-bold rounded-lg shadow-lg hover:bg-sky-600 transition-transform transform hover:scale-105"
          >
            <Download size={20} />
            دانلود آخرین نسخه (v{versionData.latest_version})
          </a>
        </section>

        {/* Features Section */}
        <section className="py-16">
          <h2 className="text-3xl font-bold text-center mb-10 text-pink-400">قابلیت‌های کلیدی</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-right">
            {features.map((feature, index) => (
              <div key={index} className="bg-[#2a2a40] p-6 rounded-lg border border-gray-700 flex items-start gap-4">
                <div className="flex-shrink-0">{feature.icon}</div>
                <div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {/* [جدید] بخش پشتیبانی و تیکتینگ */}
        <section className="py-16 text-center bg-[#2a2a40] rounded-lg border border-gray-700">
            <h2 className="text-3xl font-bold text-center mb-4 text-yellow-400">پشتیبانی</h2>
            <p className="max-w-2xl mx-auto text-lg text-gray-300 mb-6">
                سوالی دارید یا با مشکلی مواجه شده‌اید؟ تیکت جدید ارسال کنید. اگر قبلا تیکت ارسال کرده‌اید، وضعیت آن را از اینجا پیگیری کنید.
            </p>
            <div className="max-w-lg mx-auto">
                <TrackTicketForm />
            </div>
        </section>

        {/* Update Info & License Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 py-16">
          {/* Update Info */}
          <div className="bg-[#2a2a40] p-6 rounded-lg border border-gray-700">
            <h3 className="text-2xl font-bold mb-4 text-green-400">اطلاعات آخرین نسخه</h3>
            <p className="mb-4"><strong>تاریخ انتشار:</strong> {versionData.release_date}</p>
            <h4 className="font-bold mb-2">تغییرات جدید:</h4>
            <ul className="list-disc list-inside space-y-2 text-gray-300 pr-4">
              {versionData.changelog.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          </div>
          
          {/* License & Support */}
          <div className="bg-[#2a2a40] p-6 rounded-lg border border-gray-700 flex flex-col justify-center items-center text-center">
            <h3 className="text-2xl font-bold mb-4 text-pink-400">خرید و ارسال تیکت</h3>
            <p className="mb-6">
              برای استفاده از تمام قابلیت‌ها لایسنس تهیه کنید و برای دریافت پشتیبانی تیکت ارسال نمایید.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
               {/* <a href="https://wumpus.ir/product/donatron/" target="_blank" className="flex items-center justify-center gap-2 px-6 py-2 bg-pink-500 text-white font-semibold rounded-lg hover:bg-pink-600 transition">
                <Gem size={18} /> خرید لایسنس
              </a> */}
              <a href="https://t.me/+RPHxvGTsumxiNTA0" target="_blank" className="flex items-center justify-center gap-2 px-6 py-2 bg-sky-500 text-white font-semibold rounded-lg hover:bg-sky-600 transition">
                <MessageCircleMore size={18} /> پشتیبانی تلگرام
              </a>
              {/* [تغییر] لینک دیسکورد با لینک ارسال تیکت جایگزین شد */}
              <a href="/support" className="flex items-center justify-center gap-2 px-6 py-2 border border-gray-500 text-gray-300 font-semibold rounded-lg hover:bg-gray-700 transition">
                <Ticket size={18} /> ارسال تیکت جدید
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#181825] border-t border-gray-800">
        <div className="container mx-auto px-4 py-4 text-center text-gray-500">
          <p>&copy; 2024 - MMT_MC. تمامی حقوق محفوظ است.</p>
        </div>
      </footer>
    </div>
  );
}