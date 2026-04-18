import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Вход',
  description: 'Вход в систему управления задачами штаба.',
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
