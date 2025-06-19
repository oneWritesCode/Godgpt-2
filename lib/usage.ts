import { PrismaClient, Usage } from "@prisma/client";

const prisma = new PrismaClient();

const DAILY_LIMIT = 10;
const PREMIUM_DAILY_LIMIT = 3;

export async function checkAndUpdateUsage(
  userId: string,
  isPremiumModel: boolean = false
): Promise<{
  canMakeRequest: boolean;
  remainingRequests: number;
  isPremium?: boolean;
}> {
  console.log('Checking usage for user:', userId, 'Premium:', isPremiumModel);
  
  const now = new Date();
  
  // Get user's usage record
  let usage = await prisma.usage.findUnique({
    where: { userId },
  });

  if (!usage) {
    console.log('Creating new usage record for user:', userId);
    usage = await prisma.usage.create({
      data: {
        userId,
        requestCount: 0,
        premiumCount: 0,
      },
    });
  }

  // Handle premium model usage
  if (isPremiumModel) {
    // Check if premium needs reset (24 hours from first premium request)
    if (usage.premiumResetAt && now >= usage.premiumResetAt) {
      console.log('Resetting premium usage for user:', userId);
      usage = await prisma.usage.update({
        where: { userId },
        data: {
          premiumCount: 0,
          premiumResetAt: null,
        },
      });
    }

    // Check premium limit
    if (usage.premiumCount >= PREMIUM_DAILY_LIMIT) {
      console.log('User reached premium daily limit:', userId);
      return {
        canMakeRequest: false,
        remainingRequests: 0,
        isPremium: true,
      };
    }

    // Update premium usage
    const premiumResetAt = usage.premiumResetAt || new Date(now.getTime() + 24 * 60 * 60 * 1000);

    await prisma.usage.update({
      where: { userId },
      data: {
        premiumCount: usage.premiumCount + 1,
        premiumResetAt,
      },
    });

    return {
      canMakeRequest: true,
      remainingRequests: PREMIUM_DAILY_LIMIT - (usage.premiumCount + 1),
      isPremium: true,
    };
  }

  // Handle regular model usage (existing logic)
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

  if (usage.requestCount >= DAILY_LIMIT) {
    console.log('User reached daily limit:', userId);
    return {
      canMakeRequest: false,
      remainingRequests: 0,
    };
  }

  const resetAt = usage.firstRequestAt 
    ? usage.resetAt 
    : new Date(now.getTime() + 24 * 60 * 60 * 1000);

  await prisma.usage.update({
    where: { userId },
    data: {
      requestCount: usage.requestCount + 1,
      firstRequestAt: usage.firstRequestAt || now,
      resetAt,
    },
  });

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
      premiumCount: 0,
      remainingPremium: PREMIUM_DAILY_LIMIT,
      resetAt: null,
      premiumResetAt: null,
    };
  }

  const now = new Date();
  
  // Check regular reset
  const needsReset = usage.firstRequestAt && usage.resetAt && now >= usage.resetAt;
  // Check premium reset
  const needsPremiumReset = usage.premiumResetAt && now >= usage.premiumResetAt;

  if (needsReset || needsPremiumReset) {
    const updateData: Partial<Usage> = {};
    
    if (needsReset) {
      updateData.requestCount = 0;
      updateData.firstRequestAt = null;
      updateData.resetAt = null;
    }
    
    if (needsPremiumReset) {
      updateData.premiumCount = 0;
      updateData.premiumResetAt = null;
    }

    await prisma.usage.update({
      where: { userId },
      data: updateData,
    });

    return {
      requestCount: needsReset ? 0 : usage.requestCount,
      remainingRequests: needsReset ? DAILY_LIMIT : Math.max(0, DAILY_LIMIT - usage.requestCount),
      premiumCount: needsPremiumReset ? 0 : usage.premiumCount,
      remainingPremium: needsPremiumReset ? PREMIUM_DAILY_LIMIT : Math.max(0, PREMIUM_DAILY_LIMIT - usage.premiumCount),
      resetAt: needsReset ? null : usage.resetAt,
      premiumResetAt: needsPremiumReset ? null : usage.premiumResetAt,
    };
  }

  return {
    requestCount: usage.requestCount,
    remainingRequests: Math.max(0, DAILY_LIMIT - usage.requestCount),
    premiumCount: usage.premiumCount,
    remainingPremium: Math.max(0, PREMIUM_DAILY_LIMIT - usage.premiumCount),
    resetAt: usage.resetAt,
    premiumResetAt: usage.premiumResetAt,
  };
}