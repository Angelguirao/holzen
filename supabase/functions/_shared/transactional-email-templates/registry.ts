/// <reference types="npm:@types/react@18.3.23" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<Record<string, unknown>>
  subject: string | ((data: Record<string, unknown>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, unknown>
}

import { template as welcome } from './welcome.tsx'
import { template as checkoutConfirmation } from './checkout-confirmation.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'welcome': welcome,
  'checkout-confirmation': checkoutConfirmation,
}
