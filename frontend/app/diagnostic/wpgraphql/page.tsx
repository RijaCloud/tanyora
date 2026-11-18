import { getUserFacingErrorMessage } from "@/lib/errors/user-facing";
import { wpGraphqlRequest } from "@/lib/graphql/client";

type StatusPayload = {
  posts: {
    nodes: Array<{
      id: string;
      slug: string;
      title: string;
      date: string;
    }>;
  };
};

export const dynamic = "force-dynamic";

export default async function WpGraphqlDiagnosticPage() {
  const endpoint = process.env.WP_GRAPHQL_URL ?? "not-configured";

  try {
    const data = await wpGraphqlRequest<StatusPayload>(
      `
        query WpGraphqlDiagnostic {
          posts(first: 5) {
            nodes {
              id
              slug
              title
              date
            }
          }
        }
      `,
      undefined,
      { noStore: true },
    );

    return (
      <main className="mx-auto max-w-4xl space-y-6 px-6 py-10">
        <header className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">WPGraphQL</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Connexion WordPress OK</h1>
          <p className="mt-2 text-sm text-slate-700">Endpoint utilise: {endpoint}</p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Derniers posts recuperes</h2>
          <ul className="space-y-3">
            {data.posts.nodes.map((post) => (
              <li key={post.id} className="rounded-xl border border-slate-100 px-4 py-3">
                <p className="font-semibold text-slate-900">{post.title}</p>
                <p className="text-sm text-slate-500">
                  {post.slug} {"·"} {new Date(post.date).toLocaleString("fr-FR")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    );
  } catch (error) {
    const message = getUserFacingErrorMessage(error, "Impossible de joindre WPGraphQL.");

    return (
      <main className="mx-auto max-w-4xl space-y-6 px-6 py-10">
        <header className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-rose-700">WPGraphQL</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Connexion WordPress en echec</h1>
          <p className="mt-2 text-sm text-slate-700">Endpoint configure: {endpoint}</p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-2 text-lg font-semibold text-slate-900">Erreur recue</h2>
          <pre className="overflow-auto rounded-xl bg-slate-950 p-4 text-sm text-slate-100">{message}</pre>
        </section>
      </main>
    );
  }
}

