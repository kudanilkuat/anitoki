// import UserList from '@/components/UserList';

export const metadata = {
  title: `Pengguna — ${process.env.NEXT_PUBLIC_SITE_NAME || 'AnimeStream'}`,
  description: `Lihat daftar pengguna yang terdaftar di ${process.env.NEXT_PUBLIC_SITE_NAME || 'AnimeStream'} dan koleksi anime mereka.`,
};

export default function UsersPage() {
  return (
    <div className="min-h-screen bg-surface-deep text-on-surface p-8 pt-24">
      <h1 className="text-2xl font-bold mb-4">Daftar Pengguna</h1>
      <p className="text-on-surface-variant">Fitur ini sedang dalam pengembangan.</p>
    </div>
  );
}
