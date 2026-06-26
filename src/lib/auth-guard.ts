import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireRole(allowedRoles: string[]) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      ok: false,
      status: 401,
      message: "Unauthorized",
      session: null,
    };
  }

  const role = (session.user as any).role;

  if (!allowedRoles.includes(role)) {
    return {
      ok: false,
      status: 403,
      message: "Forbidden",
      session,
    };
  }

  return {
    ok: true,
    status: 200,
    message: "OK",
    session,
  };
}