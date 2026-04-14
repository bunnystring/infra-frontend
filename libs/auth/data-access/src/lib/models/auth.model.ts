import { User } from "./user.model";

/**
 * Modelos relacionados con la autenticación de usuarios
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Modelo para el registro de nuevos usuarios
 */
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

/**
 * Modelo de respuesta de autenticación
 */
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

/**
 * Modelo para la solicitud de refresh token
 */
export interface RefreshToken {
  refreshToken: string;
}
