// src/lib/dates.ts
// ابزارهای تاریخ شمسی — صرفاً توابع خالص (ایمن برای کلاینت)
// تبدیل میلادی → جلالی با الگوریتم قطعی + ارقام فارسی

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toPersianDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

// الگوریتم تبدیل میلادی به جلالی (بر اساس جدول گاهشمار)
function g2j(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  gy -= 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  jy += Math.floor((days - 1) / 365);
  if (days > 365) days = (days - 1) % 365;
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return [jy, jm, jd];
}

const MONTH_NAMES = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

// تاریخ شمسی به صورت اعداد فارسی: ۱۴۰۴/۰۵/۲۳
export function toShamsiDate(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  const [jy, jm, jd] = g2j(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return `${toPersianDigits(jy)}/${toPersianDigits(String(jm).padStart(2, "0"))}/${toPersianDigits(String(jd).padStart(2, "0"))}`;
}

// تاریخ + ساعت شمسی با ارقام فارسی: ۱۴۰۴/۰۵/۲۳ ۱۴:۳۰
export function toShamsiDateTime(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  const time = `${toPersianDigits(String(d.getHours()).padStart(2, "0"))}:${toPersianDigits(String(d.getMinutes()).padStart(2, "0"))}`;
  return `${toShamsiDate(d)} ساعت ${time}`;
}

// نام ماه و روز شمسی: ۲۳ مرداد ۱۴۰۴
export function toShamsiLong(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  const [jy, jm, jd] = g2j(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return `${toPersianDigits(jd)} ${MONTH_NAMES[jm - 1]} ${toPersianDigits(jy)}`;
}
