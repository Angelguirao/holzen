import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Testimonial {
  id: string;
  display_name: string;
  quote: string;
}

export function LandingTestimonials() {
  const { t } = useTranslation();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    supabase
      .from('testimonials')
      .select('id, display_name, quote')
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (data?.length) setTestimonials(data as Testimonial[]);
      });
  }, []);

  if (!testimonials.length) return null;

  return (
    <div className="space-y-5">
      <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
        {t('landing.whatUsersSay')}
      </p>
      <div className="space-y-3">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.id}
            className="rounded-md border border-border/60 bg-muted/30 p-4 space-y-2"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            <div className="flex items-start gap-2">
              <MessageCircle className="h-3 w-3 text-nox-text-link mt-0.5 shrink-0" />
              <p className="text-xs text-foreground leading-relaxed italic">"{t.quote}"</p>
            </div>
            <p className="text-[10px] text-muted-foreground/70 pl-5">— {t.display_name}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
