import "server-only";

import { getDatabase } from "@/lib/server/sites";

export type PublishedPortfolioItem = {
  id: string;
  slug: string;
  title: string;
  category: string;
  yearLabel: string;
  summary: string;
  coverMediaId: string | null;
  coverAltText: string | null;
};

type PortfolioRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
  year_label: string;
  summary: string;
  cover_media_id: string | null;
  cover_alt_text: string | null;
};

export async function getPublishedPortfolio(): Promise<PublishedPortfolioItem[]> {
  try {
    const result = await (await getDatabase())
      .prepare(
        `SELECT p.id, p.slug, p.title, p.category, p.year_label, p.summary,
                p.cover_media_id, m.alt_text AS cover_alt_text
         FROM portfolio_items p
         LEFT JOIN media_assets m ON m.id = p.cover_media_id
         WHERE p.published = 1
         ORDER BY p.sort_order, p.created_at DESC`,
      )
      .all<PortfolioRow>();
    return (result.results ?? []).map((item) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      category: item.category,
      yearLabel: item.year_label,
      summary: item.summary,
      coverMediaId: item.cover_media_id,
      coverAltText: item.cover_alt_text,
    }));
  } catch {
    return [];
  }
}

export async function getPublishedPortfolioItem(slug: string) {
  return (await getPublishedPortfolio()).find((item) => item.slug === slug) ?? null;
}
