import Link from 'next/link';

export default function Custom500() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto max-w-lg text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
          500
        </p>
        <h1 className="mt-3 text-4xl font-bold">Erreur serveur</h1>
        <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-400">
          Une erreur inattendue est survenue. Veuillez reessayer dans quelques instants.
        </p>
        <Link
          href="/dashboard"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-md bg-blue-600 px-5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
