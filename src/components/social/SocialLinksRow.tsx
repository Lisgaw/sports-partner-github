"use client";

import type { ReactNode } from "react";

type SocialPlatform = "instagram" | "tiktok" | "facebook" | "twitterX" | "telegram" | "whatsapp" | "youtube" | "linkedin" | "discord" | "twitch" | "snapchat" | "litmatch";

type SocialLinks = Partial<Record<SocialPlatform, string | null | undefined>>;

const ICON_SIZE = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
};

function InstagramIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>;
}

function TiktokIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.79a8.18 8.18 0 004.78 1.52V6.85a4.85 4.85 0 01-1.01-.16z"/></svg>;
}

function FacebookIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;
}

function XIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
}

function TelegramIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>;
}

function WhatsappIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884"/></svg>;
}

function YoutubeIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;
}

function LinkedinIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>;
}

function DiscordIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>;
}

function TwitchIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>;
}

function SnapchatIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.135-.045.27-.06.376-.06.249 0 .464.108.494.319.045.359-.029.705-.29.885-.301.24-1.188.405-1.83.48-.dead-.06-.345.195-.345.375.015.15.045.3.075.42.375 1.68 1.96 2.925 3.434 3.315.66.18 1.35-.06 1.904.12.33.135.54.315.54.6v.06c-.015.45-.36.734-.87.884-.15.045-.315.075-.45.09-.255.03-.795.104-.96.285-.12.15-.06.375.075.645.15.285.345.57.345.915 0 .405-.254.75-.735.885-.765.225-1.334-.105-2.159-.435-.6-.225-1.334-.51-2.204-.51-.195 0-.405.015-.6.075-.285.09-.555.225-.855.36-.885.435-1.875.915-3.225.915-.075 0-.149 0-.254-.015-1.365-.09-2.34-.57-3.22-1.005-.27-.135-.54-.27-.825-.36-.195-.06-.405-.075-.6-.075-.87 0-1.62.285-2.204.51-.84.33-1.395.66-2.16.435-.48-.135-.734-.48-.734-.885 0-.33.18-.63.345-.915.135-.27.195-.495.075-.645-.165-.18-.705-.255-.96-.285-.149-.015-.315-.045-.464-.09-.495-.15-.854-.434-.854-.884v-.06c0-.285.21-.465.54-.6.554-.18 1.244.06 1.904-.12 1.47-.39 3.059-1.635 3.434-3.315.03-.12.06-.27.075-.42 0-.18-.105-.435-.345-.375-.64-.075-1.529-.24-1.83-.48-.254-.18-.33-.525-.284-.885.029-.21.248-.319.493-.319.106 0 .241.015.376.06.374.181.733.285 1.033.301.198 0 .326-.045.401-.09l-.031-.51c-.104-1.628-.229-3.654.3-4.847C7.858 1.069 11.215.793 12.206.793z"/></svg>;
}

function LitmatchIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 2c1.79 0 3.45.497 4.863 1.356L5.356 16.863A7.963 7.963 0 014 12c0-4.418 3.582-8 8-8zm0 16c-1.79 0-3.45-.497-4.863-1.356L18.644 7.137A7.963 7.963 0 0120 12c0 4.418-3.582 8-8 8z"/></svg>;
}

const PLATFORM_CONFIG: Record<SocialPlatform, { label: string; color: string; icon: ReactNode; toUrl: (value: string) => string | null }> = {
  instagram: { label: "Instagram", color: "bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] text-white", icon: <InstagramIcon />, toUrl: (value) => `https://instagram.com/${value.replace(/^@/, "")}` },
  tiktok: { label: "TikTok", color: "bg-black text-white", icon: <TiktokIcon />, toUrl: (value) => `https://tiktok.com/@${value.replace(/^@/, "")}` },
  facebook: { label: "Facebook", color: "bg-[#1877F2] text-white", icon: <FacebookIcon />, toUrl: (value) => `https://facebook.com/${value}` },
  twitterX: { label: "X", color: "bg-black text-white dark:bg-white dark:text-black", icon: <XIcon />, toUrl: (value) => `https://x.com/${value.replace(/^@/, "")}` },
  telegram: { label: "Telegram", color: "bg-[#26A5E4] text-white", icon: <TelegramIcon />, toUrl: (value) => `https://t.me/${value.replace(/^@/, "")}` },
  whatsapp: { label: "WhatsApp", color: "bg-[#25D366] text-white", icon: <WhatsappIcon />, toUrl: (value) => {
    const digits = value.replace(/[^0-9]/g, "");
    return digits ? `https://wa.me/${digits}` : null;
  } },
  youtube: { label: "YouTube", color: "bg-[#FF0000] text-white", icon: <YoutubeIcon />, toUrl: (value) => `https://youtube.com/@${value.replace(/^@/, "")}` },
  linkedin: { label: "LinkedIn", color: "bg-[#0A66C2] text-white", icon: <LinkedinIcon />, toUrl: (value) => `https://linkedin.com/in/${value}` },
  discord: { label: "Discord", color: "bg-[#5865F2] text-white", icon: <DiscordIcon />, toUrl: (value) => `https://discord.com/users/${value}` },
  twitch: { label: "Twitch", color: "bg-[#9146FF] text-white", icon: <TwitchIcon />, toUrl: (value) => `https://twitch.tv/${value}` },
  snapchat: { label: "Snapchat", color: "bg-[#FFFC00] text-black", icon: <SnapchatIcon />, toUrl: (value) => `https://snapchat.com/add/${value}` },
  litmatch: { label: "Litmatch", color: "bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] text-white", icon: <LitmatchIcon />, toUrl: (value) => `https://litmatch.net/user/${value}` },
};

export default function SocialLinksRow({
  links,
  size = "sm",
  className = "",
}: {
  links: SocialLinks;
  size?: "sm" | "md";
  className?: string;
}) {
  const items = (Object.keys(PLATFORM_CONFIG) as SocialPlatform[])
    .map((key) => {
      const rawValue = links[key]?.trim();
      if (!rawValue) return null;

      const config = PLATFORM_CONFIG[key];
      const href = config.toUrl(rawValue);
      if (!href) return null;

      return {
        key,
        href,
        label: config.label,
        color: config.color,
        icon: config.icon,
      };
    })
    .filter(Boolean) as Array<{ key: string; href: string; label: string; color: string; icon: ReactNode }>;

  if (items.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {items.map((item) => (
        <a
          key={item.key}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={item.label}
          title={item.label}
          className={`${ICON_SIZE[size]} inline-flex items-center justify-center rounded-2xl ${item.color} shadow-sm ring-1 ring-black/5 transition-transform duration-150 hover:-translate-y-0.5`}
        >
          {item.icon}
        </a>
      ))}
    </div>
  );
}