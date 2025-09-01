"use client";

// [تغییر ۱] هوک‌ها را از 'react' وارد کنید
import { useActionState, useOptimistic, useTransition, startTransition } from 'react'; // useFormStatus هم بخشی از react است
import { authenticateAdmin } from '../actions/adminActions';
import { useFormStatus } from 'react-dom'; // useFormStatus همچنان از react-dom وارد می‌شود، تصحیح شد

// یک کامپوننت جدا برای دکمه می‌سازیم تا وضعیت pending را مدیریت کند
function LoginButton() {
  const { pending } = useFormStatus();
  return (
    <button 
      type="submit" 
      className="w-full bg-sky-500 font-bold py-2 rounded-lg hover:bg-sky-600 transition disabled:bg-gray-500"
      disabled={pending}
    >
      {pending ? 'در حال ورود...' : 'ورود'}
    </button>
  );
}

export default function LoginForm() {
  // [تغییر ۲] نام هوک را به useActionState تغییر دهید
  const [errorMessage, dispatch] = useActionState(authenticateAdmin, undefined);

  return (
    <form action={dispatch} className="bg-[#2a2a40] p-8 rounded-lg border border-gray-700 space-y-4">
      {errorMessage && (
        <p className="text-red-400 text-center">{errorMessage}</p>
      )}
      <div>
        <label htmlFor="password">رمز عبور ادمین</label>
        <input 
          type="password" 
          name="password" // name برای FormData ضروری است
          id="password" 
          className="w-full bg-[#1e1e2e] border border-gray-600 rounded-md p-2 mt-1" 
          required
        />
      </div>
      <LoginButton />
    </form>
  );
}