/// <reference types="npm:@types/react@18.3.23" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'holzen'
const SITE_URL = 'https://holzen.app'

// Mirrors the in-app CheckoutConfirmation dialog rows. All fields are optional —
// the sender (notify-checkout-confirmation) computes them from the
// subscription / wallet snapshot at the moment of the redirect.
interface CheckoutConfirmationProps {
  mode?: 'subscription' | 'flex_pack_s' | 'flex_pack_m'
  // Subscription summary
  tierLabel?: string
  isTrialing?: boolean
  trialStart?: string | null
  firstChargeAt?: string | null
  monthlyPrice?: string
  companionUnlocks?: number
  wallpapers?: number
  flexCreditsBalance?: number
  // Flex pack summary
  packLabel?: string
  previousBalance?: number
  creditsAdded?: number
  newBalance?: number
}

const CheckoutConfirmationEmail = ({
  mode = 'subscription',
  tierLabel = 'Pro',
  isTrialing = false,
  trialStart,
  firstChargeAt,
  monthlyPrice,
  companionUnlocks,
  wallpapers,
  flexCreditsBalance,
  packLabel,
  previousBalance,
  creditsAdded,
  newBalance,
}: CheckoutConfirmationProps) => {
  const isSub = mode === 'subscription'
  const heading = isSub ? `Holzen ${tierLabel} subscription` : 'Flex credits added'
  const intro = isSub
    ? isTrialing
      ? 'Trial started. Manage or cancel anytime in Settings.'
      : 'Subscription active. Manage or cancel anytime in Settings.'
    : 'Flex credits applied. Updated balance below.'

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{heading}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>HOLZEN</Text>
          <Heading style={h1}>{heading}</Heading>
          <Text style={text}>{intro}</Text>

          <Section style={summary}>
            {isSub ? (
              <>
                <Row label="Plan" value={`Holzen ${tierLabel}`} />
                {isTrialing && trialStart ? (
                  <Row label="Trial started" value={trialStart} />
                ) : null}
                <Row
                  label={isTrialing ? 'First charge on' : 'Next charge on'}
                  value={firstChargeAt ?? '—'}
                  highlight
                />
                {monthlyPrice ? <Row label="Monthly price" value={monthlyPrice} /> : null}
                {typeof companionUnlocks === 'number' ? (
                  <Row label="Pause companions / month" value={String(companionUnlocks)} />
                ) : null}
                {typeof wallpapers === 'number' ? (
                  <Row label="Wallpapers / month" value={String(wallpapers)} />
                ) : null}
                {typeof flexCreditsBalance === 'number' ? (
                  <Row label="Flex credits balance" value={String(flexCreditsBalance)} />
                ) : null}
              </>
            ) : (
              <>
                <Row label="Pack" value={packLabel ?? 'Flex Pack'} />
                {typeof previousBalance === 'number' ? (
                  <Row label="Previous balance" value={String(previousBalance)} />
                ) : null}
                {typeof creditsAdded === 'number' ? (
                  <Row label="Credits added" value={`+${creditsAdded}`} highlight />
                ) : null}
                {typeof newBalance === 'number' ? (
                  <Row label="New balance" value={String(newBalance)} highlight />
                ) : null}
              </>
            )}
          </Section>

          <Button style={button} href={`${SITE_URL}/settings`}>
            Manage subscription
          </Button>

          <Hr style={hr} />
          <Text style={footer}>
            Hold steady.<br />
            The {SITE_NAME} team
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const Row = ({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) => (
  <table style={{ width: '100%', borderCollapse: 'collapse', margin: '0 0 8px' }}>
    <tbody>
      <tr>
        <td style={rowLabel}>{label}</td>
        <td style={highlight ? rowValueHighlight : rowValue}>{value}</td>
      </tr>
    </tbody>
  </table>
)

export const template = {
  component: CheckoutConfirmationEmail as React.ComponentType<Record<string, unknown>>,
  subject: (data: Record<string, unknown>) =>
    data.mode === 'subscription'
      ? `Holzen ${String(data.tierLabel ?? 'Pro')} subscription confirmed`
      : 'Holzen flex credits added',
  displayName: 'Checkout confirmation',
  previewData: {
    mode: 'subscription',
    tierLabel: 'Pro',
    isTrialing: true,
    trialStart: 'Apr 22, 2026',
    firstChargeAt: 'Apr 29, 2026',
    monthlyPrice: '$4.99',
    companionUnlocks: 12,
    wallpapers: 5,
    flexCreditsBalance: 0,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 24px', maxWidth: '440px' }
const brand = {
  fontSize: '11px',
  fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
  letterSpacing: '2px',
  color: '#6e7074',
  margin: '0 0 24px',
}
const h1 = {
  fontSize: '18px',
  fontWeight: '500' as const,
  fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
  color: '#252628',
  margin: '0 0 12px',
}
const text = { fontSize: '14px', color: '#6e7074', lineHeight: '1.6', margin: '0 0 20px' }
const summary = {
  border: '1px solid #e5e5e5',
  borderRadius: '6px',
  padding: '16px 18px',
  margin: '0 0 24px',
  backgroundColor: '#fafafa',
}
const rowLabel = {
  fontSize: '13px',
  color: '#6e7074',
  padding: '4px 0',
  textAlign: 'left' as const,
}
const rowValue = {
  fontSize: '13px',
  color: '#252628',
  padding: '4px 0',
  textAlign: 'right' as const,
  fontWeight: '500' as const,
}
const rowValueHighlight = {
  ...rowValue,
  color: '#1f6feb',
  fontWeight: '600' as const,
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
const hr = { borderColor: '#eeeeee', margin: '24px 0 16px' }
const footer = { fontSize: '12px', color: '#999999', lineHeight: '1.6', margin: '0' }
