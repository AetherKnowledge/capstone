"use client";
import { Session } from "next-auth";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";

const UserButton = () => {
  const { status, data: session } = useSession();

  if (status === "loading")
    return (
      <div className="loading loading-spinner loading-md text-primary"></div>
    );

  return (
    <div className="flex items-center gap-2 hover:cursor-pointer">
      {status === "unauthenticated" && (
        <button
          className="btn btn-primary w-25 font-semibold duration-150 ease-in-out hover:scale-105"
          onClick={() => signIn(undefined)}
        >
          Login
        </button>
      )}
      {status === "authenticated" && AuthenticatedUserButton(session)}
    </div>
  );
};

const AuthenticatedUserButton = (session: Session) => {
  return (
    <>
      <div className="relative dropdown">
        {session.user?.image ? (
          <Image
            role="button"
            tabIndex={0}
            className="w-10 h-10 rounded-full hover:brightness-90 active:brightness-75 transition object-cover duration-150 ease-in-out hover:scale-105"
            src={session.user.image}
            alt={session.user.name || "User Profile"}
            width={40}
            height={40}
          />
        ) : (
          <div
            role="button"
            tabIndex={0}
            className="duration-150 ease-in-out hover:scale-105 w-10 h-10 rounded-full bg-gray-500 text-white flex items-center justify-center font-bold hover:brightness-90 active:brightness-75 transition select-none cursor-pointer"
          >
            {session.user?.email?.charAt(0).toUpperCase() || "?"}
          </div>
        )}

        <ul className="absolute right-0 mt-2 w-52 menu dropdown-content bg-base-100 text-base-content rounded-md z-10 p-2 shadow-br">
          <li>
            <label>
              <input
                type="checkbox"
                value="lcup-dark"
                className="toggle theme-controller"
              />
              Dark Mode
            </label>
          </li>
          <li>
            <button onClick={() => signOut()}>Sign Out</button>
          </li>
        </ul>
      </div>
    </>
  );
};

export default UserButton;
