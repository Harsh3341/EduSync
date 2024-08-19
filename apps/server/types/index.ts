import { z } from "zod";
import { activateUser } from "../controllers/user.controller";

export interface User {
  name: string;
  email: string;
  password: string;
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
