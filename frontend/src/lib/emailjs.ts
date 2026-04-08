import emailjs from '@emailjs/browser'

// Cuenta 1: invitaciones de boards
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string
const TEMPLATE_BOARD_INVITE = import.meta.env.VITE_EMAILJS_TEMPLATE_BOARD_INVITE as string

// Cuenta 2: recuperación de contraseña
const RESET_SERVICE_ID = import.meta.env.VITE_EMAILJS_RESET_SERVICE_ID as string
const RESET_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_RESET_PUBLIC_KEY as string
const TEMPLATE_RESET_PASSWORD = import.meta.env.VITE_EMAILJS_TEMPLATE_RESET_PASSWORD as string

export interface BoardInviteEmailParams {
  to_email: string
  board_name: string
  invitation_code: string
  expires_at: string
  invited_by: string
  user_email: string
}

export interface PasswordResetEmailParams {
  to_email: string
  display_name: string
  temp_password: string
}

export async function sendBoardInviteEmail(params: BoardInviteEmailParams): Promise<void> {
  await emailjs.send(SERVICE_ID, TEMPLATE_BOARD_INVITE, params as Record<string, unknown>, PUBLIC_KEY)
}

export async function sendPasswordResetEmail(params: PasswordResetEmailParams): Promise<void> {
  await emailjs.send(RESET_SERVICE_ID, TEMPLATE_RESET_PASSWORD, params as Record<string, unknown>, RESET_PUBLIC_KEY)
}
