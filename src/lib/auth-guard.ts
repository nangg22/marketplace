import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/lib/auth";

type RequireRoleResult =
  | {
      ok: true;
      status: 200;
      message: "OK";
      session: Session;
    }
  | {
      ok: false;
      status: 401;
      message: "Unauthorized";
      session: null;
    }
  | {
      ok: false;
      status: 403;
      message: "Forbidden";
      session: Session;
    };

export async function requireRole(allowedRoles: string[]): Promise<RequireRoleResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      ok: false,
      status: 401,
      message: "Unauthorized",
      session: null,
    };
  }

  const role = session.user.role;

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
