import jwt from "jsonwebtoken";

const generateJWT = async (payload: any): Promise<string> => {
  const jwtSecret = process.env.JWT_SECRET_KEY;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET_KEY is not defined in environment variables");
  }

  const token = jwt.sign(payload, jwtSecret, { expiresIn: "10d" });
  return token;
};

export default generateJWT;
