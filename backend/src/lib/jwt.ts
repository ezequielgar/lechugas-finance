import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

const ACCESS_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)
const REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!)

export async function signAccessToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(ACCESS_SECRET)
}

export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(REFRESH_SECRET)
}

export async function verifyAccessToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, ACCESS_SECRET)
  return payload
}

export async function verifyRefreshToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, REFRESH_SECRET)
  return payload
}
