// lib/supabaseClient.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient(supabaseAccessToken: string) {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${supabaseAccessToken}`,
        },
      },
    }
  );
}

// export async function isUserLoggedIn() {
//   const supabase = createClient();
//   const { data: session } = await supabase.auth.getSession();
//   return !(!session.session || session.session.user.role !== "authenticated");
// }

// export const signInWithGoogle = async () => {
//   const { data, error } = await supabase.auth.signInWithOAuth({
//     provider: "google",
//   });
//   if (error) console.error(error);
//   return data;
// };

export enum Buckets {
  Capstone = "capstone",
  Posts = "posts",
}

export function getBucket(bucketName: Buckets, supabaseAccessToken: string) {
  return createClient(supabaseAccessToken).storage.from(bucketName);
}
