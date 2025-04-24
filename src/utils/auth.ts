// src/utils/auth.ts
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

// Custom hook to protect pages that require authentication
export async function requireAuth() {
  const session = await getServerSession();
  
  if (!session || !session.user) {
    // Redirect to login if not authenticated
    redirect("/auth?state=login");
  }
  
  return session;
}

// Utility to check if a user is authenticated and redirect if they are
export async function redirectIfAuthenticated() {
  const session = await getServerSession();
  
  if (session && session.user) {
    // Redirect to homepage if already authenticated
    redirect("/");
  }
  
  return session;
}