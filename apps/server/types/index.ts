import { z } from "zod";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatar: {
    public_id: string;
    url: string;
  };
  role: string;
  isVerified: boolean;
  courses: Array<{
    courseId: string;
  }>;
  comparePassword: (password: string) => Promise<boolean>;
  SignAccessToken: () => string;
  SignRefreshToken: () => string;
}

export const RegisterUser = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string(),
  avatar: z.string().optional(),
});

export type RegisterUser = z.infer<typeof RegisterUser>;

export const ActivateUser = z.object({
  activationToken: z.string(),
  activationCode: z.string(),
});

export type ActivateUser = z.infer<typeof ActivateUser>;

export const LoginUser = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type LoginUser = z.infer<typeof LoginUser>;
