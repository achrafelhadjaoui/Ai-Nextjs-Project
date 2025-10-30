// "use client";
// import { useEffect, useState } from "react";

// export default function VerifiedSuccessPage({ searchParams }: { searchParams: { token: string } }) {
//   const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);

//   useEffect(() => {
//     if (!searchParams.token) return;

//     const verifyEmail = async () => {
//       try {
//         const res = await fetch(`/api/auth/verify?token=${searchParams.token}`);
//         const data = await res.json();
//         setStatus(data);
//       } catch (err) {
//         setStatus({ success: false, message: "Something went wrong, please try again." });
//       }
//     };

//     verifyEmail();
//   }, []);

//   if (!status) return <p>Verifying your email...</p>;

//   return (
//     <div className="flex items-center justify-center min-h-screen bg-black text-white">
//       <div className="text-center">
//         <h1 className="text-3xl font-bold mb-4">
//           {status.success ? "✅ Success!" : "❌ Verification Failed"}
//         </h1>
//         <p>{status.message}</p>
//       </div>
//     </div>
//   );
// }






"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifiedSuccessPage({ searchParams }: { searchParams: { token: string } }) {
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!searchParams.token) return;

    const verifyEmail = async () => {
      try {
        const res = await fetch(`/api/auth/verify?token=${searchParams.token}`);
        const data = await res.json();
        setStatus(data);

        // ✅ If success, auto redirect to login after 3 seconds
        if (data.success) {
          setTimeout(() => router.push("/auth/login"), 5000);
        }
      } catch (err) {
        setStatus({ success: false, message: "Something went wrong, please try again." });
      }
    };

    verifyEmail();
  }, [searchParams.token, router]);

  if (!status) return <p className="text-center mt-20">Verifying your email...</p>;

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">
          {status.success ? "✅ Success!" : "❌ Verification Failed"}
        </h1>
        <p className="mb-6">{status.message}</p>

        {status.success ? (
          <>
            <p>Redirecting to login ...</p>
            <button
              className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded"
              onClick={() => router.push("/auth/login")}
            >
              Go to Login Now
            </button>
          </>
        ) : (
          <button
            className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 rounded"
            onClick={() => router.push("/auth/login")}
          >
            Go to Login
          </button>
        )}
      </div>
    </div>
  );
}
