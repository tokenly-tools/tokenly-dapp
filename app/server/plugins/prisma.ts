import { PrismaD1 } from '@prisma/adapter-d1'
import { PrismaClient } from '@prisma/client/edge'

export default defineNitroPlugin(nitroApp => {
  nitroApp.hooks.hook('request', event => {
    const { cloudflare } = event.context
    const adapter = new PrismaD1(cloudflare?.env?.DB)
    const prisma = new PrismaClient({ adapter })
    event.context.prisma = prisma
  })
})
