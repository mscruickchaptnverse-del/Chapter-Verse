/** Homepage copy stored in Firebase Storage as JSON (see `HomeContentStorageService`). */
export interface AdminUser {
  name: string;
  email: string;
  role: 'Owner' | 'Editor' | 'Admin';
}

export interface HomePageContent {
  heroEyebrow: string;
  heroTitleTop: string;
  heroTitleBottom: string;
  heroBody: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  philosophyHeadingLine1: string;
  philosophyHeadingAccent: string;
  philosophyIntro: string;
  philosophyQuote: string;
  philosophyQuoteLabel: string;
  philosophyParagraph1: string;
  philosophyParagraph2: string;
  philosophyPullQuote: string;
  testimonialQuote: string;
  testimonialName: string;
  testimonialSubtitle: string;
  chartersTitle: string;
  chartersBody: string;
  chartersButton: string;
  chartersButtonLink: string;
  valuesCard1Title: string;
  valuesCard1Body: string;
  valuesCard2Title: string;
  valuesCard2Body: string;
  valuesCard3Title: string;
  valuesCard3Body: string;
  valuesCard4Title: string;
  valuesCard4Body: string;
  adminUsers: AdminUser[];
}

export const DEFAULT_HOME_PAGE_CONTENT: HomePageContent = {
  heroEyebrow: 'Chapter & Verse Charters, LLC',
  heroTitleTop: 'Products For Every',
  heroTitleBottom: 'Chapter of Her Life.',
  heroBody:
    'Thoughtfully curated essentials for every transition—so the details of your day support the story you are living, never slow it down.',
  heroPrimaryCta: 'Shop the collection',
  heroSecondaryCta: 'Learn our philosophy',
  philosophyHeadingLine1: 'Practicality as a',
  philosophyHeadingAccent: 'Promise.',
  philosophyIntro:
    'Chapter & Verse began as a quiet answer to a noisy market: fewer, better pieces that respect your time, your space, and the season you are in. What we make is meant to fade into the background of a well-lived life—reliable, beautiful, and always in step with you.',
  philosophyQuote: 'Practicality is the highest form of self-care.',
  philosophyQuoteLabel: 'Founding philosophy',
  philosophyParagraph1:
    'We design for rhythm—not trends. Each piece is chosen to carry you through early mornings, full calendars, and the rare quiet hour without asking you to reinvent your routine.',
  philosophyParagraph2:
    'Our hope is simple: that what you reach for each day feels inevitable, grounded, and unmistakably yours.',
  philosophyPullQuote:
    'We are here to ensure that no matter which chapter you are writing, your everyday tools are never the reason you pause.',
  testimonialQuote:
    'I finally found a collection that understands the duality of my life. The quality is exceptional, but the thoughtfulness behind every item is what keeps me coming back to Chapter & Verse.',
  testimonialName: 'Donnette .',
  testimonialSubtitle: 'Chapter 12: Modern Motherhood',
  chartersTitle: 'Write Your Next Chapter.',
  chartersBody:
    'Discover the collection built for real life—and the grace notes that make the everyday feel considered.',
  chartersButton: 'Begin shopping',
  chartersButtonLink: '/shop',
  valuesCard1Title: 'Practicality Over Trends',
  valuesCard1Body: 'Functional design that honors your time and space.',
  valuesCard2Title: 'Reliability You Can Trust',
  valuesCard2Body: 'Built with artisanal integrity to accompany your legacy.',
  valuesCard3Title: 'Simple, Thoughtful Living',
  valuesCard3Body: 'Curated essentials that eliminate clutter and foster ease.',
  valuesCard4Title: 'Designed for Real Life',
  valuesCard4Body:
    'Anticipating modern femininity from quiet mornings to full schedules.',
  adminUsers: []
};

function isAdminRole(value: unknown): value is AdminUser['role'] {
  return value === 'Owner' || value === 'Editor' || value === 'Admin';
}

export function mergeHomePageContent(raw: unknown): HomePageContent {
  const base: HomePageContent = {
    ...DEFAULT_HOME_PAGE_CONTENT,
    adminUsers: DEFAULT_HOME_PAGE_CONTENT.adminUsers.map((user) => ({ ...user }))
  };
  if (!raw || typeof raw !== 'object') {
    return base;
  }
  const o = raw as Record<string, unknown>;
  (Object.keys(DEFAULT_HOME_PAGE_CONTENT) as (keyof HomePageContent)[]).forEach((key) => {
    if (key === 'adminUsers') {
      return;
    }
    const v = o[key];
    if (typeof v === 'string') {
      base[key] = v;
    }
  });

  const adminUsers = o['adminUsers'];
  if (Array.isArray(adminUsers)) {
    const safeUsers: AdminUser[] = adminUsers
      .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object')
      .map((entry) => {
        const role = isAdminRole(entry['role']) ? entry['role'] : 'Editor';
        return {
          name: typeof entry['name'] === 'string' ? entry['name'] : '',
          email: typeof entry['email'] === 'string' ? entry['email'] : '',
          role
        };
      })
      .filter((user) => user.name.trim().length > 0 && user.email.trim().length > 0);

    if (safeUsers.length > 0) {
      base.adminUsers = safeUsers;
    }
  }
  return base;
}
