/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Column,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

const LOGO_URL = 'https://kpnhflqrfasuprrmposf.supabase.co/storage/v1/object/public/email-assets/logo.png'
const ICON_URL = 'https://app.relicroster.com/icon-512.png'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName = 'Relic Roster',
  siteUrl = 'https://relicroster.com',
  recipient = '',
  confirmationUrl = '',
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your Relic Roster account to start tracking your collection.</Preview>
    <Body style={main}>

      {/* Outer wrapper */}
      <Container style={outer}>

        {/* Card */}
        <Section style={card}>

          {/* Gold top bar */}
          <Section style={goldBar} />

          {/* Logo header */}
          <Section style={header}>
            <Img
              src={LOGO_URL}
              alt={siteName}
              width="173"
              height="32"
              style={logoImg}
            />
          </Section>

          <Hr style={divider} />

          {/* Body */}
          <Section style={body}>
            <Text style={heading}>Confirm your account</Text>
            <Text style={subtext}>
              You're one step away from managing your sports memorabilia collection.
              Click the button below to verify your email address and activate your account.
            </Text>

            <Button style={ctaButton} href={confirmationUrl}>
              Confirm My Account
            </Button>

            <Text style={expiry}>
              This link expires in 24 hours. If you didn't create an account,
              you can safely ignore this email.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Fallback URL */}
          <Section style={fallbackSection}>
            <Text style={fallbackLabel}>
              If the button above doesn't work, copy and paste this URL into your browser:
            </Text>
            <Link href={confirmationUrl} style={fallbackLink}>
              {confirmationUrl}
            </Link>
          </Section>

          {/* Footer */}
          <Section style={footerSection}>
            <Row>
              <Column>
                <Text style={footerText}>
                  © 2025 Relic Roster. All rights reserved.{'\n'}
                  <Link href={siteUrl} style={footerLink}>relicroster.com</Link>
                </Text>
              </Column>
              <Column align="right">
                <Img
                  src={ICON_URL}
                  alt=""
                  width="28"
                  height="28"
                  style={footerIcon}
                />
              </Column>
            </Row>
          </Section>

        </Section>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

// ─── Styles ───────────────────────────────────────────────────────────────────

const main: React.CSSProperties = {
  backgroundColor: '#0b0d12',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  margin: '0',
  padding: '0',
}

const outer: React.CSSProperties = {
  maxWidth: '520px',
  margin: '40px auto',
  padding: '0 16px',
}

const card: React.CSSProperties = {
  backgroundColor: '#12151e',
  border: '1px solid #1e2231',
  borderRadius: '16px',
  overflow: 'hidden',
}

const goldBar: React.CSSProperties = {
  backgroundColor: '#ffbf00',
  height: '4px',
  margin: '0',
  padding: '0',
}

const header: React.CSSProperties = {
  padding: '36px 40px 28px',
  textAlign: 'center',
}

const logoImg: React.CSSProperties = {
  display: 'block',
  margin: '0 auto',
  border: '0',
}

const divider: React.CSSProperties = {
  borderTop: '1px solid #1e2231',
  margin: '0 40px',
}

const body: React.CSSProperties = {
  padding: '36px 40px 28px',
}

const heading: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 'bold',
  color: '#f0f2f7',
  lineHeight: '1.3',
  margin: '0 0 12px',
}

const subtext: React.CSSProperties = {
  fontSize: '15px',
  color: '#8a93a8',
  lineHeight: '1.6',
  margin: '0 0 28px',
}

const ctaButton: React.CSSProperties = {
  backgroundColor: '#ffbf00',
  color: '#000000',
  fontSize: '15px',
  fontWeight: 'bold',
  borderRadius: '8px',
  padding: '14px 36px',
  textDecoration: 'none',
  display: 'block',
  textAlign: 'center',
}

const expiry: React.CSSProperties = {
  fontSize: '13px',
  color: '#5a6278',
  textAlign: 'center',
  lineHeight: '1.5',
  margin: '24px 0 0',
}

const fallbackSection: React.CSSProperties = {
  padding: '20px 40px 24px',
}

const fallbackLabel: React.CSSProperties = {
  fontSize: '12px',
  color: '#5a6278',
  lineHeight: '1.6',
  margin: '0 0 6px',
}

const fallbackLink: React.CSSProperties = {
  fontSize: '12px',
  color: '#ffbf00',
  wordBreak: 'break-all',
  textDecoration: 'none',
}

const footerSection: React.CSSProperties = {
  backgroundColor: '#0d0f16',
  borderTop: '1px solid #1e2231',
  padding: '20px 40px 28px',
}

const footerText: React.CSSProperties = {
  fontSize: '12px',
  color: '#3d4459',
  lineHeight: '1.5',
  margin: '0',
  whiteSpace: 'pre-line',
}

const footerLink: React.CSSProperties = {
  color: '#5a6278',
  textDecoration: 'none',
}

const footerIcon: React.CSSProperties = {
  display: 'block',
  borderRadius: '6px',
  opacity: 0.5,
}
