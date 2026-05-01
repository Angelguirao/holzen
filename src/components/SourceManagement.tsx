import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, X, Rss, Mic, BookOpen, User, BarChart3, Youtube, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CatalogSource {
  id: string;
  name: string;
  type: string;
  url: string | null;
  description: string | null;
  category: string;
}

interface UserPref {
  id: string;
  source_id: string | null;
  custom_name: string | null;
  custom_url: string | null;
  custom_type: string | null;
  active: boolean;
  category: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  blog: <Rss className="h-3 w-3" />,
  podcast: <Mic className="h-3 w-3" />,
  newsletter: <Mail className="h-3 w-3" />,
  analyst: <User className="h-3 w-3" />,
  dashboard: <BarChart3 className="h-3 w-3" />,
  youtube: <Youtube className="h-3 w-3" />,
  book: <BookOpen className="h-3 w-3" />,
};

const SIGNAL_TYPE_ORDER = ['analyst', 'podcast', 'newsletter', 'blog', 'dashboard', 'youtube'];
const GROUNDING_TYPE_ORDER = ['book', 'blog', 'podcast', 'newsletter', 'analyst'];

export function SourceManagement() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [catalog, setCatalog] = useState<CatalogSource[]>([]);
  const [prefs, setPrefs] = useState<UserPref[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('signal');
  const [addingCustom, setAddingCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customType, setCustomType] = useState('blog');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setLoadFailed(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadFailed(false);
    const load = async () => {
      try {
        const [rSources, rPrefs] = await Promise.all([
          supabase.from('signal_sources').select('*').order('name'),
          supabase.from('user_signal_preferences').select('*').eq('user_id', user.id),
        ]);
        if (cancelled) return;
        if (rSources.error || rPrefs.error) {
          setLoadFailed(true);
          return;
        }
        setCatalog((rSources.data as unknown as CatalogSource[]) ?? []);
        setPrefs((rPrefs.data as unknown as UserPref[]) ?? []);
        setLoadFailed(false);
      } catch {
        if (!cancelled) setLoadFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [user, reloadNonce]);

  const isActive = useCallback((sourceId: string) => {
    const pref = prefs.find((p) => p.source_id === sourceId);
    // If user has a pref, use it. If no pref exists, source is active by default.
    return pref ? pref.active : true;
  }, [prefs]);

  const removeCatalogSource = useCallback(async (sourceId: string) => {
    if (!user) return;
    const existing = prefs.find((p) => p.source_id === sourceId);
    if (existing) {
      await supabase.from('user_signal_preferences').update({ active: false }).eq('id', existing.id);
      setPrefs((prev) => prev.map((p) => p.id === existing.id ? { ...p, active: false } : p));
    } else {
      const cat = catalog.find((s) => s.id === sourceId)?.category || activeTab;
      const { data } = await supabase
        .from('user_signal_preferences')
        .insert({ user_id: user.id, source_id: sourceId, active: false, category: cat })
        .select()
        .single();
      if (data) setPrefs((prev) => [...prev, data as unknown as UserPref]);
    }
  }, [user, prefs, catalog, activeTab]);

  const restoreCatalogSource = useCallback(async (sourceId: string) => {
    if (!user) return;
    const existing = prefs.find((p) => p.source_id === sourceId);
    if (existing) {
      await supabase.from('user_signal_preferences').update({ active: true }).eq('id', existing.id);
      setPrefs((prev) => prev.map((p) => p.id === existing.id ? { ...p, active: true } : p));
    }
  }, [user, prefs]);

  const addCustomSource = useCallback(async () => {
    if (!user || !customName.trim()) return;
    const { data, error } = await supabase
      .from('user_signal_preferences')
      .insert({
        user_id: user.id,
        source_id: null,
        custom_name: customName.trim(),
        custom_url: customUrl.trim() || null,
        custom_type: customType,
        active: true,
        category: activeTab,
      })
      .select()
      .single();
    if (error) {
      toast.error(t('sources.addFailed'));
      return;
    }
    if (data) setPrefs((prev) => [...prev, data as unknown as UserPref]);
    setCustomName('');
    setCustomUrl('');
    setAddingCustom(false);
    toast.success(t('sources.sourceAdded'));
  }, [user, customName, customUrl, customType, activeTab, t]);

  const removeCustomSource = useCallback(async (prefId: string) => {
    await supabase.from('user_signal_preferences').delete().eq('id', prefId);
    setPrefs((prev) => prev.filter((p) => p.id !== prefId));
  }, []);

  const toggleCustomSource = useCallback(async (prefId: string) => {
    const pref = prefs.find((p) => p.id === prefId);
    if (!pref) return;
    await supabase.from('user_signal_preferences').update({ active: !pref.active }).eq('id', prefId);
    setPrefs((prev) => prev.map((p) => p.id === prefId ? { ...p, active: !p.active } : p));
  }, [prefs]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div className="space-y-3">
        <Alert variant="destructive">
          <AlertDescription className="flex flex-col gap-3 text-left">
            <p>{t('sources.loadFailed')}</p>
            <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setReloadNonce((n) => n + 1)}>
              {t('common.tryAgain')}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const renderSourceList = (category: string) => {
    const typeOrder = category === 'signal' ? SIGNAL_TYPE_ORDER : GROUNDING_TYPE_ORDER;
    const categoryCatalog = catalog.filter((s) => s.category === category);
    const customSources = prefs.filter((p) => !p.source_id && p.custom_name && (p.category === category));

    // Active catalog sources (not dismissed)
    const activeCatalog = categoryCatalog.filter((s) => isActive(s.id));
    // Dismissed catalog sources
    const dismissedCatalog = categoryCatalog.filter((s) => !isActive(s.id));

    const grouped = typeOrder.map((type) => ({
      type,
      sources: activeCatalog.filter((s) => s.type === type),
    })).filter((g) => g.sources.length > 0);

    const activeCount = activeCatalog.length + customSources.filter((c) => c.active).length;
    const totalCount = activeCatalog.length + customSources.length;

    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t(category === 'signal' ? 'sources.signalDescription' : 'sources.groundingDescription')}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground/40">
            {t('sources.activeCount', { active: activeCount, total: totalCount })}
          </p>
        </div>

        {grouped.map(({ type, sources }) => (
          <div key={type} className="space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground/50">{TYPE_ICONS[type]}</span>
              <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">
                {t(`sources.types.${type}`)}
              </p>
            </div>
            <div className="space-y-1">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center gap-3 rounded-md border border-border/40 px-3 py-2 bg-muted/10"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{source.name}</p>
                    {source.description && (
                      <p className="text-[10px] text-muted-foreground/60 leading-relaxed line-clamp-1 mt-0.5">
                        {source.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeCatalogSource(source.id)}
                    className="text-muted-foreground/40 hover:text-destructive transition-colors shrink-0"
                    aria-label="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {customSources.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">
              {t('sources.custom')}
            </p>
            <div className="space-y-1">
              {customSources.map((cs) => (
                <div
                  key={cs.id}
                  className="flex items-center gap-3 rounded-md border border-border/40 px-3 py-2 bg-muted/10"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{cs.custom_name}</p>
                    {cs.custom_url && (
                      <p className="text-[10px] text-muted-foreground/60 truncate">{cs.custom_url}</p>
                    )}
                  </div>
                  <Switch
                    checked={cs.active}
                    onCheckedChange={() => toggleCustomSource(cs.id)}
                    className="shrink-0"
                  />
                  <button
                    onClick={() => removeCustomSource(cs.id)}
                    className="text-muted-foreground/40 hover:text-destructive transition-colors shrink-0"
                    aria-label="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {addingCustom ? (
          <div className="space-y-2 rounded-md border border-border/60 p-3 bg-muted/20">
            <Input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={t('sources.customNamePlaceholder')}
              maxLength={80}
              className="text-xs font-mono"
            />
            <Input
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder={t('sources.customUrlPlaceholder')}
              maxLength={200}
              className="text-xs font-mono"
            />
            <div className="grid grid-cols-3 gap-1">
              {(category === 'signal'
                ? ['blog', 'podcast', 'newsletter', 'analyst', 'youtube', 'dashboard']
                : ['book', 'blog', 'podcast', 'newsletter', 'analyst']
              ).map((tp) => (
                <button
                  key={tp}
                  onClick={() => setCustomType(tp)}
                  className={`text-[10px] font-mono py-1 px-2 rounded border transition-colors ${
                    customType === tp
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t(`sources.types.${tp}`)}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setAddingCustom(false)} className="text-xs font-mono flex-1">
                {t('common.cancel')}
              </Button>
              <Button size="sm" onClick={addCustomSource} disabled={!customName.trim()} className="text-xs font-mono flex-1">
                {t('sources.add')}
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingCustom(true)}
            className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-3 w-3" />
            {t('sources.addCustom')}
          </button>
        )}

        {dismissedCatalog.length > 0 && (
          <details className="group">
            <summary className="text-[10px] font-mono text-muted-foreground/40 cursor-pointer hover:text-muted-foreground transition-colors list-none flex items-center gap-1">
              <Plus className="h-2.5 w-2.5 transition-transform group-open:rotate-45" />
              {t('sources.showRemoved', { count: dismissedCatalog.length })}
            </summary>
            <div className="space-y-1 mt-2">
              {dismissedCatalog.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center gap-3 rounded-md border border-border/20 px-3 py-2 bg-muted/5 opacity-60"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{source.name}</p>
                  </div>
                  <button
                    onClick={() => restoreCatalogSource(source.id)}
                    className="text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    {t('sources.restore')}
                  </button>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
        {t('sources.title')}
      </p>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setAddingCustom(false); }}>
        <TabsList className="grid w-full grid-cols-2 h-8">
          <TabsTrigger value="signal" className="text-xs font-mono">
            {t('sources.signalTab')}
          </TabsTrigger>
          <TabsTrigger value="grounding" className="text-xs font-mono">
            {t('sources.groundingTab')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="signal" className="mt-3">
          {renderSourceList('signal')}
        </TabsContent>
        <TabsContent value="grounding" className="mt-3">
          {renderSourceList('grounding')}
        </TabsContent>
      </Tabs>
    </div>
  );
}
