export type FocusSession = { id?: string; minutes: number; started_at: string };
export default function useFocusSessions(userId?: string){
  // TODO: replace with Supabase query
  return { sessions: [] as FocusSession[] };
}
