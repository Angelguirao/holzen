/**
 * One-shot helper: merge missing active i18n keys into src/locales/en.json.
 * Values taken from t() defaultValue at call sites where present.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const enPath = join(root, 'src', 'locales', 'en.json');

const ADDITIONS = {
  'archive.echoCardKind': 'Echo',
  'archive.noPreviewYet': 'No preview yet',
  'archive.pauseCardKind': 'Pause',
  'archive.pauseUntitled': 'Untitled pause',
  'common.noResults': 'No results',
  'common.refresh': 'Refresh',
  'common.retry': 'Retry',
  'common.showLess': 'Show less',
  'companions.echoMoreEntries': 'More echoes',
  'companions.fullview.grounding.enrichment.citationCount': '{{count}} sources',
  'companions.loadError': 'Could not load companion',
  'feedback.close': 'Close',
  'feedback.diagnosticAttached': 'Diagnostic attached',
  'feedback.errorPrefill': 'Could not load feedback form',
  'feedback.removeDiagnostic': 'Remove diagnostic',
  'home.openingPause': 'Opening your pause…',
  'journey.overview.completed.label': 'Completed pauses',
  'journey.overview.streak.title': 'Streak',
  'journey.overview.streak.desc': 'Consecutive days with at least one completed pause.',
  'journey.overview.streak.current': 'Current',
  'journey.overview.streak.longest': 'Longest',
  'library.sortAlpha': 'A–Z',
  'library.sortNewest': 'Newest',
  'library.sortOldest': 'Oldest',
  'limits.buyFlexPackS': 'Buy Flex Pack S · ${{price}}',
  'limits.reachedDesc': 'Top up with {{count}} flex credits to continue this month.',
  'limits.reachedTitle': '{{feature}} limit reached',
  'moodCheck.afterDesc': 'How do you feel now?',
  'onboarding.groundingAddMore': 'Add another',
  'onboarding.groundingPlaceholder': 'e.g. Walk outside without checking price',
  'onboarding.groundingSuggestions': 'Suggestions',
  'pause.brief.stepsAria': 'Pause ritual steps',
  'pause.couldNotLoadPause': 'Could not load this pause',
  'pause.reflect.generating': 'Generating reflection…',
  'pause.reflect.noteLabel': 'Private note',
  'pause.reflect.notePlaceholder': 'Optional note for your library…',
  'pause.reflect.tagsLabel': 'Tags',
  'pause.reflect.tagsPlaceholder': 'Add tags…',
  'pro.welcomeToast': '🎉 Welcome to Pro! All features are now unlocked.',
  'quietWindows.add': 'Add window',
  'quietWindows.added': 'Quiet window added',
  'quietWindows.empty': 'No extended quiet windows yet.',
  'quietWindows.labelPlaceholder': 'Label (e.g. Work hours)',
  'quietWindows.newLabel': 'Work hours',
  'quietWindows.removed': 'Quiet window removed',
  'quietWindows.title': 'Extended schedules',
  'scoreImpact.breathing': 'Breathing completed',
  'scoreImpact.moodImproved': 'Mood shifted toward composure',
  'scoreImpact.note': 'Added a reflection note',
  'scoreImpact.tags': 'Tagged this pause',
  'scoreImpact.title': 'What you practiced',
  'scoreImpact.tools': 'Used {{count}} perspective tool(s)',
  'settings.aboutFeedback': 'About & feedback',
  'settings.aboutSubpageHint': 'Changelog, version, and contact the team.',
  'settings.allowanceCompanions': 'Companions & guidance',
  'settings.allowanceFreePauses': 'Free pauses',
  'settings.allowanceInsights': 'Insights',
  'settings.allowanceNextReset': 'Resets {{date}}',
  'settings.allowanceResetsOn': 'Monthly allowance resets on {{date}}',
  'settings.allowanceWallpapers': 'Wallpapers',
  'settings.checkoutWindow': 'Checkout window',
  'settings.checkoutWindowDesc': 'How long Stripe checkout stays open before it expires.',
  'settings.checkoutWindowLabel': 'Checkout session length',
  'settings.checkoutWindowRange': '{{min}}–{{max}} minutes',
  'settings.cooldownHelpBody': 'Automatic pauses wait at least this long after the previous one.',
  'settings.cooldownHelpTitle': 'Cooldown help',
  'settings.creditsDashboard': 'Credits & allowances',
  'settings.flexBalanceShort': '{{count}} flex credits',
  'settings.flexPackMCta': 'Buy Flex Pack M',
  'settings.flexPackSCta': 'Buy Flex Pack S',
  'settings.nextEligibleAt': 'Next eligible {{when}}',
  'settings.planLifetime': 'Lifetime',
  'settings.planPro': 'Pro',
  'settings.planProPlus': 'Pro Plus',
  'settings.signOutFailed': 'Sign out failed',
  'threshold.estimator.avg': 'Average',
  'threshold.estimator.raw': 'Raw samples',
  'threshold.estimator.result': 'Estimated triggers per month',
};

function setPath(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!(p in cur) || typeof cur[p] !== 'object' || cur[p] === null) {
      cur[p] = {};
    }
    cur = cur[p];
  }
  const leaf = parts[parts.length - 1];
  if (!(leaf in cur)) cur[leaf] = value;
}

const en = JSON.parse(readFileSync(enPath, 'utf8').replace(/^\uFEFF/, ''));
let added = 0;
for (const [path, value] of Object.entries(ADDITIONS)) {
  const parts = path.split('.');
  let cur = en;
  let exists = true;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in cur) cur = cur[p];
    else {
      exists = false;
      break;
    }
  }
  if (!exists) {
    setPath(en, path, value);
    added++;
  }
}
writeFileSync(enPath, `${JSON.stringify(en, null, 2)}\n`, 'utf8');
console.log(`merge-missing-i18n: added ${added} keys`);
