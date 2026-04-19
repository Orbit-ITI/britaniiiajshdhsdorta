// ============================================================
// utils.ts — helpers (passport generation moved to server)
// ============================================================

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  } catch {
    return iso;
  }
}

export function nowISO(): string {
  return new Date().toISOString();
}

export const APP_TYPE_LABELS: Record<string, string> = {
  passport:         '🪪 Паспорт',
  property:         '🏠 Собственность',
  business_license: '💼 Лицензия на бизнес',
  building_permit:  '🏗️ Строительное разрешение',
  organization:     '🏢 Организация',
};

export const APP_STATUS_LABELS: Record<string, string> = {
  pending:  'На рассмотрении',
  approved: 'Одобрено',
  rejected: 'Отклонено',
  review:   'На пересмотре',
};

export function statusClass(status: string): string {
  return `status-${status}`;
}
