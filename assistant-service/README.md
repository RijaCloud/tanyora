# Tanyora assistant (prepared, not active)

The welcome page after a new signup is available in the frontend source. The AI chat widget and this separate Node service are feature-gated and **not deployed**. The active Tanyora stack is unchanged. No 2424.mg credentials, services, or data are used.

## Current scope

- Answers only questions about known Tanyora features using a short, source-controlled knowledge note in `assistant.mjs`.
- The frontend accepts authenticated, completed-onboarding users only and limits requests to 12 per 15 minutes per user. Conversation history is kept only in the browser component memory, at most 8 messages of 800 characters each.
- The service rejects obvious email addresses and phone numbers before calling the provider. This is not a comprehensive personal-data detector; the UI also warns users not to submit personal information or documents.
- The provider request uses the Responses API with `store: false`, a 15-second timeout and a 350-token output cap. No tools, WordPress access, or account details are sent.
- The assistant is not a legal or geological expert. It cannot validate permits, origin, compliance, transactions, or documents. The human support workflow is **not yet implemented**.

## Before activation

1. Select and configure a dedicated AI provider account/project for Tanyora. The current adapter is for OpenAI and requires a dedicated API key and an approved `OPENAI_MODEL`.
2. Set a spend limit and alerts at the provider, choose a budget, and test failure and overload behavior. The in-app per-user rate limit alone is not a spending cap.
3. Publish a Tanyora privacy notice explaining that chat questions are sent to the chosen AI provider. Review data-retention requirements before activation.
4. Decide how document-related requests reach a real administrator: a WordPress support inbox or another approved channel. Do not advertise human support as live until that workflow exists.
5. Run `node --test assistant-service/assistant.test.mjs` and `pnpm --dir frontend typecheck`. Test with a dedicated Tanyora key in a non-production environment.
6. Build the frontend with `NEXT_PUBLIC_TANYORA_ASSISTANT_ENABLED=true` only after the above steps. Put the private key, model and a generated shared secret into the Winford VPS private environment file; never commit their values. The optional `compose.assistant.yaml` overlay adds the Node service and points the frontend to it.

Do not attach `compose.assistant.yaml` to the active Compose stack until the privacy notice, provider budget, and end-to-end tests are complete. To roll back, remove that overlay and deploy the frontend with the public feature flag disabled. The welcome page itself does not depend on the AI service.
