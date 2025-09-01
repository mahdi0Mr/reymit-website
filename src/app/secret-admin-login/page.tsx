// src/app/secret-admin-login/page.tsx
import LoginForm from './LoginForm';

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">ورود به پنل مدیریت</h1>
        <LoginForm />
      </div>
    </div>
  );
}