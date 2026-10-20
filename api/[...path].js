import { handleSupabaseApi } from '../src/server/supabase-api.js';

export default async function handler(request, response) {
  return handleSupabaseApi(request, response);
}
