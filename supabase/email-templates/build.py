#!/usr/bin/env python3
"""
FreshBasket auth email templates for Supabase.

    python3 supabase/email-templates/build.py            # writes preview.html + templates.json
    python3 supabase/email-templates/build.py --stdout   # prints the Management API payload

templates.json is the body for PATCH /v1/projects/<ref>/config/auth.
Email HTML rules followed here: table layout, inline styles only, no web
fonts or external images (Gmail/Outlook strip or block them), a hidden
preheader, and a "bulletproof" button that still works in Outlook.
"""
import json
import os
import sys

BRAND = {
    'forest': '#0f2c1d',
    'green': '#1a663b',
    'mint': '#3ed481',
    'gold': '#f5b82e',
    'ink': '#112a1d',
    'muted': '#5a7165',
    'line': '#e2efe6',
    'bg': '#eef5f0',
    'soft': '#f4f9f5',
}
SUPPORT_PHONE = '+880 1711-000000'
SUPPORT_EMAIL = 'support@freshbasket.com.bd'
SERIF = "Georgia,'Times New Roman',serif"
SANS = "'Segoe UI',Roboto,Helvetica,Arial,sans-serif"


def button(href: str, label: str) -> str:
    b = BRAND
    return f'''<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:8px auto 0">
  <tr>
    <td align="center" bgcolor="{b['green']}" style="border-radius:999px;background:{b['green']};background-image:linear-gradient(135deg,{b['green']} 0%,#2ca05d 100%);box-shadow:0 10px 24px -8px rgba(26,102,59,.55)">
      <a href="{href}" target="_blank" style="display:inline-block;padding:15px 34px;font-family:{SANS};font-size:15px;font-weight:700;line-height:1;color:#ffffff;text-decoration:none;border-radius:999px;letter-spacing:.2px">{label}&nbsp;&rarr;</a>
    </td>
  </tr>
</table>'''


def code_box(code: str) -> str:
    b = BRAND
    return f'''<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:8px auto 0">
  <tr>
    <td align="center" style="background:{b['soft']};border:1px dashed #b9d8c5;border-radius:18px;padding:18px 34px">
      <span style="font-family:'SFMono-Regular',Consolas,'Courier New',monospace;font-size:32px;font-weight:700;letter-spacing:10px;color:{b['forest']}">{code}</span>
    </td>
  </tr>
</table>'''


def fallback_link(href: str) -> str:
    b = BRAND
    return f'''<tr>
  <td class="fb-pad" style="padding:26px 40px 0">
    <p style="margin:0 0 8px;font-family:{SANS};font-size:12px;color:{b['muted']}">Button not working? Copy and paste this link into your browser:</p>
    <p style="margin:0;padding:12px 14px;background:{b['soft']};border:1px solid {b['line']};border-radius:12px;font-family:'SFMono-Regular',Consolas,monospace;font-size:11px;line-height:1.5;color:{b['green']};word-break:break-all">
      <a href="{href}" style="color:{b['green']};text-decoration:none">{href}</a>
    </p>
  </td>
</tr>'''


def notice(icon: str, text: str, tone: str = 'info') -> str:
    bg, border, color = {
        'info': ('#f4f9f5', '#d5e9dc', '#14522f'),
        'warn': ('#fffbeb', '#fde68a', '#78350f'),
    }[tone]
    return f'''<tr>
  <td class="fb-pad" style="padding:24px 40px 0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="background:{bg};border:1px solid {border};border-radius:14px;padding:14px 16px;font-family:{SANS};font-size:13px;line-height:1.55;color:{color}">
          <span style="font-size:15px">{icon}</span>&nbsp; {text}
        </td>
      </tr>
    </table>
  </td>
</tr>'''


def trust_strip() -> str:
    b = BRAND
    cell = lambda icon, title, sub: f'''<td width="33%" align="center" valign="top" style="padding:0 6px">
          <div style="font-size:22px;line-height:1">{icon}</div>
          <div style="margin-top:8px;font-family:{SANS};font-size:12px;font-weight:700;color:{b['ink']}">{title}</div>
          <div style="margin-top:2px;font-family:{SANS};font-size:11px;color:{b['muted']}">{sub}</div>
        </td>'''
    return f'''<tr>
  <td style="padding:32px 28px 30px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid {b['line']};padding-top:24px">
      <tr>
        {cell('🚚', 'Same-day delivery', 'Across Dhaka')}
        {cell('🥬', 'Fresh guarantee', 'Replaced at your door')}
        {cell('💵', 'Cash on delivery', 'or pay online')}
      </tr>
    </table>
  </td>
</tr>'''


