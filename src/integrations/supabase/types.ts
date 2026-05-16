export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      app_config: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          after: Json | null
          before: Json | null
          cid: string | null
          created_at: string
          id: number
          metadata: Json | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          cid?: string | null
          created_at?: string
          id?: number
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          cid?: string | null
          created_at?: string
          id?: number
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      badge_definitions: {
        Row: {
          badge_id: string
          created_at: string
        }
        Insert: {
          badge_id: string
          created_at?: string
        }
        Update: {
          badge_id?: string
          created_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          body: string
          created_at: string
          excerpt: string | null
          id: string
          published: boolean
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      btc_price_cache: {
        Row: {
          date: string
          fetched_at: string
          price: number
        }
        Insert: {
          date: string
          fetched_at?: string
          price: number
        }
        Update: {
          date?: string
          fetched_at?: string
          price?: number
        }
        Relationships: []
      }
      changelog_entries: {
        Row: {
          changes: string[]
          created_at: string
          date: string
          id: string
          version: string
        }
        Insert: {
          changes?: string[]
          created_at?: string
          date: string
          id?: string
          version: string
        }
        Update: {
          changes?: string[]
          created_at?: string
          date?: string
          id?: string
          version?: string
        }
        Relationships: []
      }
      collection_items: {
        Row: {
          added_at: string
          collection_id: string
          id: string
          pause_instance_id: string
          position: number
        }
        Insert: {
          added_at?: string
          collection_id: string
          id?: string
          pause_instance_id: string
          position?: number
        }
        Update: {
          added_at?: string
          collection_id?: string
          id?: string
          pause_instance_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_pause_instance_id_fkey"
            columns: ["pause_instance_id"]
            isOneToOne: false
            referencedRelation: "pause_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_pause_instance_id_fkey"
            columns: ["pause_instance_id"]
            isOneToOne: false
            referencedRelation: "v_pause_archive_echoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_pause_instance_id_fkey"
            columns: ["pause_instance_id"]
            isOneToOne: false
            referencedRelation: "v_pause_archive_pauses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_pause_instance_id_fkey"
            columns: ["pause_instance_id"]
            isOneToOne: false
            referencedRelation: "v_pause_completed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_pause_instance_id_fkey"
            columns: ["pause_instance_id"]
            isOneToOne: false
            referencedRelation: "v_pause_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_pause_instance_id_fkey"
            columns: ["pause_instance_id"]
            isOneToOne: false
            referencedRelation: "v_pause_full"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      companion_cache: {
        Row: {
          automated_score: number | null
          citations: Json | null
          companion_type: string
          content: Json
          created_at: string
          emotion_bucket: string | null
          expires_at: string | null
          fingerprint: string | null
          id: string
          language: string
          last_served_at: string | null
          last_validated_at: string | null
          market_regime: string | null
          prompt_version: string | null
          quality_flags: Json | null
          quality_score: number
          source_author: string | null
          source_host: string | null
          source_kind: string | null
          source_title: string | null
          source_untrusted: boolean
          source_url: string | null
          thumbs_down: number | null
          thumbs_up: number | null
          title: string | null
          title_norm: string | null
          topic_slug: string | null
          used_count: number
          user_score: number | null
        }
        Insert: {
          automated_score?: number | null
          citations?: Json | null
          companion_type: string
          content: Json
          created_at?: string
          emotion_bucket?: string | null
          expires_at?: string | null
          fingerprint?: string | null
          id?: string
          language?: string
          last_served_at?: string | null
          last_validated_at?: string | null
          market_regime?: string | null
          prompt_version?: string | null
          quality_flags?: Json | null
          quality_score?: number
          source_author?: string | null
          source_host?: string | null
          source_kind?: string | null
          source_title?: string | null
          source_untrusted?: boolean
          source_url?: string | null
          thumbs_down?: number | null
          thumbs_up?: number | null
          title?: string | null
          title_norm?: string | null
          topic_slug?: string | null
          used_count?: number
          user_score?: number | null
        }
        Update: {
          automated_score?: number | null
          citations?: Json | null
          companion_type?: string
          content?: Json
          created_at?: string
          emotion_bucket?: string | null
          expires_at?: string | null
          fingerprint?: string | null
          id?: string
          language?: string
          last_served_at?: string | null
          last_validated_at?: string | null
          market_regime?: string | null
          prompt_version?: string | null
          quality_flags?: Json | null
          quality_score?: number
          source_author?: string | null
          source_host?: string | null
          source_kind?: string | null
          source_title?: string | null
          source_untrusted?: boolean
          source_url?: string | null
          thumbs_down?: number | null
          thumbs_up?: number | null
          title?: string | null
          title_norm?: string | null
          topic_slug?: string | null
          used_count?: number
          user_score?: number | null
        }
        Relationships: []
      }
      companion_fallbacks: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          payload: Json
          pool_type: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          payload: Json
          pool_type: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          payload?: Json
          pool_type?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      companion_serves: {
        Row: {
          cache_entry_id: string | null
          cache_relaxation: string | null
          companion_type: string
          content_fingerprint: string | null
          content_title: string | null
          created_at: string
          id: string
          latency_ms: number | null
          pause_instance_id: string | null
          serve_source: string
          user_id: string
        }
        Insert: {
          cache_entry_id?: string | null
          cache_relaxation?: string | null
          companion_type: string
          content_fingerprint?: string | null
          content_title?: string | null
          created_at?: string
          id?: string
          latency_ms?: number | null
          pause_instance_id?: string | null
          serve_source: string
          user_id: string
        }
        Update: {
          cache_entry_id?: string | null
          cache_relaxation?: string | null
          companion_type?: string
          content_fingerprint?: string | null
          content_title?: string | null
          created_at?: string
          id?: string
          latency_ms?: number | null
          pause_instance_id?: string | null
          serve_source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "companion_serves_cache_entry_id_fkey"
            columns: ["cache_entry_id"]
            isOneToOne: false
            referencedRelation: "companion_cache"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companion_serves_pause_instance_id_fkey"
            columns: ["pause_instance_id"]
            isOneToOne: false
            referencedRelation: "pause_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companion_serves_pause_instance_id_fkey"
            columns: ["pause_instance_id"]
            isOneToOne: false
            referencedRelation: "v_pause_archive_echoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companion_serves_pause_instance_id_fkey"
            columns: ["pause_instance_id"]
            isOneToOne: false
            referencedRelation: "v_pause_archive_pauses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companion_serves_pause_instance_id_fkey"
            columns: ["pause_instance_id"]
            isOneToOne: false
            referencedRelation: "v_pause_completed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companion_serves_pause_instance_id_fkey"
            columns: ["pause_instance_id"]
            isOneToOne: false
            referencedRelation: "v_pause_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companion_serves_pause_instance_id_fkey"
            columns: ["pause_instance_id"]
            isOneToOne: false
            referencedRelation: "v_pause_full"
            referencedColumns: ["id"]
          },
        ]
      }
      content_library: {
        Row: {
          active: boolean | null
          analogy: string | null
          asset_class: string | null
          author: string | null
          citation: string | null
          companion_types: string[] | null
          created_at: string | null
          event_date: string | null
          finding: string | null
          id: string
          key_quote: string | null
          language: string | null
          mood_tag: string | null
          original_publication: string | null
          original_url: string | null
          quality_score: number | null
          recovery: string | null
          summary: string
          tags: string[] | null
          title: string
          title_norm: string | null
          type: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          active?: boolean | null
          analogy?: string | null
          asset_class?: string | null
          author?: string | null
          citation?: string | null
          companion_types?: string[] | null
          created_at?: string | null
          event_date?: string | null
          finding?: string | null
          id?: string
          key_quote?: string | null
          language?: string | null
          mood_tag?: string | null
          original_publication?: string | null
          original_url?: string | null
          quality_score?: number | null
          recovery?: string | null
          summary: string
          tags?: string[] | null
          title: string
          title_norm?: string | null
          type: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          active?: boolean | null
          analogy?: string | null
          asset_class?: string | null
          author?: string | null
          citation?: string | null
          companion_types?: string[] | null
          created_at?: string | null
          event_date?: string | null
          finding?: string | null
          id?: string
          key_quote?: string | null
          language?: string | null
          mood_tag?: string | null
          original_publication?: string | null
          original_url?: string | null
          quality_score?: number | null
          recovery?: string | null
          summary?: string
          tags?: string[] | null
          title?: string
          title_norm?: string | null
          type?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
      credit_ledger: {
        Row: {
          created_at: string
          delta_credits: number
          feature: string | null
          id: string
          metadata: Json
          reason: string
          source: string
          source_ref: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          delta_credits: number
          feature?: string | null
          id?: string
          metadata?: Json
          reason: string
          source: string
          source_ref?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          delta_credits?: number
          feature?: string | null
          id?: string
          metadata?: Json
          reason?: string
          source?: string
          source_ref?: string | null
          user_id?: string
        }
        Relationships: []
      }
      credit_wallets: {
        Row: {
          balance_credits: number
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_credits?: number
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_credits?: number
          created_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          app_version: string | null
          category: string
          cid: string | null
          created_at: string
          error_stack: string | null
          id: string
          message: string
          page: string | null
          posthog_session_id: string | null
          sentry_event_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          app_version?: string | null
          category?: string
          cid?: string | null
          created_at?: string
          error_stack?: string | null
          id?: string
          message: string
          page?: string | null
          posthog_session_id?: string | null
          sentry_event_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          app_version?: string | null
          category?: string
          cid?: string | null
          created_at?: string
          error_stack?: string | null
          id?: string
          message?: string
          page?: string | null
          posthog_session_id?: string | null
          sentry_event_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      future_letters: {
        Row: {
          body: string
          btc_price_at_delivery: number | null
          btc_price_at_write: number
          deliver_during: string
          delivered: boolean
          delivered_at: string | null
          delivery_threshold: number | null
          id: string
          user_id: string
          written_at: string
          written_during: string
        }
        Insert: {
          body: string
          btc_price_at_delivery?: number | null
          btc_price_at_write: number
          deliver_during: string
          delivered?: boolean
          delivered_at?: string | null
          delivery_threshold?: number | null
          id?: string
          user_id: string
          written_at?: string
          written_during: string
        }
        Update: {
          body?: string
          btc_price_at_delivery?: number | null
          btc_price_at_write?: number
          deliver_during?: string
          delivered?: boolean
          delivered_at?: string | null
          delivery_threshold?: number | null
          id?: string
          user_id?: string
          written_at?: string
          written_during?: string
        }
        Relationships: []
      }
      generation_attempts: {
        Row: {
          attempt_order: number
          companion_type: string
          created_at: string
          error_message: string | null
          estimated_cost_usd: number | null
          id: string
          input_tokens: number | null
          latency_ms: number | null
          model: string
          output_tokens: number | null
          pause_instance_id: string | null
          provider: string
          quality_gate_reason: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          attempt_order?: number
          companion_type: string
          created_at?: string
          error_message?: string | null
          estimated_cost_usd?: number | null
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          model: string
          output_tokens?: number | null
          pause_instance_id?: string | null
          provider: string
          quality_gate_reason?: string | null
          status: string
          user_id?: string | null
        }
        Update: {
          attempt_order?: number
          companion_type?: string
          created_at?: string
          error_message?: string | null
          estimated_cost_usd?: number | null
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          model?: string
          output_tokens?: number | null
          pause_instance_id?: string | null
          provider?: string
          quality_gate_reason?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      graph_edges: {
        Row: {
          created_at: string
          id: string
          label: string | null
          source_id: string
          source_type: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string | null
          source_id: string
          source_type: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string | null
          source_id?: string
          source_type?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      grounding_enrichment_cache: {
        Row: {
          abstract: string | null
          citation_count: number | null
          citation_hash: string
          created_at: string
          doi: string | null
          expires_at: string
          id: string
          last_validated_at: string | null
          researchers: Json
          source_provenance: Json
          url: string | null
        }
        Insert: {
          abstract?: string | null
          citation_count?: number | null
          citation_hash: string
          created_at?: string
          doi?: string | null
          expires_at?: string
          id?: string
          last_validated_at?: string | null
          researchers?: Json
          source_provenance?: Json
          url?: string | null
        }
        Update: {
          abstract?: string | null
          citation_count?: number | null
          citation_hash?: string
          created_at?: string
          doi?: string | null
          expires_at?: string
          id?: string
          last_validated_at?: string | null
          researchers?: Json
          source_provenance?: Json
          url?: string | null
        }
        Relationships: []
      }
      monthly_feature_usage: {
        Row: {
          created_at: string
          feature: string
          id: string
          month_start: string
          updated_at: string
          used: number
          user_id: string
        }
        Insert: {
          created_at?: string
          feature: string
          id?: string
          month_start: string
          updated_at?: string
          used?: number
          user_id: string
        }
        Update: {
          created_at?: string
          feature?: string
          id?: string
          month_start?: string
          updated_at?: string
          used?: number
          user_id?: string
        }
        Relationships: []
      }
      night_reflections: {
        Row: {
          btc_change_percent: number
          btc_direction: string
          created_at: string
          dismissed: boolean
          had_reflection: boolean
          id: string
          message: string
          user_id: string
        }
        Insert: {
          btc_change_percent: number
          btc_direction: string
          created_at?: string
          dismissed?: boolean
          had_reflection?: boolean
          id?: string
          message: string
          user_id: string
        }
        Update: {
          btc_change_percent?: number
          btc_direction?: string
          created_at?: string
          dismissed?: boolean
          had_reflection?: boolean
          id?: string
          message?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_path: string | null
          action_state: Json | null
          created_at: string
          dismissed_at: string | null
          id: string
          metadata: Json
          read_at: string | null
          source_id: string
          source_table: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_path?: string | null
          action_state?: Json | null
          created_at?: string
          dismissed_at?: string | null
          id?: string
          metadata?: Json
          read_at?: string | null
          source_id: string
          source_table: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_path?: string | null
          action_state?: Json | null
          created_at?: string
          dismissed_at?: string | null
          id?: string
          metadata?: Json
          read_at?: string | null
          source_id?: string
          source_table?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pause_ai_artifacts: {
        Row: {
          cache_entry_id: string | null
          content: Json
          created_at: string
          id: string
          kind: string
          model: string | null
          pause_instance_id: string
          prompt_version: string | null
          user_id: string
        }
        Insert: {
          cache_entry_id?: string | null
          content: Json
          created_at?: string
          id?: string
          kind: string
          model?: string | null
          pause_instance_id: string
          prompt_version?: string | null
          user_id: string
        }
        Update: {
          cache_entry_id?: string | null
          content?: Json
          created_at?: string
          id?: string
          kind?: string
          model?: string | null
          pause_instance_id?: string
          prompt_version?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pause_ai_artifacts_cache_entry_id_fkey"
            columns: ["cache_entry_id"]
            isOneToOne: false
            referencedRelation: "companion_cache"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_ai_artifacts_pause_instance_id_fkey"
            columns: ["pause_instance_id"]
            isOneToOne: false
            referencedRelation: "pause_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_ai_artifacts_pause_instance_id_fkey"
            columns: ["pause_instance_id"]
            isOneToOne: false
            referencedRelation: "v_pause_archive_echoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_ai_artifacts_pause_instance_id_fkey"
            columns: ["pause_instance_id"]
            isOneToOne: false
            referencedRelation: "v_pause_archive_pauses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_ai_artifacts_pause_instance_id_fkey"
            columns: ["pause_instance_id"]
            isOneToOne: false
            referencedRelation: "v_pause_completed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_ai_artifacts_pause_instance_id_fkey"
            columns: ["pause_instance_id"]
            isOneToOne: false
            referencedRelation: "v_pause_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_ai_artifacts_pause_instance_id_fkey"
            columns: ["pause_instance_id"]
            isOneToOne: false
            referencedRelation: "v_pause_full"
            referencedColumns: ["id"]
          },
        ]
      }
      pause_companion_events: {
        Row: {
          action: Database["public"]["Enums"]["pause_companion_action"]
          companion_type: string
          counts_for_pause: boolean
          created_at: string
          entry_point: string
          id: string
          non_counting_reason: string | null
          pause_instance_id: string | null
          user_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["pause_companion_action"]
          companion_type: string
          counts_for_pause?: boolean
          created_at?: string
          entry_point: string
          id?: string
          non_counting_reason?: string | null
          pause_instance_id?: string | null
          user_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["pause_companion_action"]
          companion_type?: string
          counts_for_pause?: boolean
          created_at?: string
          entry_point?: string
          id?: string
          non_counting_reason?: string | null
          pause_instance_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pause_companion_events_pause_instance_id_fkey"
            columns: ["pause_instance_id"]
            isOneToOne: false
            referencedRelation: "pause_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_companion_events_pause_instance_id_fkey"
            columns: ["pause_instance_id"]
            isOneToOne: false
            referencedRelation: "v_pause_archive_echoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_companion_events_pause_instance_id_fkey"
            columns: ["pause_instance_id"]
            isOneToOne: false
            referencedRelation: "v_pause_archive_pauses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_companion_events_pause_instance_id_fkey"
            columns: ["pause_instance_id"]
            isOneToOne: false
            referencedRelation: "v_pause_completed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_companion_events_pause_instance_id_fkey"
            columns: ["pause_instance_id"]
            isOneToOne: false
            referencedRelation: "v_pause_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_companion_events_pause_instance_id_fkey"
            columns: ["pause_instance_id"]
            isOneToOne: false
            referencedRelation: "v_pause_full"
            referencedColumns: ["id"]
          },
        ]
      }
      pause_instances: {
        Row: {
          completed_at: string | null
          context_fingerprint: string
          context_rule_result: Json
          context_snapshot: Json
          created_at: string
          dismissed_by_user: boolean
          engaged_at: string | null
          expired_reason:
            | Database["public"]["Enums"]["pause_expired_reason"]
            | null
          id: string
          metadata: Json
          source: string
          state: Database["public"]["Enums"]["pause_state"]
          superseded_by: string | null
          template_id: string
          terminal_at: string | null
          user_id: string
          window_ends_at: string
          window_starts_at: string
        }
        Insert: {
          completed_at?: string | null
          context_fingerprint: string
          context_rule_result?: Json
          context_snapshot?: Json
          created_at?: string
          dismissed_by_user?: boolean
          engaged_at?: string | null
          expired_reason?:
            | Database["public"]["Enums"]["pause_expired_reason"]
            | null
          id?: string
          metadata?: Json
          source: string
          state?: Database["public"]["Enums"]["pause_state"]
          superseded_by?: string | null
          template_id: string
          terminal_at?: string | null
          user_id: string
          window_ends_at: string
          window_starts_at?: string
        }
        Update: {
          completed_at?: string | null
          context_fingerprint?: string
          context_rule_result?: Json
          context_snapshot?: Json
          created_at?: string
          dismissed_by_user?: boolean
          engaged_at?: string | null
          expired_reason?:
            | Database["public"]["Enums"]["pause_expired_reason"]
            | null
          id?: string
          metadata?: Json
          source?: string
          state?: Database["public"]["Enums"]["pause_state"]
          superseded_by?: string | null
          template_id?: string
          terminal_at?: string | null
          user_id?: string
          window_ends_at?: string
          window_starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pause_instances_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "pause_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_instances_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "v_pause_archive_echoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_instances_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "v_pause_archive_pauses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_instances_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "v_pause_completed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_instances_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "v_pause_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_instances_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "v_pause_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_instances_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "pause_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      pause_step_events: {
        Row: {
          created_at: string
          id: string
          pause_instance_id: string
          payload: Json
          step_type: Database["public"]["Enums"]["pause_step_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pause_instance_id: string
          payload?: Json
          step_type: Database["public"]["Enums"]["pause_step_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pause_instance_id?: string
          payload?: Json
          step_type?: Database["public"]["Enums"]["pause_step_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pause_step_events_pause_instance_id_fkey"
            columns: ["pause_instance_id"]
            isOneToOne: false
            referencedRelation: "pause_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_step_events_pause_instance_id_fkey"
            columns: ["pause_instance_id"]
            isOneToOne: false
            referencedRelation: "v_pause_archive_echoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_step_events_pause_instance_id_fkey"
            columns: ["pause_instance_id"]
            isOneToOne: false
            referencedRelation: "v_pause_archive_pauses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_step_events_pause_instance_id_fkey"
            columns: ["pause_instance_id"]
            isOneToOne: false
            referencedRelation: "v_pause_completed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_step_events_pause_instance_id_fkey"
            columns: ["pause_instance_id"]
            isOneToOne: false
            referencedRelation: "v_pause_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_step_events_pause_instance_id_fkey"
            columns: ["pause_instance_id"]
            isOneToOne: false
            referencedRelation: "v_pause_full"
            referencedColumns: ["id"]
          },
        ]
      }
      pause_templates: {
        Row: {
          action_window_ms: number | null
          active: boolean
          allowed_companion_types: string[]
          config: Json
          created_at: string
          dismissal_suppression_ms: number
          id: string
          required_companion_count: number
          required_for_completed: string[]
          required_for_engaged: string[]
          slug: string
          version: number
          window_ms: number
        }
        Insert: {
          action_window_ms?: number | null
          active?: boolean
          allowed_companion_types: string[]
          config?: Json
          created_at?: string
          dismissal_suppression_ms?: number
          id?: string
          required_companion_count?: number
          required_for_completed: string[]
          required_for_engaged: string[]
          slug: string
          version?: number
          window_ms: number
        }
        Update: {
          action_window_ms?: number | null
          active?: boolean
          allowed_companion_types?: string[]
          config?: Json
          created_at?: string
          dismissal_suppression_ms?: number
          id?: string
          required_companion_count?: number
          required_for_completed?: string[]
          required_for_engaged?: string[]
          slug?: string
          version?: number
          window_ms?: number
        }
        Relationships: []
      }
      practice_entries: {
        Row: {
          body: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          intensity: number | null
          mood: string | null
          pause_instance_id: string | null
          prompt: string | null
          trigger_text: string | null
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          intensity?: number | null
          mood?: string | null
          pause_instance_id?: string | null
          prompt?: string | null
          trigger_text?: string | null
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          intensity?: number | null
          mood?: string | null
          pause_instance_id?: string | null
          prompt?: string | null
          trigger_text?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_entries_pause_instance_id_fkey"
            columns: ["pause_instance_id"]
            isOneToOne: false
            referencedRelation: "pause_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_entries_pause_instance_id_fkey"
            columns: ["pause_instance_id"]
            isOneToOne: false
            referencedRelation: "v_pause_archive_echoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_entries_pause_instance_id_fkey"
            columns: ["pause_instance_id"]
            isOneToOne: false
            referencedRelation: "v_pause_archive_pauses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_entries_pause_instance_id_fkey"
            columns: ["pause_instance_id"]
            isOneToOne: false
            referencedRelation: "v_pause_completed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_entries_pause_instance_id_fkey"
            columns: ["pause_instance_id"]
            isOneToOne: false
            referencedRelation: "v_pause_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_entries_pause_instance_id_fkey"
            columns: ["pause_instance_id"]
            isOneToOne: false
            referencedRelation: "v_pause_full"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ai_insights_enabled: boolean
          companion_breathing: boolean
          companion_grounding: boolean
          companion_haiku: boolean
          companion_history: boolean
          companion_signal: boolean
          companion_zoom_out: boolean
          cooldown_hours: number
          created_at: string
          cumulative_threshold: number
          custom_prompt: string | null
          digest_frequency: string
          email_notifications: boolean
          first_name: string | null
          grounding_activities: string[] | null
          has_onboarded: boolean
          hold_goal_currency: string | null
          hold_goal_start: string | null
          hold_goal_target_months: number | null
          hold_goal_target_price: number | null
          hold_goal_type: string | null
          id: string
          is_admin: boolean | null
          language: string
          last_context: string | null
          last_trigger_at: string | null
          lifetime_access: boolean
          mantra: string | null
          motivations: string[] | null
          night_reflection_hour: number | null
          notify_badges: boolean
          quiet_hours_end: number | null
          quiet_hours_start: number | null
          referral_code: string
          referred_by: string | null
          reflection_style: string
          reflection_tone: string
          ritual_template: string
          silent_mode: boolean
          snoozed_until: string | null
          streak_freeze_dates: string[]
          subscription_checked_at: string | null
          subscription_end: string | null
          subscription_status: string
          subscription_tier: string
          threshold: number
          threshold_down: number
          timezone: string | null
          tracked_asset_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_insights_enabled?: boolean
          companion_breathing?: boolean
          companion_grounding?: boolean
          companion_haiku?: boolean
          companion_history?: boolean
          companion_signal?: boolean
          companion_zoom_out?: boolean
          cooldown_hours?: number
          created_at?: string
          cumulative_threshold?: number
          custom_prompt?: string | null
          digest_frequency?: string
          email_notifications?: boolean
          first_name?: string | null
          grounding_activities?: string[] | null
          has_onboarded?: boolean
          hold_goal_currency?: string | null
          hold_goal_start?: string | null
          hold_goal_target_months?: number | null
          hold_goal_target_price?: number | null
          hold_goal_type?: string | null
          id?: string
          is_admin?: boolean | null
          language?: string
          last_context?: string | null
          last_trigger_at?: string | null
          lifetime_access?: boolean
          mantra?: string | null
          motivations?: string[] | null
          night_reflection_hour?: number | null
          notify_badges?: boolean
          quiet_hours_end?: number | null
          quiet_hours_start?: number | null
          referral_code?: string
          referred_by?: string | null
          reflection_style?: string
          reflection_tone?: string
          ritual_template?: string
          silent_mode?: boolean
          snoozed_until?: string | null
          streak_freeze_dates?: string[]
          subscription_checked_at?: string | null
          subscription_end?: string | null
          subscription_status?: string
          subscription_tier?: string
          threshold?: number
          threshold_down?: number
          timezone?: string | null
          tracked_asset_id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_insights_enabled?: boolean
          companion_breathing?: boolean
          companion_grounding?: boolean
          companion_haiku?: boolean
          companion_history?: boolean
          companion_signal?: boolean
          companion_zoom_out?: boolean
          cooldown_hours?: number
          created_at?: string
          cumulative_threshold?: number
          custom_prompt?: string | null
          digest_frequency?: string
          email_notifications?: boolean
          first_name?: string | null
          grounding_activities?: string[] | null
          has_onboarded?: boolean
          hold_goal_currency?: string | null
          hold_goal_start?: string | null
          hold_goal_target_months?: number | null
          hold_goal_target_price?: number | null
          hold_goal_type?: string | null
          id?: string
          is_admin?: boolean | null
          language?: string
          last_context?: string | null
          last_trigger_at?: string | null
          lifetime_access?: boolean
          mantra?: string | null
          motivations?: string[] | null
          night_reflection_hour?: number | null
          notify_badges?: boolean
          quiet_hours_end?: number | null
          quiet_hours_start?: number | null
          referral_code?: string
          referred_by?: string | null
          reflection_style?: string
          reflection_tone?: string
          ritual_template?: string
          silent_mode?: boolean
          snoozed_until?: string | null
          streak_freeze_dates?: string[]
          subscription_checked_at?: string | null
          subscription_end?: string | null
          subscription_status?: string
          subscription_tier?: string
          threshold?: number
          threshold_down?: number
          timezone?: string | null
          tracked_asset_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      quiet_windows: {
        Row: {
          active: boolean
          created_at: string
          days: number[]
          end_hour: number
          id: string
          label: string
          start_hour: number
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          days?: number[]
          end_hour: number
          id?: string
          label?: string
          start_hour: number
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          days?: number[]
          end_hour?: number
          id?: string
          label?: string
          start_hour?: number
          user_id?: string
        }
        Relationships: []
      }
      referral_pending_jobs: {
        Row: {
          attempts: number
          created_at: string
          id: string
          last_error: string | null
          max_attempts: number
          next_attempt_at: string | null
          referral_code: string
          referred_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          max_attempts?: number
          next_attempt_at?: string | null
          referral_code: string
          referred_user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          max_attempts?: number
          next_attempt_at?: string | null
          referral_code?: string
          referred_user_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      referral_rewards: {
        Row: {
          granted_at: string
          id: string
          milestone: number
          reward_type: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          id?: string
          milestone: number
          reward_type: string
          user_id: string
        }
        Update: {
          granted_at?: string
          id?: string
          milestone?: number
          reward_type?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_user_id: string
          referrer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          referred_user_id: string
          referrer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          referred_user_id?: string
          referrer_id?: string
        }
        Relationships: []
      }
      reflection_insights: {
        Row: {
          created_at: string
          generated_at: string
          id: string
          insights: Json
          language: string
          period_end: string | null
          period_start: string | null
          reflection_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          generated_at?: string
          id?: string
          insights?: Json
          language?: string
          period_end?: string | null
          period_start?: string | null
          reflection_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          generated_at?: string
          id?: string
          insights?: Json
          language?: string
          period_end?: string | null
          period_start?: string | null
          reflection_count?: number
          user_id?: string
        }
        Relationships: []
      }
      ritual_completions: {
        Row: {
          created_at: string
          custom_template_id: string | null
          decision: string
          duration_seconds: number | null
          id: string
          journal_text: string | null
          steps_completed: Json | null
          template: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_template_id?: string | null
          decision: string
          duration_seconds?: number | null
          id?: string
          journal_text?: string | null
          steps_completed?: Json | null
          template?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_template_id?: string | null
          decision?: string
          duration_seconds?: number | null
          id?: string
          journal_text?: string | null
          steps_completed?: Json | null
          template?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ritual_completions_custom_template_id_fkey"
            columns: ["custom_template_id"]
            isOneToOne: false
            referencedRelation: "ritual_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ritual_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_preset: boolean
          name: string
          steps: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_preset?: boolean
          name: string
          steps?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_preset?: boolean
          name?: string
          steps?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      roadmap_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          status: string
          title: string
          vote_count: number
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          title: string
          vote_count?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          title?: string
          vote_count?: number
        }
        Relationships: []
      }
      roadmap_votes: {
        Row: {
          created_at: string
          id: string
          item_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_votes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "roadmap_items"
            referencedColumns: ["id"]
          },
        ]
      }
      signal_source_suggestions: {
        Row: {
          category: string
          created_at: string
          dedupe_key: string
          id: string
          metadata: Json
          reviewed_at: string | null
          status: string
          suggested_name: string
          suggested_type: string
          suggested_url: string | null
        }
        Insert: {
          category: string
          created_at?: string
          dedupe_key: string
          id?: string
          metadata?: Json
          reviewed_at?: string | null
          status?: string
          suggested_name: string
          suggested_type?: string
          suggested_url?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          dedupe_key?: string
          id?: string
          metadata?: Json
          reviewed_at?: string | null
          status?: string
          suggested_name?: string
          suggested_type?: string
          suggested_url?: string | null
        }
        Relationships: []
      }
      signal_sources: {
        Row: {
          category: string
          created_at: string
          demoted_for_live: boolean
          description: string | null
          id: string
          last_fetch_feeds_at: string | null
          name: string
          type: string
          url: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          demoted_for_live?: boolean
          description?: string | null
          id?: string
          last_fetch_feeds_at?: string | null
          name: string
          type?: string
          url?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          demoted_for_live?: boolean
          description?: string | null
          id?: string
          last_fetch_feeds_at?: string | null
          name?: string
          type?: string
          url?: string | null
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          approved: boolean
          created_at: string
          display_name: string
          id: string
          quote: string
          user_id: string
        }
        Insert: {
          approved?: boolean
          created_at?: string
          display_name: string
          id?: string
          quote: string
          user_id: string
        }
        Update: {
          approved?: boolean
          created_at?: string
          display_name?: string
          id?: string
          quote?: string
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          notified: boolean
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          notified?: boolean
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          notified?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badge_definitions"
            referencedColumns: ["badge_id"]
          },
        ]
      }
      user_companion_serves: {
        Row: {
          cache_entry_id: string
          companion_type: string
          id: string
          served_at: string | null
          user_id: string
        }
        Insert: {
          cache_entry_id: string
          companion_type: string
          id?: string
          served_at?: string | null
          user_id: string
        }
        Update: {
          cache_entry_id?: string
          companion_type?: string
          id?: string
          served_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_signal_preferences: {
        Row: {
          active: boolean
          category: string
          created_at: string
          custom_name: string | null
          custom_type: string | null
          custom_url: string | null
          id: string
          source_id: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          custom_name?: string | null
          custom_type?: string | null
          custom_url?: string | null
          id?: string
          source_id?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          custom_name?: string | null
          custom_type?: string | null
          custom_url?: string | null
          id?: string
          source_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_signal_preferences_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "signal_sources"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_ai_spend_month_global: {
        Row: {
          total_usd: number | null
        }
        Relationships: []
      }
      v_ai_spend_today_global: {
        Row: {
          total_usd: number | null
        }
        Relationships: []
      }
      v_ai_spend_today_per_user: {
        Row: {
          total_usd: number | null
          user_id: string | null
        }
        Relationships: []
      }
      v_companion_avg_latency: {
        Row: {
          avg_latency_ms: number | null
          companion_type: string | null
          p95_latency_ms: number | null
          sample_count: number | null
        }
        Relationships: []
      }
      v_companion_cache_hit_rate: {
        Row: {
          cache_hit_pct: number | null
          cache_hits: number | null
          companion_type: string | null
          curated_fallbacks: number | null
          library_hits: number | null
          live_generated: number | null
          total_serves: number | null
        }
        Relationships: []
      }
      v_companion_cost_per_day: {
        Row: {
          attempts: number | null
          companion_type: string | null
          day: string | null
          total_cost_usd: number | null
          total_input_tokens: number | null
          total_output_tokens: number | null
        }
        Relationships: []
      }
      v_companion_feedback_per_day: {
        Row: {
          companion_type: string | null
          day: string | null
          vote: string | null
          vote_count: number | null
        }
        Relationships: []
      }
      v_companion_feedback_ratio: {
        Row: {
          approval_pct: number | null
          companion_type: string | null
          items_with_feedback: number | null
          total_thumbs_down: number | null
          total_thumbs_up: number | null
        }
        Relationships: []
      }
      v_companion_serves_per_day: {
        Row: {
          companion_type: string | null
          day: string | null
          serve_count: number | null
          serve_source: string | null
        }
        Relationships: []
      }
      v_generation_failure_rate: {
        Row: {
          avg_latency_ms: number | null
          companion_type: string | null
          errors: number | null
          failure_pct: number | null
          model: string | null
          p95_latency_ms: number | null
          provider: string | null
          quality_gate_failures: number | null
          rate_limited: number | null
          successes: number | null
          timeouts: number | null
          total_attempts: number | null
        }
        Relationships: []
      }
      v_generation_failures_per_day: {
        Row: {
          attempt_count: number | null
          avg_latency_ms: number | null
          companion_type: string | null
          day: string | null
          model: string | null
          status: string | null
          total_cost_usd: number | null
        }
        Relationships: []
      }
      v_pause_archive_echoes: {
        Row: {
          completed_at: string | null
          context_fingerprint: string | null
          context_rule_result: Json | null
          context_snapshot: Json | null
          counted_companion_count: number | null
          counted_companion_types: string[] | null
          created_at: string | null
          dismissed_by_user: boolean | null
          engaged_at: string | null
          expired_reason:
            | Database["public"]["Enums"]["pause_expired_reason"]
            | null
          haiku_text: string | null
          has_breath_completed: boolean | null
          has_initial_emotion_logged: boolean | null
          has_outcome_logged: boolean | null
          has_post_pause_emotion_logged: boolean | null
          has_shift_emotion_logged: boolean | null
          id: string | null
          initial_emotion_intensity: number | null
          initial_mood: string | null
          is_brief_ritual: boolean | null
          is_favorite: boolean | null
          metadata: Json | null
          note_text: string | null
          outcome: string | null
          post_pause_emotion_intensity: number | null
          post_pause_mood: string | null
          reflection_text: string | null
          shift_emotion_intensity: number | null
          shift_mood: string | null
          source: string | null
          state: Database["public"]["Enums"]["pause_state"] | null
          superseded_by: string | null
          tags: string[] | null
          template_id: string | null
          terminal_at: string | null
          user_id: string | null
          window_ends_at: string | null
          window_starts_at: string | null
        }
        Insert: {
          completed_at?: string | null
          context_fingerprint?: string | null
          context_rule_result?: Json | null
          context_snapshot?: Json | null
          counted_companion_count?: never
          counted_companion_types?: never
          created_at?: string | null
          dismissed_by_user?: boolean | null
          engaged_at?: string | null
          expired_reason?:
            | Database["public"]["Enums"]["pause_expired_reason"]
            | null
          haiku_text?: never
          has_breath_completed?: never
          has_initial_emotion_logged?: never
          has_outcome_logged?: never
          has_post_pause_emotion_logged?: never
          has_shift_emotion_logged?: never
          id?: string | null
          initial_emotion_intensity?: never
          initial_mood?: never
          is_brief_ritual?: never
          is_favorite?: never
          metadata?: Json | null
          note_text?: never
          outcome?: never
          post_pause_emotion_intensity?: never
          post_pause_mood?: never
          reflection_text?: never
          shift_emotion_intensity?: never
          shift_mood?: never
          source?: string | null
          state?: Database["public"]["Enums"]["pause_state"] | null
          superseded_by?: string | null
          tags?: never
          template_id?: string | null
          terminal_at?: string | null
          user_id?: string | null
          window_ends_at?: string | null
          window_starts_at?: string | null
        }
        Update: {
          completed_at?: string | null
          context_fingerprint?: string | null
          context_rule_result?: Json | null
          context_snapshot?: Json | null
          counted_companion_count?: never
          counted_companion_types?: never
          created_at?: string | null
          dismissed_by_user?: boolean | null
          engaged_at?: string | null
          expired_reason?:
            | Database["public"]["Enums"]["pause_expired_reason"]
            | null
          haiku_text?: never
          has_breath_completed?: never
          has_initial_emotion_logged?: never
          has_outcome_logged?: never
          has_post_pause_emotion_logged?: never
          has_shift_emotion_logged?: never
          id?: string | null
          initial_emotion_intensity?: never
          initial_mood?: never
          is_brief_ritual?: never
          is_favorite?: never
          metadata?: Json | null
          note_text?: never
          outcome?: never
          post_pause_emotion_intensity?: never
          post_pause_mood?: never
          reflection_text?: never
          shift_emotion_intensity?: never
          shift_mood?: never
          source?: string | null
          state?: Database["public"]["Enums"]["pause_state"] | null
          superseded_by?: string | null
          tags?: never
          template_id?: string | null
          terminal_at?: string | null
          user_id?: string | null
          window_ends_at?: string | null
          window_starts_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pause_instances_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "pause_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_instances_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "v_pause_archive_echoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_instances_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "v_pause_archive_pauses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_instances_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "v_pause_completed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_instances_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "v_pause_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_instances_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "v_pause_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_instances_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "pause_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      v_pause_archive_pauses: {
        Row: {
          completed_at: string | null
          context_fingerprint: string | null
          context_rule_result: Json | null
          context_snapshot: Json | null
          counted_companion_count: number | null
          counted_companion_types: string[] | null
          created_at: string | null
          dismissed_by_user: boolean | null
          engaged_at: string | null
          expired_reason:
            | Database["public"]["Enums"]["pause_expired_reason"]
            | null
          haiku_text: string | null
          has_breath_completed: boolean | null
          has_initial_emotion_logged: boolean | null
          has_outcome_logged: boolean | null
          has_post_pause_emotion_logged: boolean | null
          has_shift_emotion_logged: boolean | null
          id: string | null
          initial_emotion_intensity: number | null
          initial_mood: string | null
          is_brief_ritual: boolean | null
          is_favorite: boolean | null
          metadata: Json | null
          note_text: string | null
          outcome: string | null
          post_pause_emotion_intensity: number | null
          post_pause_mood: string | null
          reflection_text: string | null
          shift_emotion_intensity: number | null
          shift_mood: string | null
          source: string | null
          state: Database["public"]["Enums"]["pause_state"] | null
          superseded_by: string | null
          tags: string[] | null
          template_id: string | null
          terminal_at: string | null
          user_id: string | null
          window_ends_at: string | null
          window_starts_at: string | null
        }
        Insert: {
          completed_at?: string | null
          context_fingerprint?: string | null
          context_rule_result?: Json | null
          context_snapshot?: Json | null
          counted_companion_count?: never
          counted_companion_types?: never
          created_at?: string | null
          dismissed_by_user?: boolean | null
          engaged_at?: string | null
          expired_reason?:
            | Database["public"]["Enums"]["pause_expired_reason"]
            | null
          haiku_text?: never
          has_breath_completed?: never
          has_initial_emotion_logged?: never
          has_outcome_logged?: never
          has_post_pause_emotion_logged?: never
          has_shift_emotion_logged?: never
          id?: string | null
          initial_emotion_intensity?: never
          initial_mood?: never
          is_brief_ritual?: never
          is_favorite?: never
          metadata?: Json | null
          note_text?: never
          outcome?: never
          post_pause_emotion_intensity?: never
          post_pause_mood?: never
          reflection_text?: never
          shift_emotion_intensity?: never
          shift_mood?: never
          source?: string | null
          state?: Database["public"]["Enums"]["pause_state"] | null
          superseded_by?: string | null
          tags?: never
          template_id?: string | null
          terminal_at?: string | null
          user_id?: string | null
          window_ends_at?: string | null
          window_starts_at?: string | null
        }
        Update: {
          completed_at?: string | null
          context_fingerprint?: string | null
          context_rule_result?: Json | null
          context_snapshot?: Json | null
          counted_companion_count?: never
          counted_companion_types?: never
          created_at?: string | null
          dismissed_by_user?: boolean | null
          engaged_at?: string | null
          expired_reason?:
            | Database["public"]["Enums"]["pause_expired_reason"]
            | null
          haiku_text?: never
          has_breath_completed?: never
          has_initial_emotion_logged?: never
          has_outcome_logged?: never
          has_post_pause_emotion_logged?: never
          has_shift_emotion_logged?: never
          id?: string | null
          initial_emotion_intensity?: never
          initial_mood?: never
          is_brief_ritual?: never
          is_favorite?: never
          metadata?: Json | null
          note_text?: never
          outcome?: never
          post_pause_emotion_intensity?: never
          post_pause_mood?: never
          reflection_text?: never
          shift_emotion_intensity?: never
          shift_mood?: never
          source?: string | null
          state?: Database["public"]["Enums"]["pause_state"] | null
          superseded_by?: string | null
          tags?: never
          template_id?: string | null
          terminal_at?: string | null
          user_id?: string | null
          window_ends_at?: string | null
          window_starts_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pause_instances_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "pause_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_instances_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "v_pause_archive_echoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_instances_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "v_pause_archive_pauses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_instances_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "v_pause_completed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_instances_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "v_pause_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_instances_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "v_pause_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_instances_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "pause_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      v_pause_completed: {
        Row: {
          completed_at: string | null
          context_fingerprint: string | null
          context_rule_result: Json | null
          context_snapshot: Json | null
          created_at: string | null
          dismissed_by_user: boolean | null
          engaged_at: string | null
          expired_reason:
            | Database["public"]["Enums"]["pause_expired_reason"]
            | null
          id: string | null
          metadata: Json | null
          source: string | null
          state: Database["public"]["Enums"]["pause_state"] | null
          superseded_by: string | null
          template_id: string | null
          terminal_at: string | null
          user_id: string | null
          window_ends_at: string | null
          window_starts_at: string | null
        }
        Insert: {
          completed_at?: string | null
          context_fingerprint?: string | null
          context_rule_result?: Json | null
          context_snapshot?: Json | null
          created_at?: string | null
          dismissed_by_user?: boolean | null
          engaged_at?: string | null
          expired_reason?:
            | Database["public"]["Enums"]["pause_expired_reason"]
            | null
          id?: string | null
          metadata?: Json | null
          source?: string | null
          state?: Database["public"]["Enums"]["pause_state"] | null
          superseded_by?: string | null
          template_id?: string | null
          terminal_at?: string | null
          user_id?: string | null
          window_ends_at?: string | null
          window_starts_at?: string | null
        }
        Update: {
          completed_at?: string | null
          context_fingerprint?: string | null
          context_rule_result?: Json | null
          context_snapshot?: Json | null
          created_at?: string | null
          dismissed_by_user?: boolean | null
          engaged_at?: string | null
          expired_reason?:
            | Database["public"]["Enums"]["pause_expired_reason"]
            | null
          id?: string | null
          metadata?: Json | null
          source?: string | null
          state?: Database["public"]["Enums"]["pause_state"] | null
          superseded_by?: string | null
          template_id?: string | null
          terminal_at?: string | null
          user_id?: string | null
          window_ends_at?: string | null
          window_starts_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pause_instances_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "pause_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_instances_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "v_pause_archive_echoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_instances_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "v_pause_archive_pauses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_instances_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "v_pause_completed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_instances_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "v_pause_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_instances_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "v_pause_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_instances_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "pause_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      v_pause_current: {
        Row: {
          completed_at: string | null
          context_fingerprint: string | null
          context_rule_result: Json | null
          context_snapshot: Json | null
          created_at: string | null
          dismissed_by_user: boolean | null
          engaged_at: string | null
          expired_reason:
            | Database["public"]["Enums"]["pause_expired_reason"]
            | null
          id: string | null
          metadata: Json | null
          source: string | null
          state: Database["public"]["Enums"]["pause_state"] | null
          superseded_by: string | null
          template_id: string | null
          terminal_at: string | null
          user_id: string | null
          window_ends_at: string | null
          window_starts_at: string | null
        }
        Insert: {
          completed_at?: string | null
          context_fingerprint?: string | null
          context_rule_result?: Json | null
          context_snapshot?: Json | null
          created_at?: string | null
          dismissed_by_user?: boolean | null
          engaged_at?: string | null
          expired_reason?:
            | Database["public"]["Enums"]["pause_expired_reason"]
            | null
          id?: string | null
          metadata?: Json | null
          source?: string | null
          state?: Database["public"]["Enums"]["pause_state"] | null
          superseded_by?: string | null
          template_id?: string | null
          terminal_at?: string | null
          user_id?: string | null
          window_ends_at?: string | null
          window_starts_at?: string | null
        }
        Update: {
          completed_at?: string | null
          context_fingerprint?: string | null
          context_rule_result?: Json | null
          context_snapshot?: Json | null
          created_at?: string | null
          dismissed_by_user?: boolean | null
          engaged_at?: string | null
          expired_reason?:
            | Database["public"]["Enums"]["pause_expired_reason"]
            | null
          id?: string | null
          metadata?: Json | null
          source?: string | null
          state?: Database["public"]["Enums"]["pause_state"] | null
          superseded_by?: string | null
          template_id?: string | null
          terminal_at?: string | null
          user_id?: string | null
          window_ends_at?: string | null
          window_starts_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pause_instances_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "pause_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_instances_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "v_pause_archive_echoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_instances_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "v_pause_archive_pauses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_instances_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "v_pause_completed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_instances_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "v_pause_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_instances_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "v_pause_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_instances_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "pause_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      v_pause_full: {
        Row: {
          completed_at: string | null
          context_fingerprint: string | null
          context_rule_result: Json | null
          context_snapshot: Json | null
          counted_companion_count: number | null
          counted_companion_types: string[] | null
          created_at: string | null
          dismissed_by_user: boolean | null
          engaged_at: string | null
          expired_reason:
            | Database["public"]["Enums"]["pause_expired_reason"]
            | null
          haiku_text: string | null
          has_breath_completed: boolean | null
          has_initial_emotion_logged: boolean | null
          has_outcome_logged: boolean | null
          has_post_pause_emotion_logged: boolean | null
          has_shift_emotion_logged: boolean | null
          id: string | null
          initial_emotion_intensity: number | null
          initial_mood: string | null
          is_brief_ritual: boolean | null
          is_favorite: boolean | null
          metadata: Json | null
          note_text: string | null
          outcome: string | null
          post_pause_emotion_intensity: number | null
          post_pause_mood: string | null
          reflection_text: string | null
          shift_emotion_intensity: number | null
          shift_mood: string | null
          source: string | null
          state: Database["public"]["Enums"]["pause_state"] | null
          superseded_by: string | null
          tags: string[] | null
          template_id: string | null
          terminal_at: string | null
          user_id: string | null
          window_ends_at: string | null
          window_starts_at: string | null
        }
        Insert: {
          completed_at?: string | null
          context_fingerprint?: string | null
          context_rule_result?: Json | null
          context_snapshot?: Json | null
          counted_companion_count?: never
          counted_companion_types?: never
          created_at?: string | null
          dismissed_by_user?: boolean | null
          engaged_at?: string | null
          expired_reason?:
            | Database["public"]["Enums"]["pause_expired_reason"]
            | null
          haiku_text?: never
          has_breath_completed?: never
          has_initial_emotion_logged?: never
          has_outcome_logged?: never
          has_post_pause_emotion_logged?: never
          has_shift_emotion_logged?: never
          id?: string | null
          initial_emotion_intensity?: never
          initial_mood?: never
          is_brief_ritual?: never
          is_favorite?: never
          metadata?: Json | null
          note_text?: never
          outcome?: never
          post_pause_emotion_intensity?: never
          post_pause_mood?: never
          reflection_text?: never
          shift_emotion_intensity?: never
          shift_mood?: never
          source?: string | null
          state?: Database["public"]["Enums"]["pause_state"] | null
          superseded_by?: string | null
          tags?: never
          template_id?: string | null
          terminal_at?: string | null
          user_id?: string | null
          window_ends_at?: string | null
          window_starts_at?: string | null
        }
        Update: {
          completed_at?: string | null
          context_fingerprint?: string | null
          context_rule_result?: Json | null
          context_snapshot?: Json | null
          counted_companion_count?: never
          counted_companion_types?: never
          created_at?: string | null
          dismissed_by_user?: boolean | null
          engaged_at?: string | null
          expired_reason?:
            | Database["public"]["Enums"]["pause_expired_reason"]
            | null
          haiku_text?: never
          has_breath_completed?: never
          has_initial_emotion_logged?: never
          has_outcome_logged?: never
          has_post_pause_emotion_logged?: never
          has_shift_emotion_logged?: never
          id?: string | null
          initial_emotion_intensity?: never
          initial_mood?: never
          is_brief_ritual?: never
          is_favorite?: never
          metadata?: Json | null
          note_text?: never
          outcome?: never
          post_pause_emotion_intensity?: never
          post_pause_mood?: never
          reflection_text?: never
          shift_emotion_intensity?: never
          shift_mood?: never
          source?: string | null
          state?: Database["public"]["Enums"]["pause_state"] | null
          superseded_by?: string | null
          tags?: never
          template_id?: string | null
          terminal_at?: string | null
          user_id?: string | null
          window_ends_at?: string | null
          window_starts_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pause_instances_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "pause_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_instances_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "v_pause_archive_echoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_instances_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "v_pause_archive_pauses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_instances_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "v_pause_completed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_instances_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "v_pause_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_instances_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "v_pause_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pause_instances_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "pause_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      v_pause_metrics_daily: {
        Row: {
          completed: number | null
          created: number | null
          day: string | null
          dismissed: number | null
          engaged: number | null
          expired: number | null
          expired_context_lost: number | null
          expired_ineligible: number | null
          expired_open_max_age: number | null
          expired_superseded: number | null
          expired_system_cancelled: number | null
          expired_window_elapsed: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_flex_credits: {
        Args: {
          p_credits: number
          p_feature?: string
          p_metadata?: Json
          p_reason: string
          p_source: string
          p_source_ref?: string
          p_user_id: string
        }
        Returns: Json
      }
      claim_referral_pending_jobs: {
        Args: { p_limit?: number }
        Returns: {
          attempts: number
          created_at: string
          id: string
          last_error: string | null
          max_attempts: number
          next_attempt_at: string | null
          referral_code: string
          referred_user_id: string
          status: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "referral_pending_jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      claim_trigger_slot: {
        Args: { _cooldown_hours: number; _user_id: string }
        Returns: boolean
      }
      consume_feature_allowance_or_credits: {
        Args: {
          p_amount?: number
          p_credit_cost?: number
          p_feature: string
          p_limit: number
          p_metadata?: Json
          p_reason?: string
          p_source?: string
          p_source_ref?: string
          p_user_id: string
        }
        Returns: Json
      }
      consume_monthly_feature_quota: {
        Args: {
          p_amount?: number
          p_feature: string
          p_limit: number
          p_user_id: string
        }
        Returns: Json
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      emit_heartbeat: { Args: { hb_id: string }; Returns: undefined }
      emit_job_heartbeat: { Args: { job_name: string }; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_admin_stats: { Args: never; Returns: Json }
      get_applied_migrations: {
        Args: { p_limit?: number }
        Returns: {
          name: string
          statements_count: number
          version: string
        }[]
      }
      get_holzen_number: { Args: never; Returns: Json }
      get_signup_gate: { Args: never; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      notifications_upsert: {
        Args: {
          p_action_path?: string
          p_action_state?: Json
          p_created_at?: string
          p_metadata?: Json
          p_source_id: string
          p_source_table: string
          p_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      owns_collection: {
        Args: { _collection_id: string; _user_id: string }
        Returns: boolean
      }
      pause_adopt_pending_offer: { Args: never; Returns: Json }
      pause_create_or_reuse: {
        Args: {
          p_context_fingerprint: string
          p_context_rule_result: Json
          p_context_snapshot: Json
          p_source: string
          p_template_slug: string
        }
        Returns: Json
      }
      pause_create_or_reuse_as: {
        Args: {
          p_context_fingerprint: string
          p_context_rule_result: Json
          p_context_snapshot: Json
          p_source: string
          p_template_slug: string
          p_user_id: string
        }
        Returns: Json
      }
      pause_decline_pending_offer: { Args: never; Returns: Json }
      pause_dismiss: {
        Args: { p_instance_id: string; p_reason?: string }
        Returns: Database["public"]["Enums"]["pause_state"]
      }
      pause_dismiss_current: {
        Args: never
        Returns: Database["public"]["Enums"]["pause_state"]
      }
      pause_evaluate_transitions: {
        Args: { p_instance_id: string }
        Returns: Database["public"]["Enums"]["pause_state"]
      }
      pause_expire: {
        Args: {
          p_instance_id: string
          p_reason: Database["public"]["Enums"]["pause_expired_reason"]
        }
        Returns: Database["public"]["Enums"]["pause_state"]
      }
      pause_log_companion: {
        Args: {
          p_action: Database["public"]["Enums"]["pause_companion_action"]
          p_companion_type: string
          p_entry_point: string
          p_instance_id: string
        }
        Returns: Json
      }
      pause_log_step: {
        Args: {
          p_instance_id: string
          p_payload?: Json
          p_step_type: Database["public"]["Enums"]["pause_step_type"]
        }
        Returns: Database["public"]["Enums"]["pause_state"]
      }
      pause_sweep_window_elapsed: { Args: never; Returns: number }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      update_profile_safe: {
        Args: { _updates: Json; _user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      pause_companion_action: "open" | "complete"
      pause_expired_reason:
        | "context_lost"
        | "window_elapsed"
        | "superseded"
        | "ineligible_user_state"
        | "system_cancelled"
        | "open_max_age"
      pause_state:
        | "active"
        | "engaged"
        | "completed"
        | "dismissed"
        | "expired"
        | "pending"
      pause_step_type:
        | "breath_completed"
        | "initial_emotion_logged"
        | "reflection_step"
        | "shift_emotion_logged"
        | "outcome_logged"
        | "note_updated"
        | "tag_updated"
        | "favorite_toggled"
        | "post_pause_emotion_logged"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      pause_companion_action: ["open", "complete"],
      pause_expired_reason: [
        "context_lost",
        "window_elapsed",
        "superseded",
        "ineligible_user_state",
        "system_cancelled",
        "open_max_age",
      ],
      pause_state: [
        "active",
        "engaged",
        "completed",
        "dismissed",
        "expired",
        "pending",
      ],
      pause_step_type: [
        "breath_completed",
        "initial_emotion_logged",
        "reflection_step",
        "shift_emotion_logged",
        "outcome_logged",
        "note_updated",
        "tag_updated",
        "favorite_toggled",
        "post_pause_emotion_logged",
      ],
    },
  },
} as const
