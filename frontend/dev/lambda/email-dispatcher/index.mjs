import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const ses = new SESv2Client({});

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function json(statusCode, body) {
  return {
    statusCode,
    body: JSON.stringify(body),
  };
}

function getHeader(headers, key) {
  if (!headers || typeof headers !== "object") return "";
  const lowerKey = key.toLowerCase();
  for (const [headerKey, value] of Object.entries(headers)) {
    if (headerKey.toLowerCase() === lowerKey) {
      return String(value || "");
    }
  }
  return "";
}

function safeString(value) {
  return String(value || "").trim();
}

function escapeHtml(input) {
  return String(input || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeUrl(value) {
  const candidate = safeString(value);
  if (!candidate) return "";

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    return "";
  }

  return "";
}

function getDefaultSiteOrigin() {
  const envCandidates = [
    process.env.PLATFORM_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.APP_BASE_URL,
  ];

  for (const candidate of envCandidates) {
    const resolved = safeUrl(candidate);
    if (!resolved) continue;

    try {
      return new URL(resolved).origin;
    } catch {
      // Ignore invalid candidates and keep walking fallbacks.
    }
  }

  return "https://2424.mg";
}

function getSiteOrigin(...candidates) {
  for (const candidate of candidates) {
    const resolved = safeUrl(candidate);
    if (!resolved) continue;

    try {
      return new URL(resolved).origin;
    } catch {
      // Ignore invalid candidates and keep walking fallbacks.
    }
  }

  return getDefaultSiteOrigin();
}

function buildAbsoluteUrl(baseOrigin, pathOrUrl) {
  const absoluteUrl = safeUrl(pathOrUrl);
  if (absoluteUrl) {
    return absoluteUrl;
  }

  const relativePath = safeString(pathOrUrl);
  if (!relativePath) return "";

  try {
    return new URL(relativePath, `${baseOrigin.replace(/\/+$/, "")}/`).toString();
  } catch {
    return "";
  }
}

function buildSiteScopedUrl(baseOrigin, pathOrUrl, fallbackPath = "/") {
  const siteOrigin = getSiteOrigin(baseOrigin);
  const candidate = safeString(pathOrUrl);
  if (candidate) {
    try {
      const parsed = new URL(candidate, `${siteOrigin.replace(/\/+$/, "")}/`);
      return new URL(`${parsed.pathname}${parsed.search}${parsed.hash}`, `${siteOrigin.replace(/\/+$/, "")}/`).toString();
    } catch {
      // Ignore invalid candidates and keep the fallback below.
    }
  }
  return buildAbsoluteUrl(siteOrigin, fallbackPath) || buildAbsoluteUrl(getDefaultSiteOrigin(), fallbackPath);
}

function getEmailBranding(data, primaryUrl) {
  const siteOrigin = getSiteOrigin(data?.siteUrl, primaryUrl);
  const resolvedSiteUrl = buildAbsoluteUrl(siteOrigin, data?.siteUrl) || siteOrigin;
  let siteHostLabel = "2424";

  try {
    siteHostLabel = new URL(resolvedSiteUrl).host.replace(/^www\./i, "");
  } catch {
    siteHostLabel = "2424";
  }

  const brandLabel = siteHostLabel || "2424";
  const defaultSupportEmail = siteHostLabel ? `contact@${siteHostLabel}` : "contact@2424.mg";

  return {
    siteOrigin,
    siteUrl: resolvedSiteUrl,
    siteHostLabel,
    brandLabel,
    logoUrl:
      buildAbsoluteUrl(siteOrigin, data?.logoUrl) ||
      buildAbsoluteUrl(siteOrigin, "/logo.png") ||
      buildAbsoluteUrl(getDefaultSiteOrigin(), "/logo.png") ||
      "https://2424.mg/logo.png",
    supportEmail: safeString(data?.supportEmail) || defaultSupportEmail,
    locationLabel: safeString(data?.locationLabel) || "Antananarivo, Madagascar",
    youtubeUrl: safeUrl(data?.youtubeUrl) || "https://www.youtube.com/channel/UCcjS1Us2l3yB8lLsDu3Vr6w",
    xUrl: safeUrl(data?.xUrl) || "https://twitter.com/2424_mg",
    instagramUrl: safeUrl(data?.instagramUrl) || "https://www.instagram.com/2424.mg/",
    facebookUrl: safeUrl(data?.facebookUrl) || "https://web.facebook.com/2424.mg/",
  };
}


function normalizeSubscriptionPlanLabel(value) {
  const normalized = safeString(value).toLowerCase();
  if (!normalized) {
    return "Essentiel";
  }

  if (normalized === "free") {
    return "Gratuit";
  }

  if (normalized === "business") {
    return "Business";
  }

  if (normalized === "essentiel") {
    return "Essentiel";
  }

  return safeString(value);
}
function renderBase2424Email({
  subject,
  preheader,
  title,
  bodyHtml,
  bodyText,
  ctaLabel,
  ctaUrl,
  branding,
  postCtaHtml = "",
  postCtaText = "",
  footerExtraHtml = "",
  footerExtraText = "",
}) {
  const text = [
    bodyText,
    "",
    `${ctaLabel}: ${ctaUrl}`,
    postCtaText ? "" : null,
    postCtaText || null,
    "",
    "24/24 MG -- Votre nouvelle plateforme d'information qui ne dort jamais, qui ne s'arrête jamais, et qui ne vous laisse jamais sans réponse.",
    "Actualités, analyses et faits marquants à Madagascar et dans le monde.",
    `${branding.siteUrl} - ${branding.locationLabel} - ${branding.supportEmail}`,
    `YouTube: ${branding.youtubeUrl}`,
    `X: ${branding.xUrl}`,
    `Instagram: ${branding.instagramUrl}`,
    `Facebook: ${branding.facebookUrl}`,
    footerExtraText ? "" : null,
    footerExtraText || null,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
<!doctype html>
<html lang="fr">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f5f5f5;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      ${escapeHtml(preheader)}
    </div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f5f5;margin:0;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background-color:#ffffff;border-radius:12px;margin:0 auto;">
            <tr>
              <td style="padding:32px 36px 28px 36px;font-family:'Roboto Flex',Arial,Helvetica,sans-serif;color:#111111;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-bottom:40px;">
                      <img src="${escapeHtml(branding.logoUrl)}" alt="2424 MG" width="134" style="display:block;width:134px;max-width:134px;height:auto;border:0;" />
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom:40px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:286px;margin:0 auto;">
                        <tr>
                          <td align="center" style="padding-bottom:10px;">
                            <div style="margin:0;font-size:24px;line-height:24px;font-weight:700;color:#cc202a;text-align:center;">
                              ${escapeHtml(title)}
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding-bottom:24px;">
                            <div style="margin:0;font-size:12px;line-height:14px;font-weight:400;color:#111111;text-align:center;">
                              ${bodyHtml}
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding-bottom:${postCtaHtml ? "20px" : "0"};">
                            <a href="${escapeHtml(ctaUrl)}" style="display:block;width:100%;background-color:#cc202a;border-radius:6px;color:#ffffff;font-size:12px;line-height:40px;font-weight:400;text-align:center;text-decoration:none;">
                              ${escapeHtml(ctaLabel)}
                            </a>
                          </td>
                        </tr>
                        ${
                          postCtaHtml
                            ? `<tr><td align="center"><div style="margin:0;font-size:12px;line-height:14px;font-weight:400;color:#111111;text-align:center;">${postCtaHtml}</div></td></tr>`
                            : ""
                        }
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom:8px;">
                      <div style="margin:0;font-size:8px;line-height:10px;font-weight:400;color:#6b7280;text-align:center;">
                        <strong>24/24 MG</strong> &mdash; Votre nouvelle plateforme d&apos;information qui ne dort jamais, qui ne s&apos;arr&ecirc;te jamais, et qui ne vous laisse jamais sans r&eacute;ponse
                      </div>
                      <div style="margin:0;font-size:8px;line-height:10px;font-weight:400;color:#6b7280;text-align:center;">
                        Actualit&eacute;s, analyses et faits marquants &agrave; Madagascar et dans le monde.
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom:10px;">
                      <div style="font-size:8px;line-height:10px;font-weight:400;color:#6b7280;text-align:center;">
                        <a href="${escapeHtml(branding.siteUrl)}" style="color:#2563eb;text-decoration:underline;">${escapeHtml(branding.siteHostLabel)}</a>
                        <span style="color:#6b7280;">&nbsp;-&nbsp;${escapeHtml(branding.locationLabel)}&nbsp;-&nbsp;</span>
                        <a href="mailto:${escapeHtml(branding.supportEmail)}" style="color:#2563eb;text-decoration:underline;">${escapeHtml(branding.supportEmail)}</a>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom:6px;">
                      <div style="font-size:8px;line-height:10px;font-weight:400;color:#6b7280;text-align:center;">
                        Suivez-nous :
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td align="center">
                      <div style="font-size:8px;line-height:10px;font-weight:400;color:#6b7280;text-align:center;">
                        <a href="${escapeHtml(branding.youtubeUrl)}" style="color:#6b7280;text-decoration:none;">YouTube</a>
                        <span>&nbsp;&nbsp;</span>
                        <a href="${escapeHtml(branding.xUrl)}" style="color:#6b7280;text-decoration:none;">X</a>
                        <span>&nbsp;&nbsp;</span>
                        <a href="${escapeHtml(branding.instagramUrl)}" style="color:#6b7280;text-decoration:none;">Instagram</a>
                        <span>&nbsp;&nbsp;</span>
                        <a href="${escapeHtml(branding.facebookUrl)}" style="color:#6b7280;text-decoration:none;">Facebook</a>
                      </div>
                    </td>
                  </tr>
                  ${
                    footerExtraHtml
                      ? `<tr><td align="center" style="padding-top:12px;">${footerExtraHtml}</td></tr>`
                      : ""
                  }
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();

  return { subject, text, html };
}

function buildNotificationFooterExtra(data, branding) {
  const fallbackPreferencesUrl = buildAbsoluteUrl(branding.siteOrigin, "/profil/modifier") || branding.siteUrl;
  const unsubscribeUrl = buildAbsoluteUrl(branding.siteOrigin, data?.unsubscribeUrl) || fallbackPreferencesUrl;
  const preferencesUrl = buildAbsoluteUrl(branding.siteOrigin, data?.preferencesUrl) || fallbackPreferencesUrl;

  return {
    footerExtraText: [
      `Vous recevez cet email car vous êtes abonné(e) à la newsletter de ${branding.siteHostLabel}.`,
      "Si vous ne souhaitez plus recevoir nos communications :",
      `Se désinscrire: ${unsubscribeUrl}`,
      `Gérer mes préférences: ${preferencesUrl}`,
    ].join("\n"),
    footerExtraHtml: `
      <div style="font-size:8px;line-height:10px;font-weight:400;color:#6b7280;text-align:center;">
        <div>Vous recevez cet email car vous êtes abonné(e) à la newsletter de ${escapeHtml(branding.siteHostLabel)}.</div>
        <div style="margin-top:2px;">
          Si vous ne souhaitez plus recevoir nos communications :<br />
          <a href="${escapeHtml(unsubscribeUrl)}" style="color:#2563eb;text-decoration:underline;">Se désinscrire</a>
          <span style="color:#6b7280;"> | </span>
          <a href="${escapeHtml(preferencesUrl)}" style="color:#2563eb;text-decoration:underline;">Gérer mes préférences</a>
        </div>
      </div>
    `.trim(),
  };
}

function renderRichTextHtml(value) {
  return String(value || "")
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p style="margin:0 0 12px 0;">${escapeHtml(line)}</p>`)
    .join("");
}

function renderNewsletterBroadcast(data) {
  const ctaUrl = safeString(data?.ctaUrl) || getDefaultSiteOrigin();
  const branding = getEmailBranding(data, ctaUrl);
  const footerExtra = buildNotificationFooterExtra(data, branding);
  const brandLabel = branding.brandLabel;
  const subject = safeString(data?.subject) || `Une nouvelle actualité de ${brandLabel}`;
  const preheader = safeString(data?.preheader) || `Découvrez la dernière mise à jour partagée par ${brandLabel}.`;
  const title = safeString(data?.title) || `Une nouvelle actualité de ${brandLabel}`;
  const introLine = safeString(data?.introLine) || `Découvrez la dernière communication partagée par l'équipe ${brandLabel}.`;
  const content = safeString(data?.content);
  const contentHtml = safeString(data?.contentHtml) || renderRichTextHtml(content);
  const contentText = safeString(data?.contentText) || content;
  const ctaLabel = safeString(data?.ctaLabel) || "Lire la suite";
  const bodyText = [introLine, "", contentText].filter(Boolean).join("\n");

  return renderBase2424Email({
    subject,
    preheader,
    title,
    bodyHtml: `${escapeHtml(introLine)}${contentHtml ? `<div style="margin-top:16px;">${contentHtml}</div>` : ""}`,
    bodyText,
    ctaLabel,
    ctaUrl,
    branding,
    footerExtraHtml: footerExtra.footerExtraHtml,
    footerExtraText: footerExtra.footerExtraText,
  });
}

function renderSignupWelcome(data) {
  const firstName = safeString(data?.firstName);
  const displayName = safeString(data?.displayName) || firstName || "a vous";
  const branding = getEmailBranding(data);
  const loginUrl = buildSiteScopedUrl(branding.siteOrigin, data?.loginUrl, "/login");
  const brandLabel = branding.brandLabel;
  const subject = `Bienvenue sur ${brandLabel}`;
  const preheader = `Bienvenue sur ${brandLabel}. Votre compte a été créé avec succès.`;
  const bodyText = [
    `Bonjour ${displayName},`,
    "",
    `Bienvenue sur ${brandLabel}.`,
    "Votre compte a été créé avec succès. Nous sommes ravis de vous compter parmi nos lecteurs.",
    "",
    "Merci,",
    `L'equipe ${brandLabel}`,
  ].join("\n");

  return renderBase2424Email({
    subject,
    preheader,
    title: `Bienvenue sur ${brandLabel}`,
    bodyHtml:
      "Votre compte a été créé avec succès. Nous sommes ravis de vous compter parmi nos lecteurs.",
    bodyText,
    ctaLabel: "Accéder à mon compte",
    ctaUrl: loginUrl,
    branding,
  });
}

function renderSignupNewUserAlert(data) {
  const email = safeString(data?.email) || "(inconnu)";
  const displayName = safeString(data?.displayName) || "(inconnu)";
  const username = safeString(data?.username) || "(non renseigne)";
  const authProvider = safeString(data?.authProvider) || "local";
  const wpUserId = safeString(data?.wpUserId) || "(inconnu)";
  const createdAt = safeString(data?.createdAt) || new Date().toISOString();
  const subject = `[2424] Nouvelle inscription: ${email}`;

  const text = [
    "Nouvelle inscription detectee.",
    "",
    `Email: ${email}`,
    `Nom affiche: ${displayName}`,
    `Username: ${username}`,
    `Provider: ${authProvider}`,
    `WP User ID: ${wpUserId}`,
    `Date: ${createdAt}`,
  ].join("\n");

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111;">
    <p><strong>Nouvelle inscription detectee</strong></p>
    <ul style="padding-left:18px;margin:0;">
      <li>Email: ${escapeHtml(email)}</li>
      <li>Nom affiche: ${escapeHtml(displayName)}</li>
      <li>Username: ${escapeHtml(username)}</li>
      <li>Provider: ${escapeHtml(authProvider)}</li>
      <li>WP User ID: ${escapeHtml(wpUserId)}</li>
      <li>Date: ${escapeHtml(createdAt)}</li>
    </ul>
  </div>`.trim();

  return { subject, text, html };
}

function renderEmailVerificationRequested(data) {
  const identifier =
    safeString(data?.firstName) ||
    safeString(data?.displayName) ||
    safeString(data?.identifier) ||
    "a vous";
  const branding = getEmailBranding(data);
  const verificationUrl = buildSiteScopedUrl(branding.siteOrigin, data?.verificationUrl, "/verification-email");
  const subject = "Confirmez votre adresse email";
  const brandLabel = branding.brandLabel;
  const preheader = `Confirmez votre adresse email pour activer votre compte ${brandLabel}.`;
  const bodyText = [
    `Bonjour ${identifier},`,
    "Veuillez cliquer sur le bouton ci-dessous pour confirmer votre adresse email.",
  ].join("\n");

  const postCtaText = [
    "Si le bouton ne fonctionne pas, vous pouvez aussi copier et coller ce lien dans votre navigateur :",
    verificationUrl,
  ].join("\n");

  return renderBase2424Email({
    subject,
    preheader,
    title: "Confirmez votre email",
    bodyHtml: `Bonjour ${escapeHtml(identifier)},<br/>Veuillez cliquer sur le bouton ci-dessous pour confirmer votre adresse email.`,
    bodyText,
    ctaLabel: "Confirmer mon email",
    ctaUrl: verificationUrl,
    postCtaHtml: `Si le bouton ne fonctionne pas, vous pouvez aussi copier et coller ce lien dans votre navigateur :<br/><a href="${escapeHtml(verificationUrl)}" style="color:#2563eb;text-decoration:underline;word-break:break-all;">${escapeHtml(verificationUrl)}</a>`,
    postCtaText,
    branding,
  });
}

function renderLoginOtpRequested(data) {
  const identifier =
    safeString(data?.firstName) ||
    safeString(data?.displayName) ||
    safeString(data?.identifier) ||
    "a vous";
  const otpCode = safeString(data?.otpCode).replace(/\D/g, "").slice(0, 8);
  const branding = getEmailBranding(data);
  const loginUrl = buildSiteScopedUrl(branding.siteOrigin, data?.loginUrl, "/login");
  const subject = "Votre code de connexion";
  const preheader = `Utilisez ce code pour terminer votre connexion sur ${branding.brandLabel}.`;
  const bodyText = [
    `Bonjour ${identifier},`,
    "",
    `Voici votre code de connexion à usage unique : ${otpCode}`,
    "",
    "Ce code reste valide pendant 15 minutes.",
    "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.",
  ].join("\n");

  return renderBase2424Email({
    subject,
    preheader,
    title: "Code de connexion",
    bodyHtml: `Bonjour ${escapeHtml(identifier)},<br/>Voici votre code de connexion à usage unique :<br/><br/><strong style="font-size:28px;letter-spacing:0.22em;color:#cc202a;">${escapeHtml(otpCode)}</strong><br/><br/>Ce code reste valide pendant 15 minutes.<br/>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.`,
    bodyText,
    ctaLabel: "Retourner sur 2424",
    ctaUrl: loginUrl,
    branding,
  });
}

function renderPasswordResetRequested(data) {
  const identifier =
    safeString(data?.firstName) ||
    safeString(data?.displayName) ||
    safeString(data?.identifier) ||
    "a vous";
  const branding = getEmailBranding(data);
  const forgotPasswordUrl = buildSiteScopedUrl(
    branding.siteOrigin,
    data?.resetUrl || data?.forgotPasswordUrl,
    "/reinitialiser-mot-de-passe",
  );
  const subject = "Réinitialisez votre mot de passe";
  const brandLabel = branding.brandLabel;
  const preheader = `Réinitialisez votre mot de passe en toute sécurité sur ${brandLabel}.`;
  const bodyText = [
    `Bonjour ${identifier},`,
    "Vous avez oublié votre mot de passe ? Pas d'inquiétude, vous pouvez le réinitialiser facilement ci-dessous.",
    "",
    "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité.",
  ].join("\n");

  return renderBase2424Email({
    subject,
    preheader,
    title: "Réinitialisez votre mot de passe",
    bodyHtml: `Bonjour ${escapeHtml(identifier)},<br/>Vous avez oublié votre mot de passe ? Pas d'inquiétude, vous pouvez le réinitialiser facilement ci-dessous.`,
    bodyText,
    ctaLabel: "Réinitialiser le mot de passe",
    ctaUrl: forgotPasswordUrl,
    branding,
  });
}

