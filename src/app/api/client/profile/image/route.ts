import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadProfileImage, deleteProfileImage } from '@/lib/storage';
import { updateUserProfile, getUserById } from '@/lib/firestore';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const clientId = formData.get('clientId') as string;

    console.log('Image upload request:', { clientId, fileName: file?.name, fileSize: file?.size, hasSession: !!session });

    if (!file || !clientId) {
      return NextResponse.json({ 
        error: 'File and client ID are required' 
      }, { status: 400 });
    }

    // Verificar que el usuario puede subir esta imagen
    if (session) {
      const userId = (session.user as { id?: string }).id;
      const userRole = (session.user as { role?: string }).role;
      
      if (userRole !== 'admin' && userId !== clientId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    // Para clientes locales (sin sesión), permitir la subida

    // Validar el archivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ 
        error: 'Only image files are allowed' 
      }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      return NextResponse.json({ 
        error: 'File size must be less than 5MB' 
      }, { status: 400 });
    }

    // Obtener la imagen anterior para eliminarla
    const user = await getUserById(clientId);
    const oldImageUrl = user?.profileImage;

    try {
      console.log('Uploading image to Firebase Storage...');
      // Subir nueva imagen
      const imageUrl = await uploadProfileImage(file, clientId);
      console.log('Image uploaded successfully:', imageUrl);

      // Actualizar el perfil del usuario
      await updateUserProfile(clientId, { profileImage: imageUrl });

      // Eliminar imagen anterior si existe
      if (oldImageUrl && oldImageUrl.includes('firebasestorage.googleapis.com')) {
        await deleteProfileImage(oldImageUrl);
      }

      return NextResponse.json({ 
        message: 'Profile image uploaded successfully',
        imageUrl 
      });
    } catch (uploadError) {
      console.error('Error uploading image:', uploadError);
      return NextResponse.json({ 
        error: 'Failed to upload image' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in profile image upload:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
