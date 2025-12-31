import { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import Link from "next/link";
import { Zap } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">UnlimVideo</span>
          </Link>
          <p className="text-gray-500">Unlimited bandwidth video hosting</p>
        </div>
        {children}
      </div>
      <Toaster />
    </div>
  );
}
