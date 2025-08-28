import authOptions from "@/lib/auth/authOptions";
import { Buckets, getBucket } from "@/lib/supabase/client";
import { fileTypeFromBuffer } from "file-type";
import { getServerSession } from "next-auth/next";

const Test = async () => {
  async function upload(formData: FormData) {
    "use server";

    const file: File | null = formData.get("file") as unknown as File;
    if (!file || !(file instanceof File) || file.size === 0) {
      throw new Error("No file uploaded");
    }

    // Check MIME type and extension
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      throw new Error("Only image files are allowed");
    }
    if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)) {
      throw new Error("File extension not allowed");
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate actual file type using magic bytes
    const type = await fileTypeFromBuffer(buffer);
    if (!type || !type.mime.startsWith("image/")) {
      throw new Error("Uploaded file is not a valid image");
    }

    // Here you would typically save the buffer to a storage solution
    const ext = type?.ext || "bin";
    const filename = crypto.randomUUID();

    const session = await getServerSession(authOptions);

    console.log("User session:", session);

    if (!session || !session?.supabaseAccessToken) {
      throw new Error("User is not authenticated");
    }

    const path = `${session.user.id}/${filename}.${ext}`;

    const { data, error } = await getBucket(
      Buckets.Posts,
      session?.supabaseAccessToken
    ).upload(path, buffer, {
      contentType: type.mime,
      upsert: false,
    });

    console.log("Upload result:", data, error);
  }

  return (
    <div className="text-base-content">
      <h1>Upload Test</h1>
      <form action={upload}>
        {/* Limit file input to images only */}
        <input
          className="file-input"
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/gif,image/bmp,image/webp"
        />
        <button
          className="btn-primary bg-primary text-white p-2 rounded-2xl"
          type="submit"
        >
          Upload
        </button>
      </form>
      <h2>Images in storage:</h2>
    </div>
  );
};

export default Test;
