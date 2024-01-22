import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import otpGenerator from "otp-generator";
import dotenv from "dotenv";

// baraye hash kardane password o etebar sanjie an
const hashString = (pass: string) => {
  return bcrypt.hashSync(pass, 10);
};
const compareHashString = (pass: string, hashedPass: string) => {
  return bcrypt.compareSync(pass, hashedPass);
};

dotenv.config({ path: __dirname + "./../../.env" });
// baraye ijade token az algorithm e RS256 estefade shode chon toole tokene ijad shode va amniatesh bishtare

const accessTokenGen = (string: string) => {
  return jwt.sign(
    { userId: string },
    `${process.env.ACCESS_TOKEN_PRIVATE_KEY}`,
    {
      expiresIn: 1200,
      algorithm: "RS256",
      jwtid: `${process.env.ACCESS_TOKEN_PUBLIC_KEY}`,
    }
  );
};

const refreshTokenGen = (string: string) => {
  return jwt.sign(
    { userId: string },
    `${process.env.REFRESH_TOKEN_PRIVATE_KEY}`,
    {
      expiresIn: 31536000,
      algorithm: "RS256",
      jwtid: `${process.env.REFRESH_TOKEN_PUBLIC_KEY}`,
    }
  );
};

const verifyAccessToken = (token: string) => {
  return jwt.verify(token, `${process.env.ACCESS_TOKEN_PRIVATE_KEY}`);
};

const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, `${process.env.REFRESH_TOKEN_PRIVATE_KEY}`);
};


// baraye ijade one time password
const otpGen = () => {
  return otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });
};

// baraye ijade id baraye user hayi ke login nakarde and o bekhahand az barkhi emkanat bedune login estefade konand
const idGen = () => {
  return otpGenerator.generate(20);
};

// baraye ijade refer code
const referGen = () => otpGenerator.generate(8, { specialChars: false });

export {
  hashString,
  compareHashString,
  accessTokenGen,
  refreshTokenGen,
  verifyAccessToken,
  verifyRefreshToken,
  otpGen,
  idGen,
  referGen,
};
