import { api } from '../../../lib/api';
import { ApplicationType, UserProfile } from '../../../lib/types';

export async function submitApplication(
  profile: UserProfile,
  type: ApplicationType,
  data: Record<string, string>,
): Promise<string> {
  const app = await api.post<{ id: string }>('/applications', { type, data });
  return app.id;
}
