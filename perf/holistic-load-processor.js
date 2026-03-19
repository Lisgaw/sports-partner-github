const fs = require("node:fs");
const path = require("node:path");

const fixturePath = path.resolve(process.cwd(), process.env.HOLISTIC_BENCH_FIXTURE || "perf/holistic-bench-fixture.json");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
let sessionCursor = 0;

function nextUser() {
  const user = fixture.users[sessionCursor % fixture.users.length];
  sessionCursor += 1;
  return user;
}

function isoPlusHours(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function setCommonVars(context, user) {
  const listingId = fixture.listingIds[(sessionCursor - 1) % fixture.listingIds.length];
  context.vars.email = user.email;
  context.vars.password = fixture.password;
  context.vars.userId = user.id;
  context.vars.listingId = listingId;
  context.vars.targetUserId = fixture.targetUserId;
  context.vars.sportId = fixture.location.sportId;
  context.vars.cityId = fixture.location.cityId;
  context.vars.districtId = fixture.location.districtId;
  context.vars.countryId = fixture.location.countryId;
  context.vars.feedPage = 1;
}

module.exports = {
  assignIdentity(context, _events, done) {
    const user = nextUser();
    setCommonVars(context, user);
    done();
  },

  prepareListing(context, _events, done) {
    context.vars.listingDateTime = isoPlusHours(6 + (sessionCursor % 24));
    context.vars.listingDescription = `[holistic-write] ${context.vars.email} ${Date.now()}`;
    done();
  },

  prepareMessage(context, _events, done) {
    context.vars.messageContent = `[holistic-message] ${context.vars.email} ${Date.now()}`;
    done();
  },
};