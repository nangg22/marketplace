import { db } from "@/lib/db";
import { auditLogs } from "@/lib/schema";
import { headers } from "next/headers";

export async function logAdminAction({
  actorId,
  action,
  entityType,
  entityId,
  before,
  after,
}: {
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}) {
  try {
    // Ambil IP dari request headers (server component compatible)
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for") ??
      headersList.get("x-real-ip") ??
      null;

    await db.insert(auditLogs).values({
      actorId,
      action,
      entityType,
      entityId,
      metadata: { before, after },
      ipAddress: ip,
    });
  } catch (error) {
    // Jangan sampai audit log error menggagalkan aksi utama
    console.error("[AuditLog] Failed to write audit log:", error);
  }
}
