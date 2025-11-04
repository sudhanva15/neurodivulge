export default function useInviteCodes(){
  // TODO: create/revoke codes via Supabase table village_invites
  async function create(){ /* ... */ }
  async function revoke(code:string){ /* ... */ }
  return { create, revoke };
}
