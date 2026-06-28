import axios from './axios';
import {
  AiChatRequest,
  AiChatResponse,
  AiChartRequest,
  AiConfirmActionResponse,
  AiConversationListResponse,
  AiNotificationListResponse,
  AiReminder,
  AiReminderListResponse,
  AiReminderType
} from '@/types/ai';

const sendMessage = async (request: AiChatRequest): Promise<AiChatResponse> => {
  const response = await axios.post<AiChatResponse>('public/ai/chat', request);
  return response.data;
};

const generateChart = async (request: AiChartRequest): Promise<AiChatResponse> => {
  const response = await axios.post<AiChatResponse>('public/ai/charts/generate', request);
  return response.data;
};

const confirmAction = async (
  actionId: string,
  overrides?: Record<string, unknown>
): Promise<AiConfirmActionResponse> => {
  const response = await axios.post<AiConfirmActionResponse>(
    `public/ai/actions/${actionId}/confirm`,
    overrides ? { overrides } : {}
  );
  return response.data;
};

const cancelAction = async (actionId: string): Promise<{ success: boolean; message: string }> => {
  const response = await axios.post<{ success: boolean; message: string }>(
    `public/ai/actions/${actionId}/cancel`
  );
  return response.data;
};

/* ── Conversation History ─────────────────────────────────────── */

const listConversations = async (
  page = 1,
  limit = 20
): Promise<AiConversationListResponse> => {
  const response = await axios.get<AiConversationListResponse>(
    `public/ai/conversations?page=${page}&limit=${limit}`
  );
  return response.data;
};

const getConversationMessages = async (
  conversationId: string
): Promise<Array<{ id: string; role: string; content: string; createdAt: string; metadataJson?: Record<string, unknown> }>> => {
  const response = await axios.get(
    `public/ai/conversations/${conversationId}/messages`
  );
  return response.data;
};

const updateConversationTitle = async (
  conversationId: string,
  title: string
): Promise<{ success: boolean }> => {
  const response = await axios.patch(`public/ai/conversations/${conversationId}`, {
    title
  });
  return response.data;
};

const deleteConversation = async (
  conversationId: string
): Promise<{ success: boolean; message: string }> => {
  const response = await axios.delete(`public/ai/conversations/${conversationId}`);
  return response.data;
};

/* ── Notifications ────────────────────────────────────────────── */

const listNotifications = async (
  page = 1,
  limit = 20,
  unreadOnly = false
): Promise<AiNotificationListResponse> => {
  const response = await axios.get<AiNotificationListResponse>(
    `public/ai/notifications?page=${page}&limit=${limit}&unreadOnly=${unreadOnly}`
  );
  return response.data;
};

const getUnreadCount = async (): Promise<{ count: number }> => {
  const response = await axios.get<{ count: number }>('public/ai/notifications/unread-count');
  return response.data;
};

const markNotificationAsRead = async (notificationId: string): Promise<{ success: boolean }> => {
  const response = await axios.patch(`public/ai/notifications/${notificationId}/read`);
  return response.data;
};

const markAllNotificationsAsRead = async (): Promise<{ success: boolean }> => {
  const response = await axios.post('public/ai/notifications/read-all');
  return response.data;
};

/* ── Reminders ────────────────────────────────────────────────── */

const createReminder = async (params: {
  type: AiReminderType;
  title: string;
  message: string;
  scheduledAt: string;
  entityId?: number;
  entityType?: string;
}): Promise<AiReminder> => {
  const response = await axios.post<AiReminder>('public/ai/reminders', params);
  return response.data;
};

const listReminders = async (
  page = 1,
  limit = 20
): Promise<AiReminderListResponse> => {
  const response = await axios.get<AiReminderListResponse>(
    `public/ai/reminders?page=${page}&limit=${limit}`
  );
  return response.data;
};

const cancelReminder = async (
  reminderId: string
): Promise<{ success: boolean }> => {
  const response = await axios.post(`public/ai/reminders/${reminderId}/cancel`);
  return response.data;
};

export const ai = {
  sendMessage,
  generateChart,
  confirmAction,
  cancelAction,
  listConversations,
  getConversationMessages,
  updateConversationTitle,
  deleteConversation,
  listNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createReminder,
  listReminders,
  cancelReminder
};
