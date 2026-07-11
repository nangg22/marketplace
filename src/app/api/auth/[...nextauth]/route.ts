import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/auth";



const handler = NextAuth(authOptions);

export async function GET(req: Request, props: { params: Promise<{ nextauth: string[] }> }) {
  const params = await props.params;
  return handler(req, { params });
}

export async function POST(req: Request, props: { params: Promise<{ nextauth: string[] }> }) {
  const params = await props.params;
  return handler(req, { params });
}