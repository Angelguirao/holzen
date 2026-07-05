import { useTranslation } from "react-i18next";
import { Wind, Mail } from "lucide-react";
import { PageMeta } from "@/app/components/PageMeta";

/** Minimal public shell when `VITE_COMING_SOON` is set at build time. */
export default function ComingSoonScreen() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-background text-foreground">
      <PageMeta
        title={t("comingSoon.metaTitle")}
        description={t("comingSoon.metaDescription")}
        path="/"
        noindex
      />
      <div className="w-full max-w-md text-center space-y-8">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-muted/60 text-muted-foreground">
          <Wind className="h-7 w-7" aria-hidden />
        </div>
        <div className="space-y-3">
          <p className="text-xs font-mono tracking-[0.2em] uppercase text-muted-foreground">
            {t("common.holzen")}
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl tracking-tight text-balance">
            {t("comingSoon.headline")}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
            {t("comingSoon.body")}
          </p>
        </div>
        <a
          href="mailto:hello@holzen.app"
          className="inline-flex items-center gap-2 text-sm text-foreground/80 hover:text-foreground transition-colors"
        >
          <Mail className="h-4 w-4 shrink-0" aria-hidden />
          {t("comingSoon.contact")}
        </a>
      </div>
    </div>
  );
}
