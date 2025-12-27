import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to dashboard or login page
  // The middleware will handle authentication check
  redirect('/dashboard');
}
