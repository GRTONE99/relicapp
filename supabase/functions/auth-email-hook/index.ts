// deno-lint-ignore-file no-explicit-any
// @ts-nocheck — Deno globals (Deno, npm: imports) are not resolvable by the
// local TypeScript server but are available at runtime in the Deno environment.

// Auth email hook — sends all Supabase auth emails directly via Resend.
// Bypasses Lovable's SMTP relay (notify.relicroster.com) entirely.
//
// Required Supabase secret:
//   supabase secrets set RESEND_API_KEY=re_xxxx --project-ref kpnhflqrfasuprrmposf
//
// The hook must remain registered in Supabase Auth → Hooks (Send Email).
// If the hook returns a non-2xx, Supabase falls back to its configured SMTP
// (Lovable's relay) — so we must return 200 on every handled request.

import { Resend } from 'npm:resend'

const SITE_NAME = 'Relic Roster'
const FROM_ADDRESS = 'Relic Roster <noreply@mail.relicroster.com>'
const SITE_URL = 'https://relicroster.com'
const LOGO_URL = 'https://app.relicroster.com/email-logo.png'
const ICON_URL = 'https://app.relicroster.com/icon-512.png'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── Email templates ──────────────────────────────────────────────────────────

function baseTemplate(previewText: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${previewText}</title>
</head>
<body style="margin:0;padding:0;background-color:#0b0d12;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0b0d12;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background-color:#12151e;border:1px solid #1e2231;border-radius:16px;overflow:hidden;">
        <!-- Gold top bar -->
        <tr><td style="height:4px;background-color:#ffbf00;font-size:0;line-height:0;">&nbsp;</td></tr>
        <!-- Logo -->
        <tr><td align="center" style="padding:36px 40px 28px;">
          <img src="${LOGO_URL}" alt="${SITE_NAME}" width="173" height="32" style="display:block;border:0;" />
        </td></tr>
        <!-- Divider -->
        <tr><td style="padding:0 40px;"><div style="height:1px;background-color:#1e2231;font-size:0;line-height:0;">&nbsp;</div></td></tr>
        <!-- Body -->
        ${bodyContent}
        <!-- Divider -->
        <tr><td style="padding:0 40px;"><div style="height:1px;background-color:#1e2231;font-size:0;line-height:0;">&nbsp;</div></td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 40px 28px;background-color:#0d0f16;border-top:1px solid #1e2231;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td><p style="margin:0;font-size:12px;color:#3d4459;line-height:1.5;">
              © 2025 Relic Roster. All rights reserved.<br/>
              <a href="${SITE_URL}" style="color:#5a6278;text-decoration:none;">relicroster.com</a>
            </p></td>
            <td align="right" valign="top">
              <img src="${ICON_URL}" alt="" width="28" height="28" style="display:block;border:0;border-radius:6px;opacity:0.5;" />
            </td>
          </tr></table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function ctaButton(url: string, label: string): string {
  return `<table cellpadding="0" cellspacing="0" border="0" style="width:100%;">
    <tr><td align="center">
      <a href="${url}" style="display:inline-block;padding:14px 36px;background-color:#ffbf00;color:#000000;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;">${label}</a>
    </td></tr>
  </table>`
}

function fallbackUrl(url: string): string {
  return `<tr><td style="padding:20px 40px 24px;">
    <p style="margin:0;font-size:12px;color:#5a6278;line-height:1.6;">If the button doesn't work, copy and paste this URL into your browser:</p>
    <p style="margin:6px 0 0;font-size:12px;"><a href="${url}" style="color:#ffbf00;word-break:break-all;text-decoration:none;">${url}</a></p>
  </td></tr>`
}

function signupTemplate(confirmationUrl: string): { subject: string; html: string } {
  const body = `
    <tr><td style="padding:36px 40px 28px;">
      <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#f0f2f7;line-height:1.3;">Confirm your account</p>
      <p style="margin:0 0 28px;font-size:15px;color:#8a93a8;line-height:1.6;">
        You're one step away from managing your sports memorabilia collection.
        Click the button below to verify your email address and activate your account.
      </p>
      ${ctaButton(confirmationUrl, 'Confirm My Account')}
      <p style="margin:24px 0 0;font-size:13px;color:#5a6278;text-align:center;line-height:1.5;">
        This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
      </p>
    </td></tr>
    ${fallbackUrl(confirmationUrl)}`
  return {
    subject: 'Confirm your Relic Roster account',
    html: baseTemplate('Confirm your Relic Roster account', body),
  }
}

function recoveryTemplate(confirmationUrl: string): { subject: string; html: string } {
  const body = `
    <tr><td style="padding:36px 40px 28px;">
      <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#f0f2f7;line-height:1.3;">Reset your password</p>
      <p style="margin:0 0 28px;font-size:15px;color:#8a93a8;line-height:1.6;">
        We received a request to reset your password. Click the button below to choose a new one.
        If you didn't request this, you can safely ignore this email.
      </p>
      ${ctaButton(confirmationUrl, 'Reset My Password')}
      <p style="margin:24px 0 0;font-size:13px;color:#5a6278;text-align:center;line-height:1.5;">
        This link expires in 1 hour.
      </p>
    </td></tr>
    ${fallbackUrl(confirmationUrl)}`
  return {
    subject: 'Reset your Relic Roster password',
    html: baseTemplate('Reset your Relic Roster password', body),
  }
}

function magicLinkTemplate(confirmationUrl: string): { subject: string; html: string } {
  const body = `
    <tr><td style="padding:36px 40px 28px;">
      <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#f0f2f7;line-height:1.3;">Your sign-in link</p>
      <p style="margin:0 0 28px;font-size:15px;color:#8a93a8;line-height:1.6;">
        Click the button below to sign in to your Relic Roster account. This link can only be used once.
      </p>
      ${ctaButton(confirmationUrl, 'Sign In to Relic Roster')}
      <p style="margin:24px 0 0;font-size:13px;color:#5a6278;text-align:center;line-height:1.5;">
        This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
      </p>
    </td></tr>
    ${fallbackUrl(confirmationUrl)}`
  return {
    subject: 'Your Relic Roster sign-in link',
    html: baseTemplate('Your Relic Roster sign-in link', body),
  }
}

function emailChangeTemplate(confirmationUrl: string, newEmail: string): { subject: string; html: string } {
  const body = `
    <tr><td style="padding:36px 40px 28px;">
      <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#f0f2f7;line-height:1.3;">Confirm your new email</p>
      <p style="margin:0 0 28px;font-size:15px;color:#8a93a8;line-height:1.6;">
        Click the button below to confirm your new email address <strong style="color:#f0f2f7;">${newEmail}</strong>.
      </p>
      ${ctaButton(confirmationUrl, 'Confirm New Email')}
      <p style="margin:24px 0 0;font-size:13px;color:#5a6278;text-align:center;line-height:1.5;">
        This link expires in 24 hours. If you didn't request this change, please contact support immediately.
      </p>
    </td></tr>
    ${fallbackUrl(confirmationUrl)}`
  return {
    subject: 'Confirm your new Relic Roster email',
    html: baseTemplate('Confirm your new Relic Roster email', body),
  }
}

function inviteTemplate(confirmationUrl: string): { subject: string; html: string } {
  const body = `
    <tr><td style="padding:36px 40px 28px;">
      <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#f0f2f7;line-height:1.3;">You've been invited</p>
      <p style="margin:0 0 28px;font-size:15px;color:#8a93a8;line-height:1.6;">
        You've been invited to join Relic Roster — the platform for tracking your sports memorabilia collection.
        Click the button below to accept your invitation and set up your account.
      </p>
      ${ctaButton(confirmationUrl, 'Accept Invitation')}
      <p style="margin:24px 0 0;font-size:13px;color:#5a6278;text-align:center;line-height:1.5;">
        This link expires in 24 hours.
      </p>
    </td></tr>
    ${fallbackUrl(confirmationUrl)}`
  return {
    subject: "You've been invited to Relic Roster",
    html: baseTemplate("You've been invited to Relic Roster", body),
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) {
    console.error('RESEND_API_KEY secret not set')
    // Return 200 so Supabase doesn't fall back to Lovable SMTP
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let payload: {
    user: { email: string; new_email?: string }
    email_data: {
      token: string
      token_hash: string
      redirect_to: string
      email_action_type: string
      site_url: string
      token_new?: string
      token_hash_new?: string
    }
  }

  try {
    payload = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { user, email_data } = payload
  const actionType = email_data?.email_action_type
  const confirmationUrl = email_data?.site_url
    ? `${email_data.site_url}/auth/v1/verify?token=${email_data.token_hash}&type=${actionType}&redirect_to=${email_data.redirect_to}`
    : email_data?.redirect_to

  let template: { subject: string; html: string }

  switch (actionType) {
    case 'signup':
    case 'email_confirmation':
      template = signupTemplate(confirmationUrl)
      break
    case 'recovery':
      template = recoveryTemplate(confirmationUrl)
      break
    case 'magiclink':
      template = magicLinkTemplate(confirmationUrl)
      break
    case 'email_change':
      template = emailChangeTemplate(confirmationUrl, user.new_email || user.email)
      break
    case 'invite':
      template = inviteTemplate(confirmationUrl)
      break
    default:
      console.warn('Unknown email action type:', actionType)
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
  }

  try {
    const resend = new Resend(resendApiKey)
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [user.email],
      subject: template.subject,
      html: template.html,
    })

    if (error) {
      console.error('Resend send error:', error)
      // Still return 200 — log the error but don't fall back to Lovable SMTP
      return new Response(JSON.stringify({ error: error.message }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Email sent via Resend:', { actionType, to: user.email })
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Resend exception:', msg)
    return new Response(JSON.stringify({ error: msg }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
