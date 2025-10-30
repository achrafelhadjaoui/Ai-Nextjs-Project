export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-6">
        <div className="w-full max-w-md bg-[#111111] border border-gray-800 rounded-xl p-8">
          {children}
        </div>
      </div>
    );
  }
  