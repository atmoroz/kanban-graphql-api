import { validationFailed } from '../lib/errors';

export type EmailProvider = 'stub' | 'resend' | 'brevo';

export type InviteEmailInput = {
  toEmail: string;
  boardTitle: string;
  role: string;
  inviterName?: string;
  actionUrl?: string;
};

type SendEmailResult = {
  provider: EmailProvider;
  accepted: boolean;
  messageId?: string;
};

function resolveProvider(): EmailProvider {
  const raw = (process.env.EMAIL_PROVIDER ?? 'stub').toLowerCase().trim();

  if (raw === 'stub' || raw === 'resend' || raw === 'brevo') {
    return raw;
  }

  return 'stub';
}

function buildInviteEmail(input: InviteEmailInput) {
  const inviter = input.inviterName?.trim() || 'Kanban Dashboard Team';
  const subject = `You were invited to board "${input.boardTitle}"`;
  const action = input.actionUrl?.trim() || '';

  const textLines = [
    `Hello,`,
    `${inviter} invited you to board "${input.boardTitle}" with role "${input.role}".`,
  ];

  if (action) {
    textLines.push(`Open invite link: ${action}`);
  }

  const text = textLines.join('\n');

  const html = `
    <p>Hello,</p>
    <p>${inviter} invited you to board "<strong>${input.boardTitle}</strong>" with role "<strong>${input.role}</strong>".</p>
    ${
      action
        ? `<p><a href="${action}" target="_blank" rel="noopener noreferrer">Open invite</a></p>`
        : ''
    }
  `.trim();

  return { subject, text, html };
}

function validateEmailInput(input: InviteEmailInput) {
  if (!input.toEmail?.trim()) {
    validationFailed('Recipient email is required');
  }

  if (!input.boardTitle?.trim()) {
    validationFailed('Board title is required');
  }

  if (!input.role?.trim()) {
    validationFailed('Role is required');
  }
}

async function sendWithStub(input: InviteEmailInput): Promise<SendEmailResult> {
  const payload = buildInviteEmail(input);
  console.log('[email:stub] invite', {
    to: input.toEmail,
    subject: payload.subject,
    actionUrl: input.actionUrl ?? null,
  });

  return {
    provider: 'stub',
    accepted: true,
    messageId: `stub-${Date.now()}`,
  };
}

async function sendWithResend(
  input: InviteEmailInput,
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();

  if (!apiKey || !from) {
    return sendWithStub(input);
  }

  const body = buildInviteEmail(input);

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [input.toEmail],
      subject: body.subject,
      html: body.html,
      text: body.text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend email failed with status ${response.status}`);
  }

  const result = (await response.json()) as { id?: string };

  return {
    provider: 'resend',
    accepted: true,
    messageId: result.id,
  };
}

async function sendWithBrevo(input: InviteEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();

  if (!apiKey || !from) {
    return sendWithStub(input);
  }

  const body = buildInviteEmail(input);

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { email: from },
      to: [{ email: input.toEmail }],
      subject: body.subject,
      htmlContent: body.html,
      textContent: body.text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Brevo email failed with status ${response.status}`);
  }

  const result = (await response.json()) as { messageId?: string };

  return {
    provider: 'brevo',
    accepted: true,
    messageId: result.messageId,
  };
}

export async function sendInviteEmail(
  input: InviteEmailInput,
): Promise<SendEmailResult> {
  validateEmailInput(input);

  const provider = resolveProvider();

  if (provider === 'resend') {
    return sendWithResend(input);
  }

  if (provider === 'brevo') {
    return sendWithBrevo(input);
  }

  return sendWithStub(input);
}
