import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/dashboard/repositories')
  return null
}