function formatArAmount(value) {
  const parsed = Number.parseInt(String(value || "0"), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return "";
  }

  return `${new Intl.NumberFormat("fr-FR").format(parsed).replaceAll("\u202f", " ")} Ar`;
}

function renderSubscriptionConfirmed(data) {
  const identifier =
    safeString(data?.firstName) ||
    safeString(data?.displayName) ||
    safeString(data?.identifier) ||
    "a vous";
  const branding = getEmailBranding(data);
  const dashboardUrl = buildSiteScopedUrl(branding.siteOrigin, data?.dashboardUrl, "/profil");
  const subject = "Votre abonnement est confirmé";
  const brandLabel = branding.brandLabel;
  const preheader = `Votre abonnement à ${brandLabel} est maintenant actif.`;
  const normalizedPlanLabel = normalizeSubscriptionPlanLabel(data?.planLabel);
  const normalizedPlanBadge = `PLAN ${normalizedPlanLabel.toUpperCase()}`;
  const priceLabel = safeString(data?.priceLabel) || formatArAmount(data?.monthlyPriceAr) || "";
  const bodyText = [
    `Bonjour ${identifier},`,
    `Merci pour votre confiance ! Votre abonnement à ${brandLabel} est maintenant actif.`,
    "",
    normalizedPlanBadge,
    priceLabel || "-",
  ].join("\n");

  const planSummaryHtml = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0 0 0;">
      <tr>
        <td style="border-radius:12px;background-color:#fff7f7;padding:18px 20px;">
          <div style="font-size:12px;line-height:14px;font-weight:700;letter-spacing:0.18em;color:#cc202a;text-transform:uppercase;">
            ${escapeHtml(normalizedPlanBadge)}
          </div>
          <div style="margin-top:10px;font-size:28px;line-height:32px;font-weight:700;color:#111111;">
            ${escapeHtml(priceLabel || "-")}
          </div>
        </td>
      </tr>
    </table>
  `.trim();

  return renderBase2424Email({
    subject,
    preheader,
    title: "Votre abonnement est confirmé",
    bodyHtml: `Bonjour ${escapeHtml(identifier)},<br/>Merci pour votre confiance ! Votre abonnement à ${escapeHtml(brandLabel)} est maintenant actif.${planSummaryHtml}`,
    bodyText,
    ctaLabel: "Accéder à mon espace",
    ctaUrl: dashboardUrl,
    branding,
  });
}

function buildInitials(value, fallback = "NA") {
  const normalized = safeString(value);
  if (!normalized) return fallback;

  const segments = normalized
    .split(/\s+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  const initials = segments
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() || "")
    .join("");

  return initials || fallback;
}

function renderNotificationActivity(data) {
  const identifier =
    safeString(data?.firstName) ||
    safeString(data?.displayName) ||
    safeString(data?.identifier);
  const greeting = identifier ? `Bonjour ${identifier},` : "Bonjour,";
  const ctaUrl = safeString(data?.ctaUrl) || buildAbsoluteUrl(getDefaultSiteOrigin(), "/profil/messages");
  const branding = getEmailBranding(data, ctaUrl);
  const footerExtra = buildNotificationFooterExtra(data, branding);
  const subject = safeString(data?.subject) || "Nouvelle activité sur votre annonce";
  const brandLabel = branding.brandLabel;
  const preheader = safeString(data?.preheader) || `Une nouvelle activité vous attend sur ${brandLabel}.`;
  const title = safeString(data?.title) || "Nouvelle activité sur votre annonce";
  const introLine = safeString(data?.introLine) || "Quelqu'un a interagi avec l'une de vos annonces.";
  const actorName = safeString(data?.actorName) || "Quelqu'un";
  const activityLabel = safeString(data?.activityLabel) || "a répondu à votre annonce";
  const entityTitle = safeString(data?.entityTitle) || "Votre annonce";
  const activityTimeLabel = safeString(data?.activityTimeLabel) || "À l'instant";
  const moderationMessage = safeString(data?.moderationMessage);
  const ctaLabel = safeString(data?.ctaLabel) || "Voir le message";
  const actorInitials = safeString(data?.actorInitials) || buildInitials(actorName);
  const bodyText = [
    greeting,
    introLine,
    "",
    `${actorName} ${activityLabel}`,
    `"${entityTitle}"`,
    moderationMessage ? `Commentaire : ${moderationMessage}` : "",
    activityTimeLabel,
  ].filter(Boolean).join("\n");

  const activityCardHtml = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0 0 0;">
      <tr>
        <td style="border-radius:6px;background-color:#fff7f7;padding:14px 12px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="32" valign="middle" style="width:32px;padding-right:10px;">
                <div style="width:32px;height:32px;line-height:32px;border-radius:999px;background-color:#cc202a;color:#ffffff;text-align:center;font-size:10px;font-weight:700;">
                  ${escapeHtml(actorInitials)}
                </div>
              </td>
              <td valign="middle" style="text-align:left;">
                <div style="font-size:10px;line-height:12px;color:#111111;">
                  <strong>${escapeHtml(actorName)}</strong>
                  <span style="color:#4b5563;"> ${escapeHtml(activityLabel)}</span>
                </div>
                <div style="margin-top:2px;font-size:10px;line-height:12px;color:#cc202a;">
                  &quot; ${escapeHtml(entityTitle)} &quot;
                </div>
                ${moderationMessage ? `<div style="margin-top:8px;font-size:10px;line-height:15px;color:#374151;white-space:pre-wrap;">${escapeHtml(moderationMessage)}</div>` : ""}
                <div style="margin-top:2px;font-size:8px;line-height:10px;color:#9ca3af;">
                  ${escapeHtml(activityTimeLabel)}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `.trim();

  return renderBase2424Email({
    subject,
    preheader,
    title,
    bodyHtml: `${escapeHtml(greeting)}<br/>${escapeHtml(introLine)}${activityCardHtml}`,
    bodyText,
    ctaLabel,
    ctaUrl,
    branding,
    footerExtraHtml: footerExtra.footerExtraHtml,
    footerExtraText: footerExtra.footerExtraText,
  });
}

