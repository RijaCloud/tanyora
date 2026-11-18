import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { getArticleBySlug } from "@/features/news/data/news.repository";
import { canReadFullArticle } from "@/features/news/lib/read-access";
import {
  createWordPressNewsArticleComment,
  getWordPressNewsArticleComments,
} from "@/lib/api/wordpress-internal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug")?.trim() || "";
    const postIdRaw = searchParams.get("postId");
    const postId = postIdRaw ? Number.parseInt(postIdRaw, 10) : undefined;

    if (!slug && !postId) {
      return NextResponse.json({ error: "Article introuvable." }, { status: 400 });
    }

    const result = await getWordPressNewsArticleComments({
      ...(slug ? { slug } : {}),
      ...(postId ? { postId } : {}),
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible de charger les commentaires.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
    }

    const payload = (await request.json()) as { slug?: string; postId?: number; content?: string };
    const slug = typeof payload?.slug === "string" ? payload.slug.trim() : "";
    const postId = typeof payload?.postId === "number" ? payload.postId : undefined;
    const content = typeof payload?.content === "string" ? payload.content.trim() : "";

    if (!slug && !postId) {
      return NextResponse.json({ error: "Article introuvable." }, { status: 400 });
    }

    if (!content) {
      return NextResponse.json({ error: "Le commentaire est vide." }, { status: 400 });
    }

    const article = slug ? await getArticleBySlug(slug) : null;
    if (slug && !article) {
      return NextResponse.json({ error: "Article introuvable." }, { status: 404 });
    }

    const hasAccess = article
      ? canReadFullArticle(article.minimumPlanRequired, true, session.planId ?? "free")
      : true;

    if (!hasAccess) {
      return NextResponse.json({ error: "Cet article necessite un abonnement superieur pour commenter." }, { status: 403 });
    }

    const resolvedPostId = article?.postId ?? postId;
    const result = await createWordPressNewsArticleComment({
      ...(slug ? { slug } : {}),
      ...(resolvedPostId ? { postId: resolvedPostId } : {}),
      wpUserId: session.wpUserId,
      email: session.email,
      authorName: session.name || session.email,
      content,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible d'envoyer le commentaire.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
