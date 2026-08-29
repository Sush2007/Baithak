import ProfileSetupPageClient from "./ProfileSetupPageClient";

export const metadata = {
  title: 'Profile Setup',
  description: 'Complete your profile setup to join the Baithak student discussion circle.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfileSetupPage() {
  const siteKey = process.env.YOUR_PUBLIC_SITEKEY?.trim() || "0x4AAAAAAEfUxjs1vPVT9wmZ";
  return <ProfileSetupPageClient siteKey={siteKey} />;
}
