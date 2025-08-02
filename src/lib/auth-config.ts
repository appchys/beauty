import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getUserByEmail, createUser, createBusiness } from './firestore';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        name: { label: 'Name', type: 'text' },
        role: { label: 'Role', type: 'text' },
        action: { label: 'Action', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          if (credentials.action === 'signup') {
            // Registro de nuevo usuario
            if (!credentials.name || !credentials.role) {
              return null;
            }

            // Verificar si el usuario ya existe
            const existingUser = await getUserByEmail(credentials.email);
            if (existingUser) {
              return null; // Usuario ya existe
            }

            // Crear nuevo usuario
            const hashedPassword = await bcrypt.hash(credentials.password, 12);
            const newUser = await createUser({
              email: credentials.email,
              name: credentials.name,
              password: hashedPassword,
              role: credentials.role as 'admin' | 'client',
            });

            // Si es admin, crear también el negocio
            if (credentials.role === 'admin') {
              await createBusiness({
                name: `${credentials.name}'s Business`,
                adminId: newUser.id,
                description: 'Beauty salon business',
                address: '',
                phone: '',
                email: credentials.email,
              });
            }

            return {
              id: newUser.id,
              email: newUser.email,
              name: newUser.name,
              role: newUser.role,
            };
          } else {
            // Inicio de sesión
            const user = await getUserByEmail(credentials.email);
            if (!user || !credentials.password || !user.password) {
              return null;
            }

            const password = credentials.password as string;
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
              return null;
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            };
          }
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as { id?: string }).id = token.sub!;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Redirigir según el rol del usuario
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: 'beauty-secret-2024',
};
