export const AUDIT_ACTIONS = {
  USER_BANNED: "admin.user.banned",
  USER_UNBANNED: "admin.user.unbanned",
  USER_ROLE_CHANGED: "admin.user.role_changed",
  USER_DELETED: "admin.user.deleted",
  PRODUCT_SUSPENDED: "admin.product.suspended",
  PRODUCT_UNSUSPENDED: "admin.product.unsuspended",
  PRODUCT_DELETED: "admin.product.deleted",
  TRANSACTION_STATUS_UPDATED: "admin.transaction.status_updated",
  TRANSACTION_REFUNDED: "admin.transaction.refunded",
  CATEGORY_CREATED: "admin.category.created",
  CATEGORY_UPDATED: "admin.category.updated",
  CATEGORY_DELETED: "admin.category.deleted",
} as const;

export type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];
