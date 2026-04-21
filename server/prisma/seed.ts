import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Create a demo user
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

  console.log(`Seeded user: ${user.email} (id: ${user.id})`);

  // Create a sample storyboard
  const storyboard = await prisma.storyboard.upsert({
    where: { id: "seed-storyboard-1" },
    update: {},
    create: {
      id: "seed-storyboard-1",
      userId: user.id,
      title: "Summer T-shirt Campaign",
      garmentType: "T-shirt",
      isActive: true,
      occasionPreset: "everyday",
      stylePreset: "minimal",
      backgroundThemePreset: "studio",
      modelPreset: "White / European",
      printInputKind: "image",
      printTargetGender: "Male",
      printGarmentCategory: "T-shirt",
    },
  });

  console.log(`Seeded storyboard: ${storyboard.title} (id: ${storyboard.id})`);
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
