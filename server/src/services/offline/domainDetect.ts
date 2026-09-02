import type { ProjectType } from '../../types/domain';

/**
 * Which blueprint a project idea maps onto.
 *
 * `generic` is the honest fallback rather than a failure: an idea we cannot place
 * still deserves a coherent plan, just one built from the universal shapes
 * (accounts, a primary record, dashboards) instead of domain-specific ones.
 */
export const DOMAIN_KEYS = [
  'food-delivery',
  'ecommerce',
  'marketplace',
  'saas',
  'booking',
  'social',
  'lms',
  'fintech',
  'logistics',
  'cms',
  'healthcare',
  'realestate',
  'fitness',
  'iot',
  'ai-tool',
  'generic',
] as const;

export type DomainKey = (typeof DOMAIN_KEYS)[number];

interface DomainSignals {
  /** Weight 3 — near-conclusive on its own. */
  strong: string[];
  /** Weight 2 — characteristic but shared with neighbours. */
  medium: string[];
  /** Weight 1 — supporting evidence only. */
  weak: string[];
  /** Small nudge when the wizard's project type agrees. */
  types?: ProjectType[];
}

/**
 * Scoring beats a single keyword match because real ideas mix vocabularies. "A
 * marketplace where restaurants list meals and drivers deliver them" contains
 * both marketplace and food-delivery language; weighting lets the more specific
 * blueprint win rather than whichever term happened to appear first.
 */
