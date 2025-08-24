import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { createUser, getUserByEmail, getUserByPhone } from '@/lib/firestore';

// Helper function para detectar si el input es email o teléfono
function isEmail(input: string): boolean {
  return input.includes('@') && input.includes('.');
}

// Helper function para obtener usuario por email o teléfono
async function getUserByEmailOrPhone(input: string) {
  if (isEmail(input)) {
    return await getUserByEmail(input);
  } else {
    return await getUserByPhone(input);
  }
}

export const authOptions: NextAuthOptions = {
  secret: 'beauty-secret-2024', // Hardcoded para debugging
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email o Celular', type: 'text' },
        password: { label: 'Password', type: 'password' },
        name: { label: 'Name', type: 'text' },
        phone: { label: 'Phone', type: 'text' },
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
              phone: credentials.phone,
              role: credentials.role 
            });

            // Verificar si el usuario ya existe en Firestore
            const existingUser = await getUserByEmail(credentials.email);
            if (existingUser) {
              console.log('Usuario ya existe');
              return null;
            }

            // Hashear la contraseña
            const hashedPassword = await bcrypt.hash(credentials.password, 12);

            // Crear usuario en Firestore
            const newUser = await createUser({
              email: credentials.email,
              name: credentials.name,
              phone: credentials.phone,
              password: hashedPassword,
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
            
            // Obtener datos del usuario desde Firestore (por email o teléfono)
            const user = await getUserByEmailOrPhone(credentials.email);
            if (!user || !user.password) {
              console.log('Usuario no encontrado en Firestore o sin contraseña');
              return null;
            }

            console.log('Usuario encontrado:', user);

            // Verificar la contraseña
            const isValidPassword = await bcrypt.compare(credentials.password, user.password);
            if (!isValidPassword) {
              console.log('Contraseña incorrecta');
              return null;
            }

            return {
              id: user.id,
              email: user.email || user.phone, // Devolver email si existe, sino el teléfono
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
        // Cambiar de (user as any).role a:
        token.role = (user as { role?: string }).role;
        console.log('JWT callback - token actualizado:', { email: user.email, role: (user as { role?: string }).role });
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        // Cambiar de (session.user as any) a:
        (session.user as { id?: string }).id = token.sub!;
        (session.user as { role?: string }).role = token.role as string;
        console.log('Session callback - sesión actualizada:', { email: session.user.email, role: (session.user as { role?: string }).role });
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
