import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Seed super admin
  const superAdmin = await prisma.user.upsert({
    where: { email: "mohanraj@thebotcompany.in" },
    create: {
      email: "mohanraj@thebotcompany.in",
      name: "Mohanraj",
      role: "SUPER_ADMIN",
    },
    update: {
      role: "SUPER_ADMIN",
    },
  });
  console.log(`Super admin ready: ${superAdmin.email} (${superAdmin.id})`);

  // Seed demo user
  const passwordHash = await bcrypt.hash("demo1234", 12);
  const user = await prisma.user.upsert({
    where: { email: "demo@botstudiox.com" },
    update: {},
    create: {
      email: "demo@botstudiox.com",
      name: "Demo User",
      passwordHash,
    },
  });
  console.log(`Demo user ready: ${user.email} (${user.id})`);

  // Default system config
  const defaults = [
    { key: "default_model", value: "gemini-2.0-flash-preview-image-generation" },
    { key: "flash_enabled", value: "true" },
    { key: "pro_enabled", value: "true" },
    { key: "max_generations_per_day", value: "50" },
    { key: "rate_limit_per_minute", value: "10" },
    { key: "feature_prints", value: "true" },
    { key: "feature_multiangle", value: "true" },
    { key: "feature_saree", value: "true" },
  ];

  for (const item of defaults) {
    await prisma.systemConfig.upsert({
      where: { key: item.key },
      create: item,
      update: {},
    });
  }
  console.log("System config defaults seeded.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
