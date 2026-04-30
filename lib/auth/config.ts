import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import type { AppUser } from '@/types'

// Static user store — replace with DB lookup when ready
const USERS: AppUser[] = [
  {
    id: '1',
    name: 'Julio Cesar',
    email: process.env.ADMIN_EMAIL ?? '',
    role: 'admin',
    buildings: [],  // empty = all buildings
  },
  {
    id: '2',
    name: 'Eddie',
    email: 'eddie@example.com',
    role: 'manager',
    buildings: [
      'PHASE I 72 Isabella',
      'PHASE II Church',
      'PHASE III Wellesley',
    ],
  },
]

// Passwords stored as env vars (plain text for now)
const PASSWORDS: Record<string, string> = {
  [process.env.ADMIN_EMAIL ?? '']: process.env.ADMIN_PASSWORD ?? '',
  'eddie@example.com': process.env.EDDIE_PASSWORD ?? 'change_me',
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? '').toLowerCase().trim()
        const password = String(credentials?.password ?? '')

        const user = USERS.find(u => u.email.toLowerCase() === email)
        if (!user) return null
        if (PASSWORDS[user.email] !== password) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          buildings: user.buildings,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as AppUser).role
        token.buildings = (user as AppUser).buildings
      }
      return token
    },
    session({ session, token }) {
      session.user.role = token.role as AppUser['role']
      session.user.buildings = token.buildings as string[]
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
})
