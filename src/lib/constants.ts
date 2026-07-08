import { ChatSummary, Message, SuggestedReply, User } from "@/types";

export const demoUser: User = {
  _id: "user-1",
  name: "Aarav Mehta",
  email: "aarav@nexus.ai",
  googleId: "google-1",
  picture: "https://i.pravatar.cc/80?img=32",
  isPremium: true,
  role: "USER",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const demoMessages: Message[] = [
  
];

export const demoSuggestedReplies: SuggestedReply[] = [];

export const demoSummary: ChatSummary = {
  text: ""
};
