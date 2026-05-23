/** In-app `notifications` table row (read model for the header bell). */
export type NotificationsInboxRowType =
  | 'badge'
  | 'night_reflection'
  | 'letter'
  | 'insight'
  | 'pause';

export type NotificationsInboxRow = {
  id: string;
  type: NotificationsInboxRowType;
  metadata: unknown;
  action_path: string | null;
  action_state: unknown;
  created_at: string;
  dismissed_at: string | null;
};