const SIGNALS: Record<Exclude<DomainKey, 'generic'>, DomainSignals> = {
  'food-delivery': {
    strong: [
      'food delivery',
      'food-delivery',
      'meal delivery',
      'restaurant delivery',
      'grocery delivery',
      'takeaway',
      'takeout',
      'doordash',
      'ubereats',
      'uber eats',
      'swiggy',
      'zomato',
      'deliveroo',
      'foodpanda',
    ],
    medium: ['restaurant', 'menu', 'dish', 'cuisine', 'kitchen', 'courier', 'rider', 'meal'],
    weak: ['order', 'delivery', 'driver', 'cart', 'checkout', 'tip', 'eta'],
    types: ['web', 'mobile', 'ecommerce'],
  },
  ecommerce: {
    strong: [
      'e-commerce',
      'ecommerce',
      'online store',
      'online shop',
      'webshop',
      'storefront',
      'shopify',
      'dropshipping',
      'retail store',
    ],
    medium: ['product catalog', 'catalogue', 'inventory', 'cart', 'checkout', 'sku', 'shipping'],
    weak: ['product', 'buy', 'sell', 'payment', 'discount', 'coupon', 'wishlist', 'review'],
    types: ['ecommerce', 'web'],
  },
  marketplace: {
    strong: [
      'marketplace',
      'two-sided',
      'two sided',
      'multi-vendor',
      'multi vendor',
      'peer-to-peer',
      'peer to peer',
      'gig platform',
      'freelance platform',
      'airbnb',
      'etsy',
      'fiverr',
    ],
    medium: ['vendor', 'seller', 'buyer', 'listing', 'commission', 'payout', 'escrow'],
    weak: ['bid', 'offer', 'rating', 'category', 'search'],
    types: ['web', 'saas', 'ecommerce'],
  },
  saas: {
    strong: [
      'saas',
      'software as a service',
      'subscription platform',
      'b2b tool',
      'internal tool',
      'admin dashboard',
      'analytics dashboard',
      'crm',
      'project management tool',
      'help desk',
      'ticketing system',
    ],
    medium: [
      'workspace',
      'organization',
      'organisation',
      'multi-tenant',
      'multi tenant',
      'team',
      'billing',
      'subscription',
      'plan',
      'seat',
      'usage',
    ],
    weak: ['dashboard', 'report', 'metric', 'invite', 'role', 'permission', 'api key'],
    types: ['saas', 'web'],
  },
  booking: {
    strong: [
      'booking',
      'reservation',
      'appointment',
      'scheduling app',
      'calendly',
      'hotel booking',
      'flight booking',
      'ticket booking',
      'table reservation',
      'salon',
      'barber',
      'clinic appointment',
    ],
    medium: ['availability', 'time slot', 'timeslot', 'calendar', 'schedule', 'reschedule', 'no-show'],
    weak: ['slot', 'cancel', 'reminder', 'staff', 'service', 'duration'],
    types: ['web', 'mobile', 'saas'],
  },
  social: {
    strong: [
      'social network',
      'social media',
      'social platform',
      'community platform',
      'forum',
      'discussion board',
      'chat app',
      'messaging app',
      'dating app',
      'microblog',
      'twitter clone',
      'instagram clone',
      'reddit clone',
    ],
    medium: ['feed', 'follower', 'following', 'post', 'friend', 'timeline', 'story', 'dm', 'thread'],
    weak: ['like', 'comment', 'share', 'profile', 'notification', 'hashtag', 'mention'],
    types: ['web', 'mobile'],
  },
  lms: {
    strong: [
      'learning management',
      'lms',
      'online course',
      'e-learning',
      'elearning',
      'course platform',
      'udemy',
      'coursera',
      'tutoring platform',
      'school management',
      'quiz app',
      'exam portal',
    ],
    medium: ['course', 'lesson', 'student', 'teacher', 'instructor', 'enrollment', 'enrolment', 'curriculum', 'quiz'],
    weak: ['module', 'assignment', 'grade', 'certificate', 'progress', 'video lesson'],
    types: ['web', 'saas'],
  },
  fintech: {
    strong: [
      'fintech',
      'banking app',
      'digital wallet',
      'payment gateway',
      'expense tracker',
      'budgeting app',
      'invoicing app',
      'accounting software',
      'lending platform',
      'crypto exchange',
      'trading platform',
      'personal finance',
      'payroll',
    ],
    medium: ['wallet', 'transaction', 'ledger', 'invoice', 'budget', 'expense', 'portfolio', 'kyc', 'balance'],
    weak: ['transfer', 'account', 'currency', 'interest', 'statement', 'tax'],
    types: ['web', 'mobile', 'saas'],
  },
  logistics: {
    strong: [
      'logistics',
      'fleet management',
      'shipment tracking',
      'supply chain',
      'warehouse management',
      'freight',
      'last mile',
      'last-mile',
      'parcel tracking',
      'dispatch system',
    ],
    medium: ['shipment', 'warehouse', 'route', 'vehicle', 'fleet', 'consignment', 'tracking number', 'depot'],
    weak: ['driver', 'stock', 'pickup', 'dropoff', 'gps', 'eta'],
    types: ['web', 'saas', 'api'],
  },
  cms: {
    strong: [
      'cms',
      'content management',
      'blog platform',
      'blogging',
      'news website',
      'publishing platform',
      'headless cms',
      'documentation site',
      'wiki',
      'portfolio site',
      'landing page builder',
    ],
    medium: ['article', 'post', 'author', 'editor', 'draft', 'publish', 'seo', 'category', 'page builder'],
    weak: ['tag', 'comment', 'media', 'slug', 'archive'],
    types: ['web', 'saas'],
  },
  healthcare: {
    strong: [
      'healthcare',
      'health care',
      'telemedicine',
      'patient portal',
      'electronic health record',
      'ehr',
      'emr',
      'hospital management',
      'pharmacy',
      'mental health app',
      'doctor appointment',
      'medical records',
    ],
    medium: ['patient', 'doctor', 'clinic', 'prescription', 'diagnosis', 'consultation', 'medication', 'hipaa'],
    weak: ['symptom', 'treatment', 'nurse', 'vital', 'insurance'],
    types: ['web', 'mobile', 'saas'],
  },
  realestate: {
    strong: [
      'real estate',
      'real-estate',
      'property listing',
      'property management',
      'rental platform',
      'apartment listing',
      'zillow',
      'tenant portal',
      'lease management',
      'house hunting',
    ],
    medium: ['property', 'listing', 'landlord', 'tenant', 'lease', 'rent', 'agent', 'viewing', 'mortgage'],
    weak: ['apartment', 'house', 'bedroom', 'address', 'valuation'],
    types: ['web', 'mobile'],
  },
  fitness: {
    strong: [
      'fitness app',
      'workout app',
      'gym app',
      'personal trainer app',
      'habit tracker',
      'meditation app',
      'running app',
      'nutrition tracker',
      'calorie counter',
      'wellness app',
      'gym management',
    ],
    medium: ['workout', 'exercise', 'routine', 'streak', 'habit', 'calorie', 'macro', 'training plan', 'rep'],
    weak: ['set', 'weight', 'goal', 'progress photo', 'step', 'sleep'],
    types: ['mobile', 'web'],
  },
  iot: {
    strong: [
      'iot',
      'internet of things',
      'smart home',
      'sensor network',
      'device monitoring',
      'telemetry',
      'embedded device',
      'smart meter',
      'home automation',
      'industrial monitoring',
    ],
    medium: ['sensor', 'device', 'firmware', 'mqtt', 'gateway', 'reading', 'threshold', 'actuator'],
    weak: ['temperature', 'humidity', 'alert', 'realtime', 'dashboard', 'battery'],
    types: ['iot', 'web', 'api'],
  },
  'ai-tool': {
    strong: [
      'ai tool',
      'ai-powered',
      'ai powered',
      'chatbot',
      'llm',
      'gpt',
      'machine learning',
      'rag',
      'retrieval augmented',
      'image generation',
      'ai assistant',
      'ai writing',
      'summarizer',
      'summariser',
      'recommendation engine',
      'computer vision',
      'speech to text',
      'transcription',
    ],
    medium: ['prompt', 'model', 'embedding', 'vector', 'token', 'inference', 'fine-tune', 'agent', 'dataset'],
    weak: ['generate', 'ai', 'ml', 'neural', 'training'],
    types: ['ai', 'saas', 'api'],
  },
};

