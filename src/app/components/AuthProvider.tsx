"use client";
import { SessionProvider } from "next-auth/react";

// مطمئن شوید که "export default" وجود دارد
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}