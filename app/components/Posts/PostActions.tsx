"use server";

import { UserType } from "@/app/generated/prisma";
import authOptions from "@/lib/auth/authOptions";
import { CommentData, commentSchema, newPostSchema } from "@/lib/schemas";
import { Buckets, getBucket } from "@/lib/supabase/client";
import { authenticateUser, formatDatetime } from "@/lib/utils";
import { prisma } from "@/prisma/client";
import StorageFileApi from "@supabase/storage-js/dist/module/packages/StorageFileApi";
import { fileTypeFromBuffer } from "file-type";
import { getServerSession } from "next-auth";
import path from "path";

export type PostProps = {
  id: string;
  date: string;
  title: string;
  content: string;
  images: string[];
  authorName: string;
  authorImage?: string;
  likesStats: PostStat;
  dislikesStats: PostStat;
  comments: PostComment[];
  isPopup?: boolean;
};

export type PostStat = {
  count: number;
  selected: boolean;
};

export type PostComment = {
  id: string;
  createdAt: string;
  user: {
    name: string;
    image?: string;
  };
  content: string;
};

export async function getPosts(): Promise<PostProps[]> {
  const session = await getServerSession(authOptions);
  if (!session || !authenticateUser(session)) {
    throw new Error("Unauthorized");
  }

  const userId = session?.user?.id;

  const posts = await prisma.post.findMany({
    include: {
      author: {
        select: {
          name: true,
          image: true,
        },
      },
      likes: {
        select: {
          userId: true,
        },
      },
      dislikes: {
        select: {
          userId: true,
        },
      },
      comments: {
        select: {
          id: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              image: true,
            },
          },
          content: true,
        },
      },
    },
  });

  return posts.map((post) => ({
    id: post.id.toString(),
    date: formatDatetime(post.createdAt),
    title: post.title,
    content: post.content || "",
    images: post.images || [],
    authorName: post.author.name || "",
    authorImage: post.author.image || undefined,
    likesStats: {
      count: post.likes.length || 0,
      selected: post.likes.some((like) => like.userId === userId),
    },
    dislikesStats: {
      count: post.dislikes.length || 0,
      selected: post.dislikes.some((dislike) => dislike.userId === userId),
    },
    comments: post.comments.map((comment) => ({
      id: comment.id.toString(),
      createdAt: comment.createdAt.toISOString() || new Date().toISOString(),
      user: {
        name: comment.user.name || "",
        image: comment.user.image || undefined,
      },
      content: comment.content || "",
    })),
  }));
}

export async function createPost(formData: FormData): Promise<void> {
  const session = await getServerSession(authOptions);
  const bucket = await getBucket(
    Buckets.Posts,
    session?.supabaseAccessToken || ""
  );

  if (
    !session ||
    !authenticateUser(session, UserType.Admin) ||
    !session.user?.id
  ) {
    throw new Error("Unauthorized");
  }

  if (!(formData instanceof FormData)) {
    throw new Error("Invalid request");
  }

  const validation = newPostSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    images: formData.getAll("images") as File[],
  });

  if (!validation.success) {
    console.log("Validation errors:", validation.error);
    throw new Error("Invalid request");
  }

  const { title, content, images } = validation.data;

  const post = await prisma.post.create({
    data: {
      title,
      content,
      authorId: session.user.id,
    },
  });

  const postId = post.id;
  const imageUrls: string[] = [];
  try {
    if (images && images.length > 0) {
      await Promise.all(
        images.map(async (file) => {
          if (
            !file ||
            !(file instanceof File) ||
            file.size === 0 ||
            !session.user.id
          )
            return;

          const url = await createFile(file, postId, bucket, session.user.id);
          imageUrls.push(url);
        })
      );
    }
  } catch (error) {
    console.error("Error uploading images:", error);
    await prisma.post.delete({
      where: { id: postId },
    });
    return;
  }

  await prisma.post.update({
    where: { id: postId },
    data: {
      images: imageUrls,
    },
  });
}

