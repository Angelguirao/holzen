/// <reference types="npm:@types/react@18.3.23" />
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
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'holzen'
const SITE_URL = 'https://holzen.app'

interface WelcomeEmailProps {
  firstName?: string
}

const WelcomeEmail = ({ firstName }: WelcomeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to Holzen — pause, breathe, hold steady.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>HOLZEN</Text>
        <Heading style={h1}>
          {firstName ? `Welcome, ${firstName}.` : 'Welcome.'}
        </Heading>
        <Text style={text}>
          Holzen is a quiet companion for volatile markets. When Bitcoin moves,
          you pause — not react.
        </Text>
        <Text style={text}>
          Set your threshold, and we'll be here when the market gets loud.
        </Text>
        <Button style={button} href={SITE_URL}>
          Open Holzen
        </Button>
        <Text style={footer}>
          Hold steady.<br />
          The {SITE_NAME} team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeEmail as React.ComponentType<Record<string, unknown>>,
  subject: 'Welcome to Holzen',
  displayName: 'Welcome email',
  previewData: { firstName: 'Satoshi' },
} satisfies TemplateEntry

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
  margin: '0 0 20px',
}
const button = {
  backgroundColor: '#252628',
  color: '#f8f6f3',
  fontSize: '12px',
  fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
  borderRadius: '4px',
  padding: '12px 20px',
  textDecoration: 'none',
  margin: '8px 0 24px',
}
const footer = { fontSize: '12px', color: '#999999', lineHeight: '1.6', margin: '32px 0 0' }
