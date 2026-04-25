import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageMeta } from '@/components/PageMeta';

/**
 * Public stub for `/roadmap` so inbound links don’t rot (or land on welcome with no explanation).
 * Product roadmap content may return in-app later; until then we point to blog / about.
 */
export default function RoadmapStub() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background px-6 py-16 max-w-lg mx-auto space-y-8">
      <PageMeta
        title={t('roadmap.pageTitle', { defaultValue: 'Roadmap — Holzen' })}
        description={t('roadmap.pageDescription', { defaultValue: 'Product plans and updates' })}
      />
      <div className="space-y-3">
        <h1 className="text-2xl font-serif text-foreground">
          {t('roadmap.title', { defaultValue: 'Roadmap' })}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t('roadmap.body', {
            defaultValue:
              'We do not host a live roadmap in the app right now. Follow the blog for release notes and direction, or read about why we built Holzen.',
          })}
        </p>
      </div>
      <ul className="space-y-2 text-sm">
        <li>
          <Link to="/blog" className="text-primary underline underline-offset-2">
            {t('roadmap.linkBlog', { defaultValue: 'Blog' })}
          </Link>
        </li>
        <li>
          <Link to="/about" className="text-primary underline underline-offset-2">
            {t('roadmap.linkAbout', { defaultValue: 'About Holzen' })}
          </Link>
        </li>
        <li>
          <Link to="/welcome" className="text-primary underline underline-offset-2">
            {t('roadmap.linkHome', { defaultValue: 'Sign in' })}
          </Link>
        </li>
      </ul>
    </div>
  );
}
