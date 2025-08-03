import { prisma } from '@/config/prisma-config';
import { createCacheKey, getOrSetCache, setCache } from '@/utils/redis.utils';
import { UserRole, type Prisma } from '@prisma/client';

export const create = async (
  input: Prisma.UserCreateInput,
  role: UserRole = UserRole.STUDENT
) => {
  const user = await prisma.user.create({
    data: {
      ...input,
      role,
      isActive: true,
    },
  });
  const cacheKey = createCacheKey(`user:${user.phoneNumber}`, []);
  await setCache(cacheKey, JSON.stringify(user), 60);
  return user;
};

export const update = async (phoneNumber: string, expoPushToken: string) => {
  const user = await prisma.user.update({
    where: {
      phoneNumber,
    },
    data: {
      expoPushToken,
    },
  });
  const cacheKey = createCacheKey(`user:${phoneNumber}`, []);
  await setCache(cacheKey, JSON.stringify(user), 60 * 5);
  return user;
};

export const getByWhere = async (where: Prisma.UserWhereInput) => {
  const cacheKey = createCacheKey(`user:${where.phoneNumber}`, []);
  return await getOrSetCache(cacheKey, 60 * 5, [], async () => {
    return await prisma.user.findFirst({
      where,
    });
  });
};
