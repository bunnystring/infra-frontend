/**
 * Modelo de usuario
 * Coincide con la respuesta del backend
 *
 * @author Bunnystring
 * @since 2026-02-09
 */
export interface User {
  id?: number;
  name?: string;
  username?: string;  
  email: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}
