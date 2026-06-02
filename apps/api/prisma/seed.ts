import {
  PrismaClient,
  MarketType,
  SignalStatus,
  SignalEventType,
  MenuActionType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.adminUser.upsert({
    where: { email: 'admin@qpulse.app' },
    create: { email: 'admin@qpulse.app', passwordHash },
    update: { passwordHash },
  });

  await prisma.appSettings.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      disclaimer:
        'Trading cryptocurrencies involves substantial risk. Past performance does not guarantee future results.',
      telegramFabUrl: 'https://t.me/qpulse_signals',
    },
    update: {},
  });

  await prisma.homeContent.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      totalMarketCap: '$2.84T',
      totalMarketCapChange24h: 1.8,
      altcoinSeasonIndex: 38,
      altcoinSeasonLabel: 'Bitcoin Season',
      fearGreedValue: 72,
      fearGreedLabel: 'Greed',
      socialLinks: [{ id: 'tg', label: 'Telegram', url: 'https://t.me/qpulse', icon: 'telegram' }],
    },
    update: {},
  });

  const menuLinks = [
    { id: 'crypto_news', label: 'Crypto News', icon: 'megaphone', actionType: MenuActionType.EXTERNAL_LINK, url: 'https://t.me/qpulse_news', order: 1 },
    { id: 'tips_tricks', label: 'Tips and Tricks', icon: 'lightbulb', actionType: MenuActionType.EXTERNAL_LINK, url: 'https://t.me/qpulse_bot', order: 2 },
    { id: 'past_results', label: 'Past Results', icon: 'chart', actionType: MenuActionType.INTERNAL_ROUTE, route: '/results', order: 3 },
    { id: 'join_telegram', label: 'Join On Telegram', icon: 'telegram', actionType: MenuActionType.EXTERNAL_LINK, url: 'https://t.me/qpulse', order: 4 },
    { id: 'follow_instagram', label: 'Follow On Instagram', icon: 'instagram', actionType: MenuActionType.EXTERNAL_LINK, url: 'https://instagram.com/qpulse', order: 5, isEnabled: false },
    { id: 'join_premium', label: 'Join Premium Signals', icon: 'crown', actionType: MenuActionType.EXTERNAL_LINK, url: 'https://t.me/+premium', order: 6 },
    { id: 'contact_me', label: 'Contact Me', icon: 'user', actionType: MenuActionType.EXTERNAL_LINK, url: 'https://t.me/qpulse_admin', order: 7 },
    { id: 'rate_review', label: 'Rate and Review', icon: 'star', actionType: MenuActionType.INTERNAL_ROUTE, route: '/rate-review', order: 8 },
  ];

  for (const link of menuLinks) {
    await prisma.menuLink.upsert({
      where: { id: link.id },
      create: { ...link, isEnabled: link.isEnabled ?? true },
      update: link,
    });
  }

  const templates: Array<{ eventType: SignalEventType; titleTpl: string; bodyTpl: string; channel: string }> = [
    { eventType: SignalEventType.SIGNAL_CREATED, titleTpl: 'New Signal', bodyTpl: '{{pair}} — {{action}} at {{entryPrice}}', channel: 'signals_new' },
    { eventType: SignalEventType.SIGNAL_UPDATED, titleTpl: 'Signal Updated', bodyTpl: '{{pair}} — updated', channel: 'signals_updates' },
    { eventType: SignalEventType.TP_HIT, titleTpl: 'TP {{currentTpLevel}} Hit', bodyTpl: '{{pair}} — TP {{currentTpLevel}} reached', channel: 'signals_tp' },
    { eventType: SignalEventType.SL_HIT, titleTpl: 'Stop Loss Hit', bodyTpl: '{{pair}} — SL reached', channel: 'signals_sl' },
    { eventType: SignalEventType.LIQUIDATED, titleTpl: 'Liquidated', bodyTpl: '{{pair}} — position liquidated', channel: 'signals_liquidation' },
    { eventType: SignalEventType.SIGNAL_CLOSED, titleTpl: 'Signal Closed', bodyTpl: '{{pair}} — +{{profitPercentage}}%', channel: 'signals_updates' },
    { eventType: SignalEventType.SIGNAL_CANCELLED, titleTpl: 'Signal Cancelled', bodyTpl: '{{pair}} signal cancelled', channel: 'signals_updates' },
  ];

  for (const t of templates) {
    await prisma.notificationTemplate.upsert({
      where: { eventType: t.eventType },
      create: { ...t, priority: 'high', deepLink: '/signals/{{id}}' },
      update: t,
    });
  }

  await prisma.signal.deleteMany();

  const signals = [
    {
      pair: 'ADA / USDT',
      marketType: MarketType.SPOT,
      action: 'BUY',
      entryPrice: 0.248,
      capitalPercentage: 2,
      status: SignalStatus.OPEN,
      openDate: new Date('2026-05-20T00:00:00Z'),
      details: {
        targets: [{ label: 'Target 01', price: 0.25544, profitPercent: 3, hit: false }],
        stopLoss: 0.231,
      },
    },
    {
      pair: 'BTC / USDT',
      marketType: MarketType.FUTURES,
      direction: 'LONG' as const,
      status: SignalStatus.ACTIVE,
      entryPrice: 65000,
      capitalPercentage: 2,
      leverage: 5,
      currentTpLevel: 2,
      openDate: new Date('2026-05-18T00:00:00Z'),
      details: {
        targets: [
          { label: 'Target 01', price: 65500, profitPercent: 0.8, hit: true },
          { label: 'Target 02', price: 66000, profitPercent: 1.5, hit: true },
        ],
        stopLoss: 63000,
      },
    },
    {
      pair: 'ADA / USDT',
      marketType: MarketType.SPOT,
      action: 'BUY',
      entryPrice: 0.248,
      capitalPercentage: 1,
      status: SignalStatus.ACTIVE,
      currentTpLevel: 1,
      openDate: new Date('2026-05-19T00:00:00Z'),
      details: {
        targets: [{ label: 'Target 01', price: 0.255, profitPercent: 2.8, hit: true }],
        stopLoss: 0.23,
      },
    },
    {
      pair: 'ETH / USDT',
      marketType: MarketType.FUTURES,
      direction: 'LONG' as const,
      status: SignalStatus.CLOSED,
      entryPrice: 3200,
      capitalPercentage: 1,
      leverage: 10,
      liquidated: true,
      slHit: false,
      profitPercentage: -100,
      openDate: new Date('2026-04-01T00:00:00Z'),
      closeDate: new Date('2026-04-15T00:00:00Z'),
    },
    {
      pair: '1000TAGUSDT / USDT',
      marketType: MarketType.FUTURES,
      direction: 'SHORT' as const,
      status: SignalStatus.CLOSED,
      entryPrice: 0.5,
      capitalPercentage: 1,
      leverage: 1,
      currentTpLevel: 4,
      targetHitLabel: 'Tp 4 Hit',
      profitPercentage: 30,
      openDate: new Date('2026-05-04T00:00:00Z'),
      closeDate: new Date('2026-05-20T00:00:00Z'),
      details: {
        targets: [
          { label: 'Target 01', price: 0.48, profitPercent: 4, hit: true },
          { label: 'Target 02', price: 0.42, profitPercent: 16, hit: true },
          { label: 'Target 03', price: 0.38, profitPercent: 24, hit: true },
          { label: 'Target 04', price: 0.35, profitPercent: 30, hit: true },
        ],
        stopLoss: 0.55,
      },
    },
    {
      pair: 'LTC / USDT',
      marketType: MarketType.SPOT,
      action: 'BUY',
      entryPrice: 85,
      capitalPercentage: 1,
      status: SignalStatus.CANCELLED,
      openDate: new Date('2026-05-10T00:00:00Z'),
    },
  ];

  for (const s of signals) {
    await prisma.signal.create({ data: s as never });
  }

  console.log('Seed completed. Admin: admin@qpulse.app / admin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
