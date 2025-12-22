import { Loader2, Zap } from "lucide-react";

export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-[#030306] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-500/25">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-white mb-2">Loading...</h1>
      </div>
    </div>
  );
}
