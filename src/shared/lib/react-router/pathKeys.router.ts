export const pathKeys = {
  root: "/",
  login: () => "/login",
  submission: () => "/submission",
  conference: {
    root: () => "/conference/:conferenceId",
    byId: (conferenceId: string) => `/conference/${conferenceId}`,
  },
  talk: {
    byId: (talkId: string) => `/talk/${talkId}`,
  },
} as const;