function resolveTemplate(eventName, payload) {
  if (eventName === "signup.welcome.v1") {
    return renderSignupWelcome(payload.templateData);
  }

  if (eventName === "signup.new-user-alert.v1") {
    return renderSignupNewUserAlert(payload.templateData);
  }

  if (eventName === "email-verification.requested.v1") {
    return renderEmailVerificationRequested(payload.templateData);
  }

  if (eventName === "login-otp.requested.v1") {
    return renderLoginOtpRequested(payload.templateData);
  }

  if (eventName === "password-reset.requested.v1") {
    return renderPasswordResetRequested(payload.templateData);
  }

  if (eventName === "subscription.confirmed.v1") {
    return renderSubscriptionConfirmed(payload.templateData);
  }

  if (eventName === "notification.activity.v1") {
    return renderNotificationActivity(payload.templateData);
  }

  if (eventName === "newsletter.broadcast.v1") {
    return renderNewsletterBroadcast(payload.templateData);
  }

  const hasRawTemplate =
    safeString(payload.subject) !== "" &&
    (safeString(payload.text) !== "" || safeString(payload.html) !== "");
  if (hasRawTemplate) {
    return {
      subject: safeString(payload.subject),
      text: safeString(payload.text),
      html: safeString(payload.html),
    };
  }

  return null;
}

