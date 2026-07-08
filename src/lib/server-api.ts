import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Message, User } from "@/types";

function getServerApiBaseUrl() {
  return process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
}

async function getCookieHeader() {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
}

export async function getCurrentUser() {
  const cookieHeader = await getCookieHeader();
  try {
    const response = await fetch(`${getServerApiBaseUrl()}/me`, {
      headers: {
        Cookie: cookieHeader
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { user: User };
    return payload.user;
  } catch {
    return null;
  }
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  return user;
}

export async function getRoomMessages(roomId: string) {
  const cookieHeader = await getCookieHeader();
  try {
    const response = await fetch(`${getServerApiBaseUrl()}/messages?roomId=${encodeURIComponent(roomId)}`, {
      headers: {
        Cookie: cookieHeader
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return [] as Message[];
    }

    const payload = (await response.json()) as { messages: Message[] };
    return payload.messages;
  } catch {
    return [] as Message[];
  }
}
