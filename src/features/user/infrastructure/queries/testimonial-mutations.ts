import { supabase } from '@/integrations/supabase/client';

export async function submitUserTestimonial(input: {
  userId: string;
  displayName: string;
  quote: string;
}): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('testimonials').insert({
    user_id: input.userId,
    display_name: input.displayName.trim(),
    quote: input.quote.trim(),
  });
  return { error: error ? new Error(error.message) : null };
}
