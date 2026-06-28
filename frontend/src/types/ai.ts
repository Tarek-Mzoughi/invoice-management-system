export enum AiIntent {
  ANSWER_BUSINESS_QUESTION = 'ANSWER_BUSINESS_QUESTION',
  GENERATE_CHART = 'GENERATE_CHART',
  CREATE_INVOICE_DRAFT = 'CREATE_INVOICE_DRAFT',
  CREATE_QUOTE_DRAFT = 'CREATE_QUOTE_DRAFT',
  CREATE_CUSTOMER = 'CREATE_CUSTOMER',
  CREATE_PAYMENT = 'CREATE_PAYMENT',
  TRANSFORM_QUOTE_TO_INVOICE = 'TRANSFORM_QUOTE_TO_INVOICE',
  ANALYZE_SUPPLIER_INVOICE = 'ANALYZE_SUPPLIER_INVOICE',
  SUMMARIZE_DASHBOARD = 'SUMMARIZE_DASHBOARD',
  EXPLAIN_ENTITY = 'EXPLAIN_ENTITY',
  UNKNOWN_INTENT = 'UNKNOWN_INTENT'
}

export type AiResponseType =
  | 'text'
  | 'table'
  | 'chart'
  | 'action_preview'
  | 'kpi_summary'
  | 'invoice_analysis'
  | 'error'
  | 'clarification';

export interface AiChatContext {
  page?: string;
  entityType?: string;
  entityId?: number;
}

export interface AiChatAttachment {
  mimeType: string;
  data: string; // base64
  fileName?: string;
}

export interface AiChatRequest {
  message: string;
  conversationId?: string;
  context?: AiChatContext;
  attachments?: AiChatAttachment[];
}

export interface AiChartRequest {
  message: string;
  conversationId?: string;
}

/* ── Table ──────────────────────────────────────────────────── */

export interface AiTableColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'currency' | 'date' | 'status';
  align?: 'left' | 'center' | 'right';
}

export interface AiTableTotal {
  label: string;
  value: number;
  currency?: string;
}

export interface AiTablePayload {
  columns: AiTableColumn[];
  rows: Record<string, unknown>[];
  totals?: AiTableTotal[];
  emptyMessage?: string;
}

/* ── Action Preview ─────────────────────────────────────────── */

export interface AiActionCustomer {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface AiActionDocument {
  type: string;
  currency: string;
  status: string;
  issueDate?: string;
  dueDate?: string;
}

export interface AiActionItem {
  title: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  taxes?: string[];
  lineTotal?: number;
}

export interface AiActionTotals {
  subtotal?: number;
  taxTotal?: number;
  discountTotal?: number;
  total: number;
  currency: string;
}

export interface AiActionPreviewData {
  customer?: AiActionCustomer;
  document?: AiActionDocument;
  items?: AiActionItem[];
  totals?: AiActionTotals;
}

export interface AiActionPreview {
  actionId: string;
  intent: string;
  entityType: string;
  title: string;
  description: string;
  confirmationRequired: boolean;
  status: string;
  preview: AiActionPreviewData;
  warnings?: string[];
}

/* ── Chart ──────────────────────────────────────────────────── */

export interface AiChartResponse {
  title: string;
  description?: string;
  chartType: string;
  echartsOption: Record<string, unknown>;
  sourceData?: unknown[];
  insights?: string[];
}

/* ── KPI ────────────────────────────────────────────────────── */

export interface AiKpi {
  label: string;
  value: number;
  previousValue?: number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  currency?: string;
}

/* ── Main Response ──────────────────────────────────────────── */

export interface AiChatResponse {
  type: AiResponseType;
  message: string;
  conversationId?: string;
  title?: string;
  summary?: string;
  data?: unknown[];
  table?: AiTablePayload;
  chart?: AiChartResponse;
  action?: AiActionPreview;
  kpis?: AiKpi[];
  warnings?: string[];
}

export type AiConfirmActionStatus =
  | 'executed'
  | 'already_executed'
  | 'confirming'
  | 'failed'
  | 'cancelled';

export interface AiConfirmActionResponse {
  success: boolean;
  message: string;
  status?: AiConfirmActionStatus;
  entity?: Record<string, unknown>;
}

export interface AiMessageAttachment {
  mimeType: string;
  fileName?: string;
  previewUrl?: string; // data URL for display
}

/* ── Notifications ──────────────────────────────────────────── */

export type AiNotificationType =
  | 'action_executed'
  | 'action_failed'
  | 'invoice_overdue'
  | 'payment_received'
  | 'reminder'
  | 'insight'
  | 'info';

export interface AiNotification {
  id: string;
  type: AiNotificationType;
  priority: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  actionUrl?: string;
  createdAt: string;
}

export interface AiNotificationListResponse {
  data: AiNotification[];
  total: number;
  unreadCount: number;
}

/* ── Reminders ──────────────────────────────────────────────── */

export type AiReminderType =
  | 'invoice_followup'
  | 'payment_due'
  | 'quote_followup'
  | 'client_contact'
  | 'custom';

export interface AiReminder {
  id: string;
  type: AiReminderType;
  status: 'pending' | 'sent' | 'cancelled' | 'failed';
  title: string;
  message: string;
  scheduledAt: string;
  sentAt?: string;
  entityId?: number;
  entityType?: string;
  createdAt: string;
}

export interface AiReminderListResponse {
  data: AiReminder[];
  total: number;
}

/* ── Conversation History ────────────────────────────────────── */

export interface AiConversation {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiConversationListResponse {
  data: AiConversation[];
  total: number;
}

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: AiResponseType;
  chart?: AiChartResponse;
  action?: AiActionPreview;
  table?: AiTablePayload;
  kpis?: AiKpi[];
  data?: unknown[];
  attachments?: AiMessageAttachment[];
}