def layout(*, preheader: str, eyebrow: str, title: str, intro: str, body_rows: str, reason: str) -> str:
    b = BRAND
    return f'''<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>{title}</title>
<style>
  @media only screen and (max-width:600px) {{
    .fb-wrap {{ padding:16px 10px !important; }}
    .fb-pad {{ padding-left:24px !important; padding-right:24px !important; }}
    .fb-title {{ font-size:26px !important; }}
    .fb-hide {{ display:none !important; }}
  }}
</style>
</head>
<body style="margin:0;padding:0;background:{b['bg']};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">{preheader}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="{b['bg']}" style="background:{b['bg']}">
  <tr>
    <td align="center" class="fb-wrap" style="padding:36px 16px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px">

        <!-- Header -->
        <tr>
          <td bgcolor="{b['forest']}" style="background:{b['forest']};background-image:linear-gradient(135deg,{b['forest']} 0%,#1c4d33 100%);border-radius:28px 28px 0 0;padding:30px 40px 34px" class="fb-pad">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td valign="middle">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="44" height="44" align="center" valign="middle" bgcolor="{b['green']}" style="width:44px;height:44px;border-radius:14px;background:{b['green']};background-image:linear-gradient(135deg,{b['green']} 0%,#2ca05d 100%);font-size:22px;line-height:44px">🌿</td>
                      <td style="padding-left:12px;font-family:{SERIF};font-size:24px;font-weight:700;letter-spacing:-.3px;color:#ffffff">Fresh<span style="color:{b['mint']}">Basket</span></td>
                    </tr>
                  </table>
                </td>
                <td align="right" valign="middle" class="fb-hide" style="font-family:{SANS};font-size:11px;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;color:#9abda9">Dhaka&nbsp;·&nbsp;Fresh&nbsp;daily</td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Gold accent -->
        <tr><td height="4" bgcolor="{b['gold']}" style="height:4px;line-height:4px;font-size:0;background:{b['gold']};background-image:linear-gradient(90deg,{b['gold']} 0%,#f7cd62 50%,{b['mint']} 100%)">&nbsp;</td></tr>

        <!-- Card -->
        <tr>
          <td bgcolor="#ffffff" style="background:#ffffff;border-radius:0 0 28px 28px;box-shadow:0 24px 48px -24px rgba(15,44,29,.22)">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="fb-pad" style="padding:40px 40px 0">
                  <span style="display:inline-block;padding:6px 12px;border-radius:999px;background:#e5f4eb;border:1px solid #c5e5d2;font-family:{SANS};font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#165b34">{eyebrow}</span>
                  <h1 class="fb-title" style="margin:16px 0 0;font-family:{SERIF};font-size:30px;line-height:1.2;font-weight:700;letter-spacing:-.4px;color:{b['ink']}">{title}</h1>
                  <p style="margin:14px 0 0;font-family:{SANS};font-size:15px;line-height:1.65;color:#445c50">{intro}</p>
                </td>
              </tr>
              {body_rows}
              {trust_strip()}
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding:28px 24px 8px;font-family:{SANS}">
            <p style="margin:0;font-size:13px;color:{b['ink']};font-weight:600">Need help? We&rsquo;re here 7&nbsp;AM&nbsp;–&nbsp;11&nbsp;PM</p>
            <p style="margin:6px 0 0;font-size:13px;color:{b['muted']}">
              <a href="tel:+8801711000000" style="color:{b['green']};text-decoration:none;font-weight:600">{SUPPORT_PHONE}</a>
              &nbsp;·&nbsp;
              <a href="mailto:{SUPPORT_EMAIL}" style="color:{b['green']};text-decoration:none;font-weight:600">{SUPPORT_EMAIL}</a>
            </p>
            <p style="margin:18px 0 0;font-size:11px;line-height:1.6;color:#7e9688">{reason}<br>FreshBasket · Dhaka Delivery Hub, Bangladesh</p>
            <p style="margin:10px 0 0;font-size:11px;color:#9ab5a5">© 2026 FreshBasket Bangladesh</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>'''


