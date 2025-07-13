import { PrismaClient } from '@prisma/client';

declare module 'nitropack' {
  interface NitroRuntimeContext {
    prisma?: PrismaClient;
  }
}

declare module 'h3' {
  interface H3EventContext {
    prisma: PrismaClient;
  }
}
