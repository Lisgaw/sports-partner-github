-- Add VK social platform to User model
-- vk column already exists from 20260228154605_add_social_links migration, only vkVisibility is new
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "vk" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "vkVisibility" "PrivacyLevel" NOT NULL DEFAULT 'EVERYONE';
