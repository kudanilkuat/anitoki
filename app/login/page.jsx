import LoginClient from './LoginClient';

export const metadata = {
  title: `Masuk`,
  description: 'Masuk untuk menyimpan bookmark dan menikmati fitur lainnya di situs kami.',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function LoginPage() {
  return <LoginClient />;
}
