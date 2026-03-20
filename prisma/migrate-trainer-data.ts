import pg from "pg";

const { Client } = pg;

async function main() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  // Check what enum values exist first
  const enumCheck = await client.query(`SELECT enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'ListingType'`);
  console.log("Current ListingType values:", enumCheck.rows.map((r: any) => r.enumlabel));

  const notifCheck = await client.query(`SELECT enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'NotificationType'`);
  console.log("Current NotificationType values:", notifCheck.rows.map((r: any) => r.enumlabel));

  // Check TRAINER listings
  const listingsCheck = await client.query(`SELECT COUNT(*) FROM "Listing" WHERE type::text = 'TRAINER'`);
  console.log("TRAINER listings count:", listingsCheck.rows[0].count);

  // Check TRAINER users
  const usersCheck = await client.query(`SELECT COUNT(*) FROM "User" WHERE "userType"::text = 'TRAINER'`);
  console.log("TRAINER users count:", usersCheck.rows[0].count);

  // Check TRAINER_VERIFIED notifications
  const notifCountCheck = await client.query(`SELECT COUNT(*) FROM "Notification" WHERE type::text = 'TRAINER_VERIFIED'`);
  console.log("TRAINER_VERIFIED notifications count:", notifCountCheck.rows[0].count);

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