function normalizeRecipients(payload) {
  const recipients = [];

  if (payload?.recipient?.email) {
    recipients.push({
      email: safeString(payload.recipient.email).toLowerCase(),
      name: safeString(payload.recipient.name),
    });
  }

  for (const item of payload?.recipients || []) {
    if (!item?.email) continue;
    recipients.push({
      email: safeString(item.email).toLowerCase(),
      name: safeString(item.name),
    });
  }

  return recipients.filter((recipient) => recipient.email.includes("@"));
}

async function sendEmail({ fromAddress, replyToAddress, configurationSetName, recipient, subject, text, html }) {
  const command = new SendEmailCommand({
    FromEmailAddress: fromAddress,
    Destination: {
      ToAddresses: [recipient.email],
    },
    Content: {
      Simple: {
        Subject: {
          Data: subject,
          Charset: "UTF-8",
        },
        Body: {
          Text: text
            ? {
                Data: text,
                Charset: "UTF-8",
              }
            : undefined,
          Html: html
            ? {
                Data: html,
                Charset: "UTF-8",
              }
            : undefined,
        },
      },
    },
    ReplyToAddresses: replyToAddress ? [replyToAddress] : undefined,
    ConfigurationSetName: configurationSetName || undefined,
  });

  const result = await ses.send(command);
  return result.MessageId || null;
}

