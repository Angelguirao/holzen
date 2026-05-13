import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { getLandingTestimonialsQueryOptions } from '@/lib/landing-testimonials-query';

export function LandingTestimonials() {
  const { t } = useTranslation();
  const { data: testimonials = [] } = useQuery(getLandingTestimonialsQueryOptions());

  if (!testimonials.length) return null;

  return (
    <div className="space-y-5">
      <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
        {t('landing.whatUsersSay')}
      </p>
      <div className="space-y-3">
        {testimonials.map((row, i) => (
          <motion.div
            key={row.id}
            className="rounded-md border border-border/60 bg-muted/30 p-4 space-y-2"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            <div className="flex items-start gap-2">
              <MessageCircle className="h-3 w-3 text-nox-text-link mt-0.5 shrink-0" />
              <p className="text-xs text-foreground leading-relaxed italic">"{row.quote}"</p>
            </div>
            <p className="text-[10px] text-muted-foreground/70 pl-5">— {row.display_name}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
