const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

interface SlackMessage {
  channel: string;
  text: string;
}

export async function sendSlackMessage(
  channel: string,
  text: string
): Promise<void> {
  if (!SLACK_WEBHOOK_URL) {
    throw new Error(
      "SLACK_WEBHOOK_URL environment variable is not set"
    );
  }

  const payload: SlackMessage = { channel, text };

  const response = await fetch(SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      `Slack API error: ${response.status} ${response.statusText}`
    );
  }
}
