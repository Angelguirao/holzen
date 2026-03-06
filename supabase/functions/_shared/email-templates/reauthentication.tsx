/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>HOLZEN</Text>
        <Heading style={h1}>Verification code</Heading>
        <Text style={text}>Use this code to confirm your identity:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          This code expires shortly. If you didn't request it, ignore this message.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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
const codeStyle = {
  fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
  fontSize: '22px',
  fontWeight: '500' as const,
  color: '#252628',
  margin: '0 0 32px',
}
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
