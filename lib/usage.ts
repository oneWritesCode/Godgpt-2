import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DAILY_LIMIT = 10;

export async function checkAndUpdateUsage(userId: string): Promise<{
  canMakeRequest: boolean;
  remainingRequests: number;
}> {
  console.log('Checking usage for user:', userId);
  
  const now = new Date();
  
  // Get user's usage record
  let usage = await prisma.usage.findUnique({
    where: { userId },
  });

  if (!usage) {
    console.log('Creating new usage record for user:', userId);
    // Create new usage record
    usage = await prisma.usage.create({
      data: {
        userId,
        requestCount: 0,
      },
    });
  }

  // Check if we need to reset (24 hours from first request)
  if (usage.firstRequestAt && usage.resetAt && now >= usage.resetAt) {
    console.log('Resetting usage for user:', userId);
    usage = await prisma.usage.update({
      where: { userId },
      data: {
        requestCount: 0,
        firstRequestAt: null,
        resetAt: null,
      },
    });
  }

  // Check if user can make request
  if (usage.requestCount >= DAILY_LIMIT) {
    console.log('User reached daily limit:', userId);
    return {
      canMakeRequest: false,
      remainingRequests: 0,
    };
  }

  // Update usage count
  const resetAt = usage.firstRequestAt 
    ? usage.resetAt 
    : new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

  await prisma.usage.update({
    where: { userId },
    data: {
      requestCount: usage.requestCount + 1,
      firstRequestAt: usage.firstRequestAt || now,
      resetAt,
    },
  });

  console.log('Updated usage for user:', userId, 'New count:', usage.requestCount + 1);

  return {
    canMakeRequest: true,
    remainingRequests: DAILY_LIMIT - (usage.requestCount + 1),
  };
}

export async function getUserUsage(userId: string) {
  const usage = await prisma.usage.findUnique({
    where: { userId },
  });

  if (!usage) {
    return {
      requestCount: 0,
      remainingRequests: DAILY_LIMIT,
      resetAt: null,
    };
  }

  const now = new Date();
  const needsReset = usage.firstRequestAt && usage.resetAt && now >= usage.resetAt;

  if (needsReset) {
    await prisma.usage.update({
      where: { userId },
      data: {
        requestCount: 0,
        firstRequestAt: null,
        resetAt: null,
      },
    });

    return {
      requestCount: 0,
      remainingRequests: DAILY_LIMIT,
      resetAt: null,
    };
  }

  return {
    requestCount: usage.requestCount,
    remainingRequests: Math.max(0, DAILY_LIMIT - usage.requestCount),
    resetAt: usage.resetAt,
  };
}