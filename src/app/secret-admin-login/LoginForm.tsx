"use client";

import { useActionState } from 'react';
import { authenticateAdmin } from '../actions/adminActions';
import { useFormStatus } from 'react-dom';

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
  const [errorMessage, dispatch] = useActionState(authenticateAdmin, undefined);

  return (
    <form action={dispatch} className="bg-[#2a2a40] p-8 rounded-lg border border-gray-700 space-y-4">
      {errorMessage && (
        <p className="text-red-400 text-center">{errorMessage}</p>
      )}
      <div>
        <label htmlFor="username" className="block mb-1 font-bold">نام کاربری</label>
        <input 
          type="text" 
          name="username"
          id="username" 
          className="w-full bg-[#1e1e2e] border border-gray-600 rounded-md p-2 mt-1" 
          required
          autoComplete="username"
        />
      </div>
      <div>
        <label htmlFor="password" className="block mb-1 font-bold">رمز عبور</label>
        <input 
          type="password" 
          name="password"
          id="password" 
          className="w-full bg-[#1e1e2e] border border-gray-600 rounded-md p-2 mt-1" 
          required
          autoComplete="current-password"
        />
      </div>
      <LoginButton />
    </form>
  );
}