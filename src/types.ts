export type ParticipantStatus = 'in' | 'maybe' | 'out';

export interface Profile {
  id: string;
  name: string;
  avatar_color: string;
}

export interface Group {
  id: string;
  name: string;
  emoji: string;
  invite_code: string;
  created_by: string;
}

export interface EventRow {
  id: string;
  group_id: string;
  sport: string;
  starts_at: string; // ISO timestamp
  seats: number;
  created_by: string;
}

export interface EventParticipantRow {
  event_id: string;
  user_id: string;
  status: ParticipantStatus;
}

export interface EventWithParticipants extends EventRow {
  participants: Record<string, ParticipantStatus>; // user_id -> status
}

export const SPORTS = [
  '🏓 Padel',
  '⚽ Calcetto',
  '🎾 Tennis',
  '🍝 Cena',
  '🎉 Uscita',
  '🏠 Casa',
] as const;

export const STATUS_LABEL: Record<ParticipantStatus, string> = {
  in: 'Ci sono',
  maybe: 'Forse',
  out: 'Non vengo',
};

export const AVATAR_COLORS = [
  '#1F5D42', '#A63A50', '#E3A93B', '#4B564C', '#6B8F71', '#B87F52', '#7A6BAF', '#C4676F',
];
