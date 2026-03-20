UPDATE "Notification" SET type = 'VENUE_VERIFIED' WHERE type::text = 'TRAINER_VERIFIED';
SELECT COUNT(*) as remaining_trainer_verified FROM "Notification" WHERE type::text = 'TRAINER_VERIFIED';
