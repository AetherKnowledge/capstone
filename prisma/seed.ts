import { hash } from "bcrypt";
import { config } from "dotenv";
import { Client } from "pg";

config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  await client.connect();

  const hashedPassword = await hash("admin", 10);
  const uuid = "52866741-dc71-4ced-b5ad-993419a730be";
  const now = new Date();

  // Create Admin user
  await client.query(
    `
    INSERT INTO next_auth.users (id, email, name, password)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (email) DO NOTHING
    `,
    [uuid, "admin@admin.com", "Admin", hashedPassword]
  );

  await client.query(
    `
    INSERT INTO public."User" (id, email, name, image, "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (email) DO NOTHING
    `,
    [uuid, "admin@admin.com", "Admin", null, now, now]
  );

  await client.query(
    `
    UPDATE public."User"
    SET "type" = 'Admin'
    WHERE id = $1
    `,
    [uuid]
  );

  // Add to Admin table
  await client.query(
    `
    INSERT INTO public."Admin" ("adminId")
    VALUES ($1)
    ON CONFLICT DO NOTHING
    `,
    [uuid]
  );

  // Create Post
  // await client.query(
  //   `
  //   INSERT INTO "Post" (
  //     title,
  //     content,
  //     "authorId",
  //     images,
  //     "createdAt",
  //     "updatedAt"
  //   ) VALUES (
  //     $1, $2, $3,
  //     ARRAY[$4, $5, $6, $7, $8]::VARCHAR(255)[],
  //     $9, $10
  //   )
  //   ON CONFLICT DO NOTHING
  //   `,
  //   [
  //     "Mental Health Awareness Week",
  //     "Let us celebrate the university week with mental help awareness through our webinar titled 'Healthy Mind, Healthy Soul'. Join Us!",
  //     "1",
  //     "/images/mental1.png",
  //     "/images/mental2.jpg",
  //     "/images/mental3.webp",
  //     "/images/lcupBg.png",
  //     "/images/lcup.png",
  //     now,
  //     now,
  //   ]
  // );

  // === GRANTS & FUNCTIONS ===

  // Grants on schemas
  await client.query(`GRANT USAGE ON SCHEMA next_auth TO service_role;`);
  await client.query(`GRANT ALL ON SCHEMA next_auth TO postgres;`);

  // Grants on users table
  await client.query(`GRANT ALL ON TABLE next_auth.users TO postgres;`);
  await client.query(`GRANT ALL ON TABLE next_auth.users TO service_role;`);

  // Function next_auth.uid()
  await client.query(`
  CREATE OR REPLACE FUNCTION next_auth.uid() RETURNS uuid
      LANGUAGE sql STABLE
      AS $$
    SELECT
      COALESCE(
        NULLIF(current_setting('request.jwt.claim.sub', true), ''),
        (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
      )::uuid
  $$;
`);

  // Grants on sessions
  await client.query(`GRANT ALL ON TABLE next_auth.sessions TO postgres;`);
  await client.query(`GRANT ALL ON TABLE next_auth.sessions TO service_role;`);

  // Grants on accounts
  await client.query(`GRANT ALL ON TABLE next_auth.accounts TO postgres;`);
  await client.query(`GRANT ALL ON TABLE next_auth.accounts TO service_role;`);

  // Grants on verification_tokens
  await client.query(
    `GRANT ALL ON TABLE next_auth.verification_tokens TO postgres;`
  );
  await client.query(
    `GRANT ALL ON TABLE next_auth.verification_tokens TO service_role;`
  );

  // Enable RLS on User
  await client.query(`ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;`);

  // Policies
  await client.query(`
  CREATE POLICY "Can view own user data."
  ON public."User" FOR SELECT
  USING (next_auth.uid() = id);
`);

  await client.query(`
  CREATE POLICY "Can update own user data."
  ON public."User" FOR UPDATE
  USING (next_auth.uid() = id);
`);

  // Trigger function for new users
  await client.query(`
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger AS $$
  BEGIN
    INSERT INTO public."User" (id, name, email, image, "updatedAt")
    VALUES (NEW.id, NEW.name, NEW.email, NEW.image, current_timestamp);
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
`);

  // Drop old trigger if exists
  await client.query(
    `DROP TRIGGER IF EXISTS on_auth_user_created ON next_auth.users;`
  );

  // Create new trigger
  await client.query(`
  CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON next_auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
`);

  console.log(
    "✅ Admin user, grants, RLS, and trigger created (if not already exists)"
  );

  console.log("✅ Admin user and post created (if not already exists)");

  await client.end();
}

main().catch((err) => {
  console.error("❌ Error during seeding:", err);
  client.end();
});
