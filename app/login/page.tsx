import { redirect } from 'next/navigation'

// Legacy /login — redirected to /auth
export default function LoginRedirect() {
  redirect('/auth')
}
