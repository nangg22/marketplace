import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Force Node.js runtime (not Edge) — next-auth v4 requires Node APIs
export const runtime = "nodejs";

// Next.js 15+ passes params as Promise — must resolve before passing to next-auth v4
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
