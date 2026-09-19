import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col justify-center text-center flex-1">
      <h1 className="text-2xl font-bold mb-4">Gears Documentation</h1>
      <p>
        Gears gives your 7 Days to Die mod a settings page, and lets your XML patches and C# read
        what the player chose. Read the{' '}
        <Link href="/docs" className="font-medium underline">
          Gears documentation
        </Link>{' '}
        or jump straight to{' '}
        <Link href="/docs/getting-started" className="font-medium underline">
          Getting Started
        </Link>
        .
      </p>
    </div>
  );
}
