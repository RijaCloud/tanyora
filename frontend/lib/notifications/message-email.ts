import { getWordPressNotificationPreference } from "@/lib/api/wordpress-internal";
import { buildNotificationPreferencesUrl, buildNotificationUnsubscribeUrl } from "@/lib/notifications/email-preferences";

type MessageEmailOptions = {
  recipientEmail: string;
  siteUrl?: string;
};

export async function getMessageNotificationEmailOptions({ recipientEmail, siteUrl }: MessageEmailOptions) {
  let preference;
  try {
    preference = await getWordPressNotificationPreference({ email: recipientEmail });
  } catch (error) {
    console.error("[notifications/message-email] unable to load notification preference", {
      recipientEmail,
      message: error instanceof Error ? error.message : String(error),
    });

    return {
      shouldSendEmail: true,
      preferencesUrl: buildNotificationPreferencesUrl(siteUrl),
      unsubscribeUrl: buildNotificationUnsubscribeUrl(recipientEmail, siteUrl),
    };
  }

  return {
    shouldSendEmail: !preference.found || preference.notificationEmailsEnabled !== false,
    preferencesUrl: buildNotificationPreferencesUrl(siteUrl),
    unsubscribeUrl: buildNotificationUnsubscribeUrl(recipientEmail, siteUrl),
  };
}