def action_email(*, preheader, eyebrow, title, intro, href, cta, notice_html, reason):
    rows = f'''<tr><td class="fb-pad" align="center" style="padding:30px 40px 0">{button(href, cta)}</td></tr>
{notice_html}
{fallback_link(href)}'''
    return layout(preheader=preheader, eyebrow=eyebrow, title=title, intro=intro, body_rows=rows, reason=reason)


def info_email(*, preheader, eyebrow, title, intro, notice_html, reason, cta_href='{{ .SiteURL }}/forgot-password', cta='Secure my account'):
    rows = f'''{notice_html}
<tr><td class="fb-pad" align="center" style="padding:26px 40px 0">{button(cta_href, cta)}</td></tr>'''
    return layout(preheader=preheader, eyebrow=eyebrow, title=title, intro=intro, body_rows=rows, reason=reason)


CB = '{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}'
NOT_YOU = "Didn&rsquo;t ask for this? You can safely ignore this email &mdash; nothing changes until the link is used."
SECURITY_REASON = 'You&rsquo;re receiving this security notice about your FreshBasket account.'

TEMPLATES = {
    'confirmation': (
        'Your FreshBasket verification code: {{ .Token }}',
        layout(
            preheader='Your verification code is {{ .Token }} — it expires in 10 minutes.',
            eyebrow='Welcome aboard',
            title='Here&rsquo;s your verification code',
            intro='Thanks for joining FreshBasket! Enter this code on the sign-up screen to verify <strong style="color:#112a1d">{{ .Email }}</strong> and activate your account.',
            body_rows=f'''<tr><td class="fb-pad" align="center" style="padding:28px 40px 0">{code_box('{{ .Token }}')}</td></tr>
{notice('⏱️', 'This code expires in 10 minutes and can be used once. Never share it &mdash; FreshBasket staff will never ask for it.')}
{notice('🎁', 'First order? Use code <strong>WELCOME50</strong> for ৳50 off on orders over ৳500.')}''',
            reason='You&rsquo;re receiving this because this email was used to create a FreshBasket account. If that wasn&rsquo;t you, ignore this email.',
        ),
    ),
    'recovery': (
        'Reset your FreshBasket password',
        action_email(
            preheader='Use this secure link to choose a new password.',
            eyebrow='Password reset',
            title='Let&rsquo;s get you back into your basket',
            intro='We received a request to reset the password for <strong style="color:#112a1d">{{ .Email }}</strong>. Tap the button below to choose a new one.',
            href=f'{CB}&type=recovery&next=/reset-password',
            cta='Choose a new password',
            notice_html=notice('🔒', f'This link expires in 1 hour and works only once. {NOT_YOU}'),
            reason='You&rsquo;re receiving this because a password reset was requested for your FreshBasket account.',
        ),
    ),
    'magic_link': (
        'Your FreshBasket sign-in link',
        action_email(
            preheader='Your one-tap sign-in link is inside.',
            eyebrow='Sign in',
            title='Your sign-in link is ready',
            intro='Tap below to sign in to FreshBasket as <strong style="color:#112a1d">{{ .Email }}</strong>. No password needed.',
            href=f'{CB}&type=email&next=/account',
            cta='Sign me in',
            notice_html=notice('⏱️', f'For your security this link expires shortly and can be used only once. {NOT_YOU}'),
            reason='You&rsquo;re receiving this because a sign-in link was requested for your FreshBasket account.',
        ),
    ),
    'email_change': (
        'Confirm your new email address',
        action_email(
            preheader='Confirm the new email address for your FreshBasket account.',
            eyebrow='Email change',
            title='Confirm your new email address',
            intro='You asked to change your FreshBasket email from <strong style="color:#112a1d">{{ .Email }}</strong> to <strong style="color:#112a1d">{{ .NewEmail }}</strong>. Confirm to finish the switch.',
            href=f'{CB}&type=email_change&next=/account/profile',
            cta='Confirm new email',
            notice_html=notice('⚠️', 'If you didn&rsquo;t request this change, ignore this email and reset your password right away.', 'warn'),
            reason=SECURITY_REASON,
        ),
    ),
    'invite': (
        'You’re invited to FreshBasket',
        action_email(
            preheader='Accept your invitation to FreshBasket.',
            eyebrow='You&rsquo;re invited',
            title='Join FreshBasket',
            intro='You&rsquo;ve been invited to create a FreshBasket account for <strong style="color:#112a1d">{{ .Email }}</strong>. Accept below to set it up.',
            href=f'{CB}&type=invite&next=/reset-password',
            cta='Accept invitation',
            notice_html=notice('🌿', 'After accepting you&rsquo;ll be asked to choose a password.'),
            reason='You&rsquo;re receiving this because someone invited this email to FreshBasket.',
        ),
    ),
    'reauthentication': (
        'Your FreshBasket verification code',
        layout(
            preheader='Your verification code is {{ .Token }}',
            eyebrow='Verification',
            title='Confirm it&rsquo;s really you',
            intro='Enter this code to confirm a sensitive change to your FreshBasket account.',
            body_rows=f'''<tr><td class="fb-pad" align="center" style="padding:28px 40px 0">{code_box('{{ .Token }}')}</td></tr>
{notice('🔒', 'This code expires shortly. Never share it with anyone &mdash; FreshBasket staff will never ask for it.')}''',
            reason=SECURITY_REASON,
        ),
    ),
    'password_changed_notification': (
        'Your FreshBasket password was changed',
        info_email(
            preheader='Your password was just changed.',
            eyebrow='Security notice',
            title='Your password was changed',
            intro='The password for <strong style="color:#112a1d">{{ .Email }}</strong> was just updated. If this was you, you&rsquo;re all set.',
            notice_html=notice('⚠️', 'Wasn&rsquo;t you? Reset your password immediately and contact our support team.', 'warn'),
            reason=SECURITY_REASON,
        ),
    ),
    'email_changed_notification': (
        'Your FreshBasket email was changed',
        info_email(
            preheader='The email on your account was changed.',
            eyebrow='Security notice',
            title='Your email address was changed',
            intro='Your FreshBasket account email changed from <strong style="color:#112a1d">{{ .OldEmail }}</strong> to <strong style="color:#112a1d">{{ .Email }}</strong>.',
            notice_html=notice('⚠️', 'Didn&rsquo;t make this change? Contact our support team right away so we can secure your account.', 'warn'),
            reason=SECURITY_REASON,
            cta_href=f'mailto:{SUPPORT_EMAIL}',
            cta='Contact support',
        ),
    ),
}


