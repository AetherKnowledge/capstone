"use client";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";

const LoginButton = () => {
  const { status, data: session } = useSession();
  const router = useRouter();

  const handleClick = () => {
    if (status === "unauthenticated") {
      signIn();
    } else if (status === "authenticated") {
      router.push("/user/dashboard");
    }
  };

  if (status === "loading") {
    return (
      <button className="flex items-center justify-center btn btn-primary gap-3 min-w-50 mx-auto lg:mx-0 py-[clamp(1.25rem,2vw,2.5rem)]">
        <div className="loading loading-spinner loading-md text-white"></div>
      </button>
    );
  }

  return (
    <button
      className="flex items-center justify-center btn btn-primary gap-3 min-w-50 mx-auto lg:mx-0 py-[clamp(1.25rem,2vw,2.5rem)]"
      onClick={handleClick}
    >
      {status === "unauthenticated" && (
        <div className="bg-white rounded-full w-[clamp(1.25rem,2vw,2.5rem)] h-[clamp(1.25rem,2vw,2.5rem)] flex items-center justify-center">
          <FcGoogle className="w-[clamp(1.25rem,2vw,2.5rem)] h-[clamp(1.25rem,2vw,2.5rem)]" />
        </div>
      )}
      <p className="text-step-1 font-medium">
        {status === "unauthenticated" ? "Register Now" : "Go To Dashboard"}
      </p>
    </button>
  );
};

export default LoginButton;
