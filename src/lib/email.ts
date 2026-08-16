import { supabaseConfig } from '../env';

export async function sendConfirmationEmail(name: string, email: string) {
  if (!supabaseConfig) return;
  const response = await fetch(`${supabaseConfig.url}/functions/v1/send-confirmation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseConfig.anonKey}`,
    },
    body: JSON.stringify({ name, email }),
  });
  if (!response.ok) throw new Error(`Confirmation email failed: ${response.status}`);
}