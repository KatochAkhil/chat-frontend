export type Role = "USER" | "ADMIN";

export interface User {
  _id: string;
  name: string;
  email: string;
  googleId: string;
  picture: string;
  isPremium: boolean;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageType: "text" | "code" | "markdown" | "system" | "ai";
  createdAt: string;
  isAI: boolean;
  isCurrentUser?: boolean;
  status?: "sent" | "read";
}

export interface Payment {
  _id: string;
  userId: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  amount: number;
  currency: string;
  status: "created" | "captured" | "failed";
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface SuggestedReply {
  id: string;
  text: string;
}

export interface ChatSummary {
  text: string;
}

export interface OnlineUser {
  id: string;
  name: string;
  picture: string;
  isPremium: boolean;
}