export async function createFile(
  file: File,
  postId: number,
  bucket: StorageFileApi,
  userId: string
): Promise<string> {
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

  const ext = type?.ext || "bin";
  const filename = crypto.randomUUID();
  const pathSafe = path.posix.join(userId, `${postId}`, `${filename}.${ext}`);

  const { error } = await bucket.upload(pathSafe, buffer, {
    contentType: type.mime,
    upsert: false,
  });

  if (error) {
    console.error("Error uploading file:", error);
    throw new Error("Failed to upload file");
  }

  const url = bucket.getPublicUrl(pathSafe);
  console.log("Uploaded file URL:", url);

  return url.data.publicUrl;
}

// export async function getPostImage(
//   postId: string,
//   imageId: string
// ): Promise<string> {
//   const session = await getServerSession(authOptions);
//   if (!session || !authenticateUser(session)) {
//     throw new Error("Unauthorized");
//   }

//   if (!postId || typeof postId !== "string" || postId.trim() === "") {
//     throw new Error("Invalid Post ID");
//   }

//   if (!imageId || typeof imageId !== "string" || imageId.trim() === "") {
//     throw new Error("Invalid Image ID");
//   }

//   const post = await prisma.post.findUnique({
//     where: { id: parseInt(postId) },
//     select: {
//       images: true,
//     },
//   });

//   if (!post) throw new Error("Post not found");

//   const imageUrl = post.images.find((img) => img.includes(imageId));
//   if (!imageUrl) throw new Error("Image not found in post");

//   return imageUrl;
// }

export async function likePost(postId: string, like: boolean) {
  const session = await getServerSession(authOptions);
  if (!session || !authenticateUser(session) || !session.user?.id) {
    throw new Error("Unauthorized");
  }

  if (typeof postId !== "string" || typeof like !== "boolean") {
    throw new Error("Invalid request");
  }

  const post = await prisma.post.findUnique({
    where: { id: parseInt(postId) },
    include: {
      likes: { where: { userId: session.user.id } },
      dislikes: { where: { userId: session.user.id } },
    },
  });

  if (!post) throw new Error("Post not found");

  const alreadyLiked = post.likes.length > 0;
  if (like && alreadyLiked) return; // Already liked, do nothing
  if (!like && !alreadyLiked) return; // Not liked, do nothing

  const alreadyDisliked = post.dislikes.length > 0;

  if (alreadyLiked) {
    await prisma.like.deleteMany({
      where: { postId: parseInt(postId), userId: session.user.id },
    });
  } else {
    if (alreadyDisliked) {
      await prisma.dislike.deleteMany({
        where: { postId: parseInt(postId), userId: session.user.id },
      });
    }
    await prisma.like.create({
      data: { postId: parseInt(postId), userId: session.user.id },
    });
  }
}

export async function dislikePost(postId: string, dislike: boolean) {
  const session = await getServerSession(authOptions);
  if (!session || !authenticateUser(session) || !session.user?.id) {
    throw new Error("Unauthorized");
  }

  if (typeof postId !== "string" || typeof dislike !== "boolean") {
    throw new Error("Invalid request");
  }

  const post = await prisma.post.findUnique({
    where: { id: parseInt(postId) },
    include: {
      likes: { where: { userId: session.user.id } },
      dislikes: { where: { userId: session.user.id } },
    },
  });

  if (!post) throw new Error("Post not found");

  const alreadyDisliked = post.dislikes.length > 0;
  if (dislike && alreadyDisliked) return; // Already disliked, do nothing
  if (!dislike && !alreadyDisliked) return; // Not disliked, do nothing

  const alreadyLiked = post.likes.length > 0;

  if (alreadyDisliked) {
    await prisma.dislike.deleteMany({
      where: { postId: parseInt(postId), userId: session.user.id },
    });
  } else {
    if (alreadyLiked) {
      await prisma.like.deleteMany({
        where: { postId: parseInt(postId), userId: session.user.id },
      });
    }
    await prisma.dislike.create({
      data: { postId: parseInt(postId), userId: session.user.id },
    });
  }
}

export async function addComment(data: CommentData): Promise<void> {
  const session = await getServerSession(authOptions);
  if (!session || !authenticateUser(session) || !session.user?.id) {
    throw new Error("Unauthorized");
  }

  console.log("Adding comment:", data);
  const parsed = commentSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Invalid request");
  }

  const { postId, content } = parsed.data as CommentData;

  if (!content.trim()) throw new Error("Comment content cannot be empty");

  await prisma.comment.create({
    data: {
      postId: parseInt(postId),
      userId: session.user.id,
      content,
    },
  });
}
