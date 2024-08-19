import bcrypt from "bcryptjs";

export const encrypt = async (password: string) => {
  return await bcrypt.hash(password, 10);
};

export const compare = async ({
  password,
  passwordHash,
}: {
  password: string;
  passwordHash: string;
}) => {
  return await bcrypt.compare(password, passwordHash);
};
