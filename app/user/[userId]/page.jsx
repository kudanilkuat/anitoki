import PublicProfile from '@/components/PublicProfile';
import { getPublicProfile } from '@/lib/profile';

export async function generateMetadata({ params }) {
  const { userId } = await params;

  const profile = await getPublicProfile(userId);
  const displayName = profile?.displayName || 'Pengguna';

  return {
    title: `Profil ${displayName}`,
    description: `Lihat koleksi bookmark komik milik ${displayName}.`,
  };
}

export default async function UserProfilePage({ params }) {
  const { userId } = await params;
  return <PublicProfile userId={userId} />;
}
