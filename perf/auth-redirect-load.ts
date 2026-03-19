const baseUrl = process.env.LOCAL_BASE_URL || "http://localhost:3000";
const users = Number(process.env.LOCAL_USERS || 100);

if (!Number.isInteger(users) || users <= 0) {
  throw new Error("LOCAL_USERS must be a positive integer");
}

export const config = {
  target: baseUrl,
  phases: [
    {
      name: `wave-${users}`,
      duration: 1,
      arrivalCount: users,
    },
  ],
  plugins: {
    "metrics-by-endpoint": {},
  },
  http: {
    timeout: 30,
  },
  defaults: {
    headers: {
      "user-agent": "auth-redirect-stress",
    },
  },
};

export const scenarios = [
  {
    name: "Auth Redirect Probe",
    weight: 100,
    flow: [
      { get: { url: "/profil", name: "protected-profile" } },
      { get: { url: "/auth/giris", name: "login-page" } },
      { get: { url: "/api/auth/csrf", name: "auth-csrf" } },
    ],
  },
];
