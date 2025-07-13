import { getPrismaClient } from '../utils/prisma';

export default defineEventHandler(async event => {
  try {
    const { prisma } = event.context;

    // Example: Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return {
      success: true,
      data: users,
      count: users.length,
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch users',
    });
  }
});
