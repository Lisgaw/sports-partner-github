import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_PREFIX = "sre.holistic";
const DEFAULT_USER_COUNT = 650;
const DEFAULT_PASSWORD = "BenchPass123!";
const DEFAULT_LISTING_COUNT = 120;
const DEFAULT_POST_COUNT = 180;

function chunk(items, size) {
  const result = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

function benchEmail(prefix, index) {
  return `${prefix}+u${String(index).padStart(4, "0")}@example.com`;
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function main() {
  const prefix = process.env.HOLISTIC_BENCH_PREFIX ?? DEFAULT_PREFIX;
  const userCount = Number(process.env.HOLISTIC_BENCH_USER_COUNT ?? DEFAULT_USER_COUNT);
  const password = process.env.HOLISTIC_BENCH_PASSWORD ?? DEFAULT_PASSWORD;
  const listingCount = Number(process.env.HOLISTIC_BENCH_LISTING_COUNT ?? DEFAULT_LISTING_COUNT);
  const postCount = Number(process.env.HOLISTIC_BENCH_POST_COUNT ?? DEFAULT_POST_COUNT);
  const fixturePath = path.resolve(process.cwd(), process.env.HOLISTIC_BENCH_FIXTURE ?? "perf/holistic-bench-fixture.json");

  if (!Number.isInteger(userCount) || userCount < 500) {
    throw new Error("HOLISTIC_BENCH_USER_COUNT must be an integer >= 500");
  }

  const [sport, district] = await Promise.all([
    prisma.sport.findFirst({ orderBy: { name: "asc" } }),
    prisma.district.findFirst({
      orderBy: { name: "asc" },
      include: { city: { include: { country: true } } },
    }),
  ]);

  if (!sport || !district?.city?.country) {
    throw new Error("Required sport/location seed data not found in database");
  }

  const city = district.city;
  const country = city.country;
  const passwordHash = await bcrypt.hash(password, 12);
  const sinkEmail = `${prefix}+sink@example.com`;

  const sinkUser = await prisma.user.upsert({
    where: { email: sinkEmail },
    update: {
      name: "Holistic Bench Sink",
      passwordHash,
      birthDate: new Date("1990-01-01T00:00:00.000Z"),
      onboardingDone: true,
      userType: "INDIVIDUAL",
      userLevel: "BEGINNER",
      cityId: city.id,
      districtId: district.id,
      preferredTime: "evening",
      preferredStyle: "casual",
      whoCanMessage: "EVERYONE",
      profileVisibility: "EVERYONE",
      isPrivateProfile: false,
      sports: { set: [{ id: sport.id }] },
    },
    create: {
      email: sinkEmail,
      name: "Holistic Bench Sink",
      passwordHash,
      birthDate: new Date("1990-01-01T00:00:00.000Z"),
      onboardingDone: true,
      userType: "INDIVIDUAL",
      userLevel: "BEGINNER",
      cityId: city.id,
      districtId: district.id,
      preferredTime: "evening",
      preferredStyle: "casual",
      whoCanMessage: "EVERYONE",
      profileVisibility: "EVERYONE",
      isPrivateProfile: false,
      sports: { connect: [{ id: sport.id }] },
    },
    select: { id: true, email: true },
  });

  const userSeeds = Array.from({ length: userCount }, (_, offset) => ({
    index: offset + 1,
    email: benchEmail(prefix, offset + 1),
    name: `Holistic Bench ${offset + 1}`,
    gender: offset % 2 === 0 ? "MALE" : "FEMALE",
  }));

  for (const batch of chunk(userSeeds, 25)) {
    await Promise.all(
      batch.map((seed) =>
        prisma.user.upsert({
          where: { email: seed.email },
          update: {
            name: seed.name,
            passwordHash,
            birthDate: new Date("1994-01-01T00:00:00.000Z"),
            onboardingDone: true,
            userType: "INDIVIDUAL",
            userLevel: "BEGINNER",
            cityId: city.id,
            districtId: district.id,
            gender: seed.gender,
            preferredTime: "evening",
            preferredStyle: "casual",
            whoCanMessage: "EVERYONE",
            profileVisibility: "EVERYONE",
            isPrivateProfile: false,
            isBanned: false,
            sports: { set: [{ id: sport.id }] },
          },
          create: {
            email: seed.email,
            name: seed.name,
            passwordHash,
            birthDate: new Date("1994-01-01T00:00:00.000Z"),
            onboardingDone: true,
            userType: "INDIVIDUAL",
            userLevel: "BEGINNER",
            cityId: city.id,
            districtId: district.id,
            gender: seed.gender,
            preferredTime: "evening",
            preferredStyle: "casual",
            whoCanMessage: "EVERYONE",
            profileVisibility: "EVERYONE",
            isPrivateProfile: false,
            sports: { connect: [{ id: sport.id }] },
          },
        })
      )
    );
  }

  const benchUsers = await prisma.user.findMany({
    where: {
      email: {
        in: userSeeds.map((seed) => seed.email),
      },
    },
    orderBy: { email: "asc" },
    select: { id: true, email: true, name: true },
  });

  const benchUserIds = benchUsers.map((user) => user.id);
  const seededUserIds = benchUsers.slice(0, Math.max(listingCount, postCount)).map((user) => user.id);

  await prisma.post.deleteMany({
    where: {
      userId: { in: seededUserIds },
      content: { startsWith: `[${prefix}]` },
    },
  });

  await prisma.response.deleteMany({
    where: { listing: { userId: { in: seededUserIds }, description: { startsWith: `[${prefix}]` } } },
  });

  await prisma.listing.deleteMany({
    where: {
      userId: { in: seededUserIds },
      description: { startsWith: `[${prefix}]` },
    },
  });

  const now = Date.now();
  await prisma.listing.createMany({
    data: benchUsers.slice(0, listingCount).map((user, index) => ({
      userId: user.id,
      sportId: sport.id,
      countryId: country.id,
      cityId: city.id,
      districtId: district.id,
      type: "RIVAL",
      status: "OPEN",
      dateTime: new Date(now + (index + 1) * 60 * 60 * 1000),
      level: "BEGINNER",
      description: `[${prefix}] feed listing ${index + 1}`,
      maxParticipants: 2,
      allowedGender: "ANY",
      isQuick: false,
      isUrgent: false,
      isAnonymous: false,
      isRecurring: false,
    })),
  });

  await prisma.post.createMany({
    data: benchUsers.slice(0, postCount).map((user, index) => ({
      userId: user.id,
      content: `[${prefix}] social post ${index + 1}`,
      images: [],
    })),
  });

  const listingIds = (
    await prisma.listing.findMany({
      where: {
        userId: { in: seededUserIds },
        description: { startsWith: `[${prefix}] feed listing` },
        status: "OPEN",
      },
      orderBy: { createdAt: "desc" },
      select: { id: true },
      take: listingCount,
    })
  ).map((listing) => listing.id);

  await ensureDir(path.dirname(fixturePath));
  await fs.writeFile(
    fixturePath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        prefix,
        password,
        targetUserId: sinkUser.id,
        location: {
          sportId: sport.id,
          sportName: sport.name,
          countryId: country.id,
          countryName: country.name,
          cityId: city.id,
          cityName: city.name,
          districtId: district.id,
          districtName: district.name,
        },
        users: benchUsers.map((user) => ({
          id: user.id,
          email: user.email,
          name: user.name,
        })),
        listingIds,
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(
    JSON.stringify(
      {
        fixturePath,
        userCount: benchUsers.length,
        listingCount: listingIds.length,
        targetUserId: sinkUser.id,
        sportId: sport.id,
        cityId: city.id,
        districtId: district.id,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });