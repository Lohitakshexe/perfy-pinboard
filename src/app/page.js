import Board from '@/components/Board';

export const metadata = {
  title: 'Digital Pinboard',
  description: 'A beautiful digital pinboard synced with Supabase',
};

export default function Home() {
  return (
    <main style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Board />
    </main>
  );
}
