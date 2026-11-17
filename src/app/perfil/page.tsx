import type { Metadata } from 'next';
import { ProfileContent } from './ProfileContent';

export const metadata: Metadata = {
  title: 'Mi perfil',
  description: 'Guardá tus datos de contacto y tu entrega habitual en este navegador para comprar más rápido. Sin crear una cuenta.',
  robots: { index: false },
};

export default function ProfilePage() {
  return <ProfileContent />;
}
