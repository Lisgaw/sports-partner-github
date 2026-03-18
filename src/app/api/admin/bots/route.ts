import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/api-utils";
import {
  buildBotAvatarUrl,
  generateBotBio,
  mapCountryCodeToLocale,
} from "@/lib/bot-automation";

// Admin yetkisi kontrolü
async function requireAdmin(userId: string | null) {
  if (!userId) return false;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } });
  return user?.isAdmin === true;
}

// GET /api/admin/bots — Bot listesi
export async function GET() {
  const userId = await getCurrentUserId();
  if (!(await requireAdmin(userId))) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const bots = await prisma.user.findMany({
    where: { isBot: true },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      bio: true,
      birthDate: true,
      gender: true,
      botPersona: true,
      cityId: true,
      city: { select: { id: true, name: true, country: { select: { id: true, name: true } } } },
      sports: { select: { id: true, name: true, icon: true } },
      createdAt: true,
      _count: { select: { listings: true, matches1: true, matches2: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: bots });
}

// POST /api/admin/bots — Yeni bot oluştur
export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!(await requireAdmin(userId))) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const body = await req.json();
  const { name, gender, birthYear, cityId, sportIds, botPersona } = body;

  if (!name || !gender || !birthYear || !cityId) {
    return NextResponse.json({ error: "name, gender, birthYear, cityId zorunlu" }, { status: 400 });
  }

  const birthDate = new Date(birthYear, 0, 1);
  const email = `bot_${Date.now()}@sporpartner.internal`;

  const city = await prisma.city.findUnique({
    where: { id: cityId },
    include: { country: { select: { code: true } } },
  });
  if (!city) {
    return NextResponse.json({ error: "Sehir bulunamadi" }, { status: 404 });
  }

  let primarySportName = "spor";
  if (Array.isArray(sportIds) && sportIds.length > 0) {
    const sport = await prisma.sport.findUnique({ where: { id: sportIds[0] }, select: { name: true } });
    if (sport?.name) primarySportName = sport.name;
  }

  const locale = mapCountryCodeToLocale(city.country.code);
  const avatarUrl = buildBotAvatarUrl({ gender, seed: `${name}-${cityId}-${primarySportName}` });
  const bio = generateBotBio({
    locale,
    sportName: primarySportName,
    cityName: city.name,
    persona: botPersona ?? null,
  });

  const bot = await prisma.user.create({
    data: {
      name,
      email,
      avatarUrl,
      bio,
      gender,
      birthDate,
      cityId,
      botPersona: botPersona ?? null,
      isBot: true,
      onboardingDone: true,
      sports: sportIds?.length ? { connect: sportIds.map((id: string) => ({ id })) } : undefined,
    },
    select: { id: true, name: true, email: true, isBot: true, botPersona: true, avatarUrl: true, bio: true },
  });

  return NextResponse.json({ success: true, data: bot }, { status: 201 });
}

// PATCH /api/admin/bots?id=xxx — Bot düzenle
export async function PATCH(req: Request) {
  const userId = await getCurrentUserId();
  if (!(await requireAdmin(userId))) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const botId = searchParams.get("id");
  if (!botId) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  const existing = await prisma.user.findUnique({
    where: { id: botId },
    select: {
      id: true,
      isBot: true,
      cityId: true,
      city: { include: { country: { select: { code: true } } } },
      sports: { select: { id: true, name: true } },
      gender: true,
      botPersona: true,
    },
  });

  if (!existing?.isBot) {
    return NextResponse.json({ error: "Bu kullanici bot degil" }, { status: 400 });
  }

  const body = await req.json();
  const {
    name,
    gender,
    birthYear,
    cityId,
    avatarUrl,
    bio,
    botPersona,
    sportIds,
    regenerateProfile,
  } = body as {
    name?: string;
    gender?: string;
    birthYear?: number;
    cityId?: string;
    avatarUrl?: string;
    bio?: string;
    botPersona?: string;
    sportIds?: string[];
    regenerateProfile?: boolean;
  };

  const updateData: Record<string, unknown> = {};

  if (typeof name === "string") updateData.name = name;
  if (typeof gender === "string") updateData.gender = gender;
  if (typeof botPersona === "string") updateData.botPersona = botPersona;
  if (typeof cityId === "string") updateData.cityId = cityId;
  if (typeof avatarUrl === "string") updateData.avatarUrl = avatarUrl;
  if (typeof bio === "string") updateData.bio = bio;
  if (typeof birthYear === "number") updateData.birthDate = new Date(birthYear, 0, 1);

  if (Array.isArray(sportIds)) {
    updateData.sports = { set: sportIds.map((id) => ({ id })) };
  }

  if (regenerateProfile) {
    const finalCityId = (typeof cityId === "string" && cityId) ? cityId : existing.cityId;
    const city = finalCityId
      ? await prisma.city.findUnique({ where: { id: finalCityId }, include: { country: { select: { code: true } } } })
      : null;

    const finalSportIds = Array.isArray(sportIds) && sportIds.length > 0
      ? sportIds
      : existing.sports.map((s) => s.id);
    const primarySport = finalSportIds.length > 0
      ? await prisma.sport.findUnique({ where: { id: finalSportIds[0] }, select: { name: true } })
      : null;

    const locale = mapCountryCodeToLocale(city?.country.code ?? existing.city?.country.code ?? null);
    const finalGender = typeof gender === "string" ? gender : existing.gender;
    const finalName = typeof name === "string" && name.trim().length > 0 ? name : undefined;

    updateData.avatarUrl = buildBotAvatarUrl({
      gender: finalGender,
      seed: `${finalName ?? existing.id}-${finalCityId ?? "city"}-${primarySport?.name ?? "sport"}`,
    });
    updateData.bio = generateBotBio({
      locale,
      sportName: primarySport?.name ?? existing.sports[0]?.name ?? "sport",
      cityName: city?.name,
      persona: typeof botPersona === "string" ? botPersona : existing.botPersona,
    });
  }

  const bot = await prisma.user.update({
    where: { id: botId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      bio: true,
      birthDate: true,
      gender: true,
      botPersona: true,
      city: { select: { id: true, name: true, country: { select: { id: true, name: true } } } },
      sports: { select: { id: true, name: true, icon: true } },
      _count: { select: { listings: true, matches1: true, matches2: true } },
    },
  });

  return NextResponse.json({ success: true, data: bot });
}

// DELETE /api/admin/bots?id=xxx — Bot sil
export async function DELETE(req: Request) {
  const userId = await getCurrentUserId();
  if (!(await requireAdmin(userId))) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const botId = searchParams.get("id");
  if (!botId) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  // Sadece bot kullanıcıları silinebilir
  const bot = await prisma.user.findUnique({ where: { id: botId }, select: { isBot: true } });
  if (!bot?.isBot) return NextResponse.json({ error: "Bu kullanıcı bot değil" }, { status: 400 });

  await prisma.user.delete({ where: { id: botId } });

  return NextResponse.json({ success: true });
}