export const handler = async (event) => {
  const sharedSecret = required("EMAIL_DISPATCHER_SHARED_SECRET");
  const fromAddress = required("EMAIL_FROM_ADDRESS");
  const replyToAddress = safeString(process.env.EMAIL_REPLY_TO_ADDRESS);
  const configurationSetName = safeString(process.env.EMAIL_CONFIGURATION_SET_NAME);

  const headerSecret = getHeader(event?.headers, "x-2424-email-secret");
  if (!headerSecret || headerSecret !== sharedSecret) {
    return json(401, { error: "Unauthorized." });
  }

  let payload;
  try {
    const rawBody = event?.isBase64Encoded
      ? Buffer.from(event?.body || "", "base64").toString("utf8")
      : event?.body || "{}";
    payload = JSON.parse(rawBody);
  } catch {
    return json(400, { error: "Invalid JSON body." });
  }

  const eventName = safeString(payload?.eventName);
  if (!eventName) {
    return json(400, { error: "Missing eventName." });
  }

  const recipients = normalizeRecipients(payload);
  if (recipients.length === 0) {
    return json(400, { error: "No valid recipient email provided." });
  }

  const template = resolveTemplate(eventName, payload);
  if (!template || !template.subject || (!template.text && !template.html)) {
    return json(400, { error: `Unknown eventName "${eventName}" and no raw template provided.` });
  }

  const sent = [];
  for (const recipient of recipients) {
    const messageId = await sendEmail({
      fromAddress,
      replyToAddress,
      configurationSetName,
      recipient,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });

    sent.push({
      email: recipient.email,
      messageId,
    });
  }

  return json(200, {
    ok: true,
    eventName,
    count: sent.length,
    sent,
  });
};
