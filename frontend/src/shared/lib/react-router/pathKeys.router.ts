export const pathKeys = {
  root: "/",
  login: "/login",
  submission: "/submission",
  jury: "/jury",
  dashboard: "/dashboard",
  admin: "/admin",
  changePassword: "/change-password",
  
  conference: {
    route: "/conference/:conferenceId",
    build: (conferenceId: string) => `/conference/${conferenceId}`,
  },
  
  talk: {
    route: "/talk/:talkId",
    build: (talkId: string) => `/talk/${talkId}`,
  },
} as const;