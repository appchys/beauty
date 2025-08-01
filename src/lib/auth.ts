import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createUser, getUserByEmail } from '@/lib/firestore';

export const authOptions: NextAuthOptions = {
  secret: 'beauty-secret-2024', // Hardcoded para debugging
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
            // REGISTRO: Crear nuevo usuario
            if (!credentials.name || !credentials.role) {
              return null;
            }

            console.log('Registrando usuario:', { 
              email: credentials.email, 
              name: credentials.name, 
              role: credentials.role 
            });

            // Verificar si el usuario ya existe en Firestore
            const existingUser = await getUserByEmail(credentials.email);
            if (existingUser) {
              console.log('Usuario ya existe');
              return null;
            }

            // Crear usuario en Firestore
            const newUser = await createUser({
              email: credentials.email,
              name: credentials.name,
              role: credentials.role as 'admin' | 'client',
            });

            console.log('Usuario creado exitosamente:', newUser);

            // Si es admin, crear también su negocio
            if (credentials.role === 'admin') {
              try {
                const { createBusiness } = await import('@/lib/firestore');
                const business = await createBusiness({
                  name: `Negocio de ${credentials.name}`,
                  adminId: newUser.id,
                  description: 'Negocio de belleza y bienestar',
                  address: 'Dirección por definir',
                  phone: 'Teléfono por definir',
                  email: credentials.email,
                });
                console.log('Negocio creado exitosamente:', business);
              } catch (businessError) {
                console.error('Error creando negocio para admin:', businessError);
              }
            }

            return {
              id: newUser.id,
              email: newUser.email,
              name: newUser.name,
              role: newUser.role,
            };
          } else {
            // LOGIN: Verificar usuario existente
            console.log('Iniciando sesión:', credentials.email);
            
            // Obtener datos del usuario desde Firestore
            const user = await getUserByEmail(credentials.email);
            if (!user) {
              console.log('Usuario no encontrado en Firestore');
              return null;
            }

            console.log('Usuario encontrado:', user);

            // Por ahora, aceptamos cualquier contraseña para demostración
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
        token.role = (user as any).role;
        console.log('JWT callback - token actualizado:', { email: user.email, role: (user as any).role });
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.sub!;
        (session.user as any).role = token.role as string;
        console.log('Session callback - sesión actualizada:', { email: session.user.email, role: (session.user as any).role });
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
};
