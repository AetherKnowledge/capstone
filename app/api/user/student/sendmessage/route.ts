import authOptions from "@/lib/auth/authOptions";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message } = await request.json();

  if (!message) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const n8nWebhookUrl = process.env.N8N_URL!;
  const response = await fetch(n8nWebhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: session.user.id,
      message,
    }),
  });

  const data = await response.json();

  return NextResponse.json(data, { status: response.status });
}
