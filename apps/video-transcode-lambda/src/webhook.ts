/** Callback vers l'API (mêmes contrats que `apps/api/src/media/internal-video.controller.ts`). */
export interface WebhookConfig {
  baseUrl: string;
  secret: string;
}

export interface CompletePayload {
  originalKey: string;
  playbackKey: string;
  posterKey: string;
  durationSeconds?: number;
}

async function callWebhook(
  config: WebhookConfig,
  path: 'complete' | 'fail',
  originalKey: string,
  body: CompletePayload | { originalKey: string },
): Promise<void> {
  const response = await fetch(`${config.baseUrl}/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Secret': config.secret,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(
      `Le webhook /${path} de l'API a répondu ${response.status} pour ${originalKey}`,
    );
  }
}

export function notifyComplete(
  config: WebhookConfig,
  payload: CompletePayload,
): Promise<void> {
  return callWebhook(config, 'complete', payload.originalKey, payload);
}

export function notifyFailed(
  config: WebhookConfig,
  originalKey: string,
): Promise<void> {
  return callWebhook(config, 'fail', originalKey, { originalKey });
}
