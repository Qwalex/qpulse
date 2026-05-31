import type { HomeContent } from '@prisma/client';
import type { HomeContentDto } from '@qpulse/shared';

/** Empty ticker for legacy mobile builds that still read `ticker` from home-content. */
const LEGACY_EMPTY_TICKER: HomeContentDto['ticker'] = [];

/**
 * Public home payload for mobile.
 * Includes legacy btc/ticker fields so older app builds keep working after the market-metrics schema change.
 */
export function mapPublicHomeContent(content: HomeContent): HomeContentDto {
  return {
    totalMarketCap: content.totalMarketCap,
    totalMarketCapChange24h: content.totalMarketCapChange24h,
    altcoinSeasonIndex: content.altcoinSeasonIndex,
    altcoinSeasonLabel: content.altcoinSeasonLabel,
    fearGreedValue: content.fearGreedValue,
    fearGreedLabel: content.fearGreedLabel,
    socialLinks: content.socialLinks as HomeContentDto['socialLinks'],
    btcPrice: 0,
    btcChange24h: content.totalMarketCapChange24h,
    btcMarketCap: content.totalMarketCap,
    btcVolume: '—',
    ticker: LEGACY_EMPTY_TICKER,
  };
}
