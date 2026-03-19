const baseUrl = process.env.HOLISTIC_BASE_URL || "https://sports-partner-github.vercel.app";
const users = Number(process.env.HOLISTIC_USERS || 10);

if (!Number.isInteger(users) || users <= 0) {
  throw new Error("HOLISTIC_USERS must be a positive integer");
}

const loginFlow = (callbackPath: string) => [
  { function: "assignIdentity" },
  {
    get: {
      url: "/api/auth/csrf",
      capture: [{ json: "$.csrfToken", as: "csrfToken" }],
      name: "auth-csrf",
    },
  },
  {
    post: {
      url: "/api/auth/callback/credentials?json=true",
      form: {
        email: "{{ email }}",
        password: "{{ password }}",
        csrfToken: "{{ csrfToken }}",
        callbackUrl: `${baseUrl}${callbackPath}`,
        json: "true",
      },
      name: "auth-login",
    },
  },
];

export const config = {
  target: baseUrl,
  phases: [
    {
      name: `wave-${users}`,
      duration: 1,
      arrivalCount: users,
    },
  ],
  processor: "./holistic-load-processor.js",
  plugins: {
    "metrics-by-endpoint": {},
  },
  http: {
    timeout: 30,
  },
  defaults: {
    headers: {
      "user-agent": "holistic-artillery",
    },
  },
};

export const scenarios = [
  {
    name: "Homepage And Filtered Listings",
    weight: 22,
    flow: [
      { get: { url: "/", name: "homepage" } },
      { think: 1 },
      { function: "assignIdentity" },
      {
        get: {
          url: "/api/listings?page=1&pageSize=12&cityId={{ cityId }}&sportId={{ sportId }}",
          name: "listings-filtered",
        },
      },
      { get: { url: "/api/listings/{{ listingId }}", name: "listing-detail" } },
    ],
  },
  {
    name: "Auth Login",
    weight: 14,
    flow: [...loginFlow("/profil"), { get: { url: "/api/profile", name: "auth-profile-check" } }],
  },
  {
    name: "Feed Read",
    weight: 18,
    flow: [...loginFlow("/profil"), { get: { url: "/api/feed?page=1", name: "feed-read" } }],
  },
  {
    name: "Social Flow",
    weight: 12,
    flow: [...loginFlow("/profil"), { get: { url: "/api/posts?limit=10", name: "posts-read" } }],
  },
  {
    name: "Profile Read",
    weight: 10,
    flow: [...loginFlow("/profil"), { get: { url: "/api/profile", name: "profile-read" } }],
  },
  {
    name: "Listing Create",
    weight: 12,
    flow: [
      ...loginFlow("/ilan/olustur"),
      { function: "prepareListing" },
      {
        post: {
          url: "/api/listings",
          json: {
            type: "RIVAL",
            sportId: "{{ sportId }}",
            countryId: "{{ countryId }}",
            cityId: "{{ cityId }}",
            districtId: "{{ districtId }}",
            dateTime: "{{ listingDateTime }}",
            level: "BEGINNER",
            description: "{{ listingDescription }}",
            maxParticipants: 2,
            allowedGender: "ANY",
            isQuick: false,
            isUrgent: false,
            isAnonymous: false,
          },
          name: "listing-create",
        },
      },
    ],
  },
  {
    name: "Direct Message Write",
    weight: 12,
    flow: [
      ...loginFlow("/mesajlar"),
      {
        post: {
          url: "/api/conversations",
          json: {
            targetUserId: "{{ targetUserId }}",
          },
          capture: [{ json: "$.data.id", as: "conversationId" }],
          name: "conversation-create",
        },
      },
      { function: "prepareMessage" },
      {
        post: {
          url: "/api/conversations/{{ conversationId }}/messages",
          json: {
            content: "{{ messageContent }}",
          },
          name: "message-create",
        },
      },
    ],
  },
];