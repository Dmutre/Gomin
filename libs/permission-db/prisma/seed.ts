import { PrismaClient } from '@my-prisma/client/permissions'
import { flattenPermissions, PERMISSIONS } from '@gomin/common'

const prisma = new PrismaClient()

async function main() {
  const allPermissions = flattenPermissions(PERMISSIONS)

  for (const permission of allPermissions) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: { description: permission.description },
      create: {
        code: permission.code,
        description: permission.description,
      },
    })
  }

  console.log('✅ Permissions seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })
