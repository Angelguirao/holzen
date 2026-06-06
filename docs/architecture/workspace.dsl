/*
 * Holzen — Structurizr workspace (C4 Level 1 + 2).
 * Open in Structurizr Lite: https://structurizr.com/help/lite
 * Or: structurizr-cli export -workspace workspace.dsl -format plantuml
 */

workspace "Holzen" "Volatility-triggered investor pause practice — system and container views" {

    model {
        user = person "Holzen user" "Uses pause rituals, archive, journey, and companions in the browser."

        holzen = softwareSystem "Holzen" "Volatility-triggered investor pause practice: SPA plus serverless APIs and data." {
            spa = container "Web application" "UI, routing, auth session, TanStack Query, PWA." "React, TypeScript, Vite"
            edge = container "Edge functions" "HTTP APIs: reflection, companions, Stripe, notifications, cron webhooks." "Deno, TypeScript"
        }

        supabase = softwareSystem "Supabase" "Postgres, Row Level Security, Auth, Edge Function runtime, storage." {
            tag "External"
        }

        stripe = softwareSystem "Stripe" "Checkout, subscriptions, customer portal; webhooks to Holzen." {
            tag "External"
        }

        ai = softwareSystem "AI and search APIs" "Model APIs and web search for companions (e.g. orchestration, Signal)." {
            tag "External"
        }

        email = softwareSystem "Email provider" "Transactional email from edge functions." {
            tag "External"
        }

        push = softwareSystem "Web push infrastructure" "VAPID and delivery for notifications." {
            tag "External"
        }

        user -> spa "Uses" "HTTPS"

        spa -> supabase "Auth, data, invokes functions" "HTTPS / WSS"
        edge -> supabase "Service role, secrets, runtime" "HTTPS"

        spa -> stripe "Checkout and billing UX" "HTTPS"
        edge -> stripe "Webhooks, subscription API" "HTTPS"

        edge -> ai "Companion generation" "HTTPS"
        edge -> email "Sends mail" "HTTPS"
        edge -> push "Push-related operations" "HTTPS"
    }

    views {
        systemContext holzen "Holzen-SystemContext" {
            include *
            autolayout lr
        }

        container holzen "Holzen-Containers" {
            include *
            autolayout lr
        }

        styles {
            element "Person" {
                shape Person
            }
            element "External" {
                background #999999
                color #ffffff
            }
        }
    }
}
