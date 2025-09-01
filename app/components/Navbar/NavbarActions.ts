"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const signIn = async () => {
  const supabase = await createClient();
  console.log("Sign in with Google");
  const origin = process.env.NEXT_PUBLIC_BASE_URL;

  console.log("Origin:", origin);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error("Error signing in:", error);
  } else {
    console.log("Sign in successful:", data);
    return redirect(data.url || "/");
  }
};

export const signOut = async () => {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Error signing out:", error);
  } else {
    console.log("Sign out successful");
    redirect("/");
  }
};

// export type UserProfile = Pick<User, "id" | "email" | "name" | "image">;

// export const getUserProfile = async (supabaseUser: supabaseUser) => {
//   if (!supabaseUser) return null;
//   if (!supabaseUser.id) return null;
//   if (supabaseUser.role !== "authenticated") {
//     return null;
//   }

//   const profile = await prisma.user.findUnique({
//     where: {
//       authId: supabaseUser.id,
//     },
//     select: {
//       id: true,
//       email: true,
//       name: true,
//       image: true,
//     },
//   });
//   return profile;
// };

async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Error fetching user:", error.message);
    return null;
  }

  if (user) {
    console.log("Current user:", user);
    return user;
  } else {
    console.log("No user currently logged in.");
    return null;
  }
}