/** How the wizard's project type nudges an otherwise close call. */
const TYPE_BONUS = 1.5;

export interface DomainMatch {
  domain: DomainKey;
  score: number;
  /** The signal phrases that actually fired, surfaced in the UI as reasoning. */
  matched: string[];
  runnerUp?: { domain: DomainKey; score: number };
}

/**
 * Longest-first so a strong multi-word phrase is credited before its own
 * substrings — "food delivery" must not be scored as a bare "delivery".
 */
function countHits(haystack: string, needles: string[]): string[] {
  const hits: string[] = [];
  for (const needle of [...needles].sort((a, b) => b.length - a.length)) {
    if (haystack.includes(needle)) hits.push(needle);
  }
  return hits;
}

/**
 * Word-boundary-aware containment for the short weak signals.
 *
 * Without this, "set" matches "asset" and "iot" matches "patriot", which is how
 * a fitness idea ends up with an IoT blueprint.
 */
function normalise(idea: string): string {
  return ` ${idea.toLowerCase().replace(/[^a-z0-9+#.\- ]+/g, ' ').replace(/\s+/g, ' ').trim()} `;
}

function hasWord(haystack: string, needle: string): boolean {
  if (needle.includes(' ')) return haystack.includes(needle);
  return haystack.includes(` ${needle} `) || haystack.includes(` ${needle}s `);
}

export function detectDomain(idea: string, projectType?: ProjectType): DomainMatch {
  const text = normalise(idea);
  const scores: Array<{ domain: DomainKey; score: number; matched: string[] }> = [];

  for (const [domain, signals] of Object.entries(SIGNALS) as Array<
    [Exclude<DomainKey, 'generic'>, DomainSignals]
  >) {
    const strong = countHits(text, signals.strong);
    const medium = countHits(text, signals.medium).filter((word) => hasWord(text, word));
    const weak = countHits(text, signals.weak).filter((word) => hasWord(text, word));

    let score = strong.length * 3 + medium.length * 2 + weak.length;
    if (score > 0 && projectType && signals.types?.includes(projectType)) {
      score += TYPE_BONUS;
    }

    if (score > 0) {
      scores.push({ domain, score, matched: [...strong, ...medium, ...weak].slice(0, 8) });
    }
  }

  scores.sort((a, b) => b.score - a.score);

  // A single weak keyword is noise, not a signal — "users can order the list"
  // should not produce a food-delivery plan.
  const best = scores[0];
  if (!best || best.score < 2) {
    return { domain: 'generic', score: 0, matched: [] };
  }

  return {
    domain: best.domain,
    score: best.score,
    matched: best.matched,
    runnerUp: scores[1] ? { domain: scores[1].domain, score: scores[1].score } : undefined,
  };
}

/** Human-readable label for the detected domain, used in generated copy. */
export const DOMAIN_LABELS: Record<DomainKey, string> = {
  'food-delivery': 'Food delivery',
  ecommerce: 'E-commerce',
  marketplace: 'Marketplace',
  saas: 'SaaS platform',
  booking: 'Booking & scheduling',
  social: 'Social & community',
  lms: 'Learning platform',
  fintech: 'Fintech',
  logistics: 'Logistics',
  cms: 'Content platform',
  healthcare: 'Healthcare',
  realestate: 'Real estate',
  fitness: 'Health & fitness',
  iot: 'IoT & telemetry',
  'ai-tool': 'AI product',
  generic: 'Custom application',
};
