import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">AllVideo</h1>
          <p className="text-gray-400 mt-2">Video hosting made simple</p>
        </div>
        {children}
      </div>
    </div>
  );
}
