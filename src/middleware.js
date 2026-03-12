import { withAuth } from "next-auth/middleware"

export default withAuth({
  // Matches the pages config in `[...nextauth]`
  pages: {
    signIn: '/login',
  },
})

export const config = {
  // Protects the dashboard (root path), API routes could also be protected here
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico|api/auth).*)"]
}