def payload() -> dict:
    out = {}
    for key, (subject, html) in TEMPLATES.items():
        out[f'mailer_subjects_{key}'] = subject
        out[f'mailer_templates_{key}_content'] = html
    return out


if __name__ == '__main__':
    data = payload()
    if '--stdout' in sys.argv:
        print(json.dumps(data))
        sys.exit(0)
    here = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(here, 'templates.json'), 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    sample = {'{{ .Email }}': 'customer@example.com', '{{ .NewEmail }}': 'new@example.com', '{{ .OldEmail }}': 'old@example.com',
              '{{ .Token }}': '482915', '{{ .TokenHash }}': 'sample-token-hash', '{{ .SiteURL }}': 'http://localhost:3000'}
    frames = []
    for key, (subject, html) in TEMPLATES.items():
        for k, v in sample.items():
            html = html.replace(k, v)
        frames.append(f'<h2 style="font-family:sans-serif;margin:40px 0 8px">{key} — “{subject}”</h2>'
                      f'<iframe srcdoc="{html.replace(chr(38), "&amp;").replace(chr(34), "&quot;")}" style="width:100%;max-width:680px;height:980px;border:1px solid #ddd;border-radius:12px;background:#fff"></iframe>')
    with open(os.path.join(here, 'preview.html'), 'w') as f:
        f.write('<!doctype html><meta charset="utf-8"><title>FreshBasket emails</title><body style="background:#f6f6f6;padding:24px">' + ''.join(frames))
    print(f'Wrote {len(TEMPLATES)} templates → templates.json and preview.html')
