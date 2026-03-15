import { ref, uploadBytes } from 'firebase/storage'
import { firebaseStorage } from './client'

/**
 * Sube una imagen a Firebase Storage para una estrella.
 * Path canónico: stars/{skyId}/{starId}/image (sin extensión).
 * El content-type se pasa como metadata — Storage lo usa para servir el archivo.
 * Si ya existe un objeto huérfano en ese path (upload previo sin PATCH exitoso),
 * lo sobreescribe siempre que Firestore tenga imagePath == null.
 * Retorna el path de Storage (no el download URL).
 */
export async function uploadStarImage(
  skyId: string,
  starId: string,
  file: File,
): Promise<string> {
  const path = `stars/${skyId}/${starId}/image`
  const storageRef = ref(firebaseStorage, path)
  await uploadBytes(storageRef, file, { contentType: file.type })
  return path
}
