import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // 1. Cari user di database Neon berdasarkan email
        const userList = await db.select().from(users).where(eq(users.email, credentials.email)).limit(1);
        if (userList.length === 0) return null; // Email tidak ditemukan

        const user = userList[0];

        // 2. Cocokkan password yang diketik dengan password acak di database
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) return null; // Password salah

        // 3. Jika benar, izinkan masuk dan bawa data Role-nya (Penjual/Pembeli)
        return { id: user.id, name: user.name, email: user.email, role: user.role };
      }
    })
  ],
  callbacks: {
    // Menyimpan role di dalam token brankas
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role;
      return token;
    },
    // Memunculkan role agar bisa dibaca oleh website kita
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login", // Jika ada yang paksa masuk, lempar ke halaman login kita
  }
});

export { handler as GET, handler as POST };
