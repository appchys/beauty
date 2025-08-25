import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Sube una imagen de perfil a Firebase Storage
 * @param file - Archivo de imagen
 * @param userId - ID del usuario
 * @returns Promise<string> - URL de descarga de la imagen
 */
export async function uploadProfileImage(file: File, userId: string): Promise<string> {
  try {
    console.log('Starting upload for user:', userId, 'file:', file.name);
    
    // Crear referencia con el ID del usuario
    const imageRef = ref(storage, `profile-images/${userId}/${Date.now()}_${file.name}`);
    console.log('Created storage reference:', imageRef.fullPath);
    
    // Subir el archivo
    console.log('Uploading file...');
    const snapshot = await uploadBytes(imageRef, file);
    console.log('Upload completed, getting download URL...');
    
    // Obtener la URL de descarga
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Download URL obtained:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw new Error(`Error al subir la imagen de perfil: ${error}`);
  }
}

/**
 * Elimina una imagen de perfil anterior de Firebase Storage
 * @param imageUrl - URL de la imagen a eliminar
 */
export async function deleteProfileImage(imageUrl: string): Promise<void> {
  try {
    // Extraer la ruta de la URL de Firebase Storage
    if (imageUrl.includes('firebasestorage.googleapis.com')) {
      // Extraer el path después de '/o/' y antes de '?'
      const pathMatch = imageUrl.match(/\/o\/(.+?)\?/);
      if (pathMatch) {
        const path = decodeURIComponent(pathMatch[1]);
        const imageRef = ref(storage, path);
        await deleteObject(imageRef);
      }
    }
  } catch (error) {
    console.error('Error deleting profile image:', error);
    // No lanzamos error aquí porque la eliminación puede fallar si el archivo ya no existe
  }
}

/**
 * Comprime una imagen antes de subirla
 * @param file - Archivo de imagen original
 * @param maxWidth - Ancho máximo deseado
 * @param maxHeight - Alto máximo deseado
 * @param quality - Calidad de compresión (0-1)
 * @returns Promise<File> - Archivo comprimido
 */
export function compressImage(
  file: File, 
  maxWidth: number = 400, 
  maxHeight: number = 400, 
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calcular nuevas dimensiones manteniendo la proporción
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Dibujar imagen redimensionada
      ctx?.drawImage(img, 0, 0, width, height);

      // Convertir a blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Error al comprimir la imagen'));
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => reject(new Error('Error al cargar la imagen'));
    img.src = URL.createObjectURL(file);
  });
}
