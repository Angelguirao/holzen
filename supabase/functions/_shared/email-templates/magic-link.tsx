/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your login link for Holzen</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>HOLZEN</Text>
        <Heading style={h1}>Your login link</Heading>
        <Text style={text}>
          Use the link below to sign in. It will expire shortly.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Sign in
        </Button>
        <Text style={footer}>
          If you didn't request this, you can ignore this message.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 24px', maxWidth: '400px' }
const brand = {
  fontSize: '11px',
  fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
  letterSpacing: '2px',
  color: '#6e7074',
  margin: '0 0 24px',
}
const h1 = {
  fontSize: '16px',
  fontWeight: '500' as const,
  fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
  color: '#252628',
  margin: '0 0 16px',
}
const text = {
  fontSize: '14px',
  color: '#6e7074',
  lineHeight: '1.6',
  margin: '0 0 24px',
}
const button = {
  backgroundColor: '#252628',
  color: '#f8f6f3',
  fontSize: '12px',
  fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
  borderRadius: '4px',
  padding: '12px 20px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
