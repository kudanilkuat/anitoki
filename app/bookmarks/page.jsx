import BookmarkList from '@/components/BookmarkList';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Bookmark Saya',
  description: 'Daftar komik favorit yang disimpan.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function BookmarksPage() {
  return <BookmarkList />;
}
