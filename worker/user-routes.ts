import { Hono } from "hono";
import type { Env } from './core-utils';
import { TokenEntity, QuestEntity, QuestPortfolioEntity } from "./entities";
import { ok, notFound, bad, isStr } from './core-utils';
import type { LeaderboardEntry, Token, Quest } from "@shared/types";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // TOKENS
  app.get('/api/tokens', async (c) => {
    await TokenEntity.ensureSeed(c.env);
    const page = await TokenEntity.list(c.env);
    const shuffledTokens = page.items.sort(() => Math.random() - 0.5);
    return ok(c, { items: shuffledTokens, next: null });
  });
  // QUESTS
  app.get('/api/quests', async (c) => {
    await QuestEntity.ensureSeed(c.env);
    const page = await QuestEntity.list(c.env);
    const sortedQuests = page.items.sort((a, b) => {
        const statusOrder = { active: 0, upcoming: 1, ended: 2 };
        return statusOrder[a.status] - statusOrder[b.status];
    });
    return ok(c, { items: sortedQuests, next: page.next });
  });
  app.get('/api/quests/:questId', async (c) => {
    const { questId } = c.req.param();
    const quest = new QuestEntity(c.env, questId);
    if (!(await quest.exists())) return notFound(c, 'Quest not found');
    return ok(c, await quest.getState());
  });
  app.post('/api/quests', async (c) => {
    const questData = (await c.req.json()) as Partial<Quest>;
    if (!questData.name || !questData.entryFee || !questData.prizePool || !questData.duration) {
      return bad(c, 'Missing required quest fields');
    }
    const newQuest: Quest = {
      id: crypto.randomUUID(),
      name: questData.name,
      entryFee: questData.entryFee,
      prizePool: questData.prizePool,
      duration: questData.duration,
      participants: 0,
      status: 'upcoming',
    };
    const created = await QuestEntity.create(c.env, newQuest);
    return ok(c, created);
  });
  app.post('/api/quests/:questId/join', async (c) => {
    const { questId } = c.req.param();
    const { userId } = (await c.req.json()) as { userId?: string };
    if (!isStr(userId)) return bad(c, 'userId is required');
    const portfolioId = `${questId}:${userId}`;
    const portfolio = new QuestPortfolioEntity(c.env, portfolioId);
    if (await portfolio.exists()) return ok(c, await portfolio.getState());
    const newPortfolio = await QuestPortfolioEntity.create(c.env, {
      id: portfolioId,
      questId,
      userId,
      joinedAt: Date.now(),
      holdings: [],
    });
    return ok(c, newPortfolio);
  });
  app.get('/api/quests/:questId/portfolio/:userId', async (c) => {
    const { questId, userId } = c.req.param();
    const portfolioId = `${questId}:${userId}`;
    const portfolio = new QuestPortfolioEntity(c.env, portfolioId);
    if (!(await portfolio.exists())) return notFound(c, 'Portfolio not found');
    return ok(c, await portfolio.getState());
  });
  app.post('/api/quests/:questId/buy', async (c) => {
    const { questId } = c.req.param();
    const { userId, token, quantity } = (await c.req.json()) as { userId?: string; token?: Token; quantity?: number };
    if (!isStr(userId) || !token || !quantity || quantity <= 0) return bad(c, 'userId, token, and quantity are required');
    const portfolioId = `${questId}:${userId}`;
    const portfolio = new QuestPortfolioEntity(c.env, portfolioId);
    if (!(await portfolio.exists())) return notFound(c, 'User has not joined this quest');
    const updatedPortfolio = await portfolio.buyToken(token, quantity);
    return ok(c, updatedPortfolio);
  });
  app.post('/api/quests/:questId/sell', async (c) => {
    const { questId } = c.req.param();
    const { userId, tokenId, quantity } = (await c.req.json()) as { userId?: string; tokenId?: string; quantity?: number };
    if (!isStr(userId) || !isStr(tokenId) || !quantity || quantity <= 0) return bad(c, 'userId, tokenId, and quantity are required');
    const portfolioId = `${questId}:${userId}`;
    const portfolio = new QuestPortfolioEntity(c.env, portfolioId);
    if (!(await portfolio.exists())) return notFound(c, 'User has not joined this quest');
    try {
      const updatedPortfolio = await portfolio.sellToken(tokenId, quantity);
      return ok(c, updatedPortfolio);
    } catch (e: any) {
      return bad(c, e.message);
    }
  });
  // MOCK LEADERBOARD
  app.get('/api/quests/:questId/leaderboard', (c) => {
    const mockLeaderboard: LeaderboardEntry[] = [
      { rank: 1, address: "0x1a2b...c3d4", portfolioValue: 15230.45, pnlPercent: 52.30 },
      { rank: 2, address: "0x5e6f...a7b8", portfolioValue: 13105.90, pnlPercent: 31.06 },
      { rank: 3, address: "0x9c0d...e1f2", portfolioValue: 11800.00, pnlPercent: 18.00 },
      { rank: 4, address: "0x3g4h...i5j6", portfolioValue: 9500.78, pnlPercent: -4.99 },
      { rank: 5, address: "0x7k8l...m9n0", portfolioValue: 8200.12, pnlPercent: -18.00 },
    ];
    return ok(c, mockLeaderboard);
  });

  // IMAGE UPLOAD
  app.post('/api/upload-image', async (c) => {
    try {
      const formData = await c.req.formData();
      const image = formData.get('image') as File;
      
      if (!image) {
        return bad(c, 'No image file provided');
      }

      // Validate file type
      if (!image.type.startsWith('image/')) {
        return bad(c, 'File must be an image');
      }

      // Validate file size (10MB max)
      if (image.size > 10 * 1024 * 1024) {
        return bad(c, 'File size must be less than 10MB');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = image.name.split('.').pop() || 'jpg';
      const fileName = `token-images/${timestamp}-${randomString}.${fileExtension}`;

      // Upload to R2
      await c.env.blaze_it_token_images.put(fileName, image.stream(), {
        httpMetadata: {
          contentType: image.type,
        },
      });

      // Return the public URL using R2's public URL format
      const publicUrl = `https://pub-f014c8e3a8617233380c6f6160ed8cf9.r2.dev/${fileName}`;
      
      return ok(c, { url: publicUrl, fileName });
    } catch (error) {
      console.error('Image upload error:', error);
      return bad(c, 'Failed to upload image');
    }
  });

  app.delete('/api/delete-image', async (c) => {
    try {
      const { key } = await c.req.json();
      
      if (!key) {
        return bad(c, 'Image key is required');
      }

      await c.env.blaze_it_token_images.delete(key);
      
      return ok(c, { success: true });
    } catch (error) {
      console.error('Image deletion error:', error);
      return bad(c, 'Failed to delete image');
    }
  });
}