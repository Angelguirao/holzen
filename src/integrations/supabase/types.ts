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
          library_item_id: string
          position: number
        }
        Insert: {
          added_at?: string
          collection_id: string
          id?: string
          library_item_id: string
          position?: number
        }
        Update: {
          added_at?: string
          collection_id?: string
          id?: string
          library_item_id?: string
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
            foreignKeyName: "collection_items_library_item_id_fkey"
            columns: ["library_item_id"]
            isOneToOne: false
            referencedRelation: "library_items"
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
      feedback: {
        Row: {
          category: string
          created_at: string
          id: string
          message: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          message: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          message?: string
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
          id?: string
          user_id?: string
          written_at?: string
          written_during?: string
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
      library_items: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_favorite: boolean
          pinned: boolean
          reflection_id: string | null
          source_type: string | null
          source_url: string | null
          status: string
          tags: string[]
          title: string | null
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean
          pinned?: boolean
          reflection_id?: string | null
          source_type?: string | null
          source_url?: string | null
          status?: string
          tags?: string[]
          title?: string | null
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean
          pinned?: boolean
          reflection_id?: string | null
          source_type?: string | null
          source_url?: string | null
          status?: string
          tags?: string[]
          title?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_items_reflection_id_fkey"
            columns: ["reflection_id"]
            isOneToOne: false
            referencedRelation: "reflections"
            referencedColumns: ["id"]
          },
        ]
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
      practice_entries: {
        Row: {
          body: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          intensity: number | null
          mood: string | null
          prompt: string | null
          source_reflection_id: string | null
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
          prompt?: string | null
          source_reflection_id?: string | null
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
          prompt?: string | null
          source_reflection_id?: string | null
          trigger_text?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_entries_source_reflection_id_fkey"
            columns: ["source_reflection_id"]
            isOneToOne: false
            referencedRelation: "reflections"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ai_insights_enabled: boolean
          companion_breathing: boolean
          companion_haiku: boolean
          companion_history: boolean
          companion_learning: boolean
          companion_signal: boolean
          companion_zoom_out: boolean
          cooldown_hours: number
          created_at: string
          cumulative_threshold: number
          custom_prompt: string | null
          digest_frequency: string
          email_notifications: boolean
          first_name: string | null
          has_onboarded: boolean
          hold_goal_currency: string | null
          hold_goal_start: string | null
          hold_goal_target_months: number | null
          hold_goal_target_price: number | null
          hold_goal_type: string | null
          id: string
          language: string
          last_context: string | null
          last_message: string | null
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
          streak_freeze_dates: string[]
          subscription_checked_at: string | null
          subscription_end: string | null
          subscription_status: string
          threshold: number
          threshold_down: number
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_insights_enabled?: boolean
          companion_breathing?: boolean
          companion_haiku?: boolean
          companion_history?: boolean
          companion_learning?: boolean
          companion_signal?: boolean
          companion_zoom_out?: boolean
          cooldown_hours?: number
          created_at?: string
          cumulative_threshold?: number
          custom_prompt?: string | null
          digest_frequency?: string
          email_notifications?: boolean
          first_name?: string | null
          has_onboarded?: boolean
          hold_goal_currency?: string | null
          hold_goal_start?: string | null
          hold_goal_target_months?: number | null
          hold_goal_target_price?: number | null
          hold_goal_type?: string | null
          id?: string
          language?: string
          last_context?: string | null
          last_message?: string | null
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
          streak_freeze_dates?: string[]
          subscription_checked_at?: string | null
          subscription_end?: string | null
          subscription_status?: string
          threshold?: number
          threshold_down?: number
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_insights_enabled?: boolean
          companion_breathing?: boolean
          companion_haiku?: boolean
          companion_history?: boolean
          companion_learning?: boolean
          companion_signal?: boolean
          companion_zoom_out?: boolean
          cooldown_hours?: number
          created_at?: string
          cumulative_threshold?: number
          custom_prompt?: string | null
          digest_frequency?: string
          email_notifications?: boolean
          first_name?: string | null
          has_onboarded?: boolean
          hold_goal_currency?: string | null
          hold_goal_start?: string | null
          hold_goal_target_months?: number | null
          hold_goal_target_price?: number | null
          hold_goal_type?: string | null
          id?: string
          language?: string
          last_context?: string | null
          last_message?: string | null
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
          streak_freeze_dates?: string[]
          subscription_checked_at?: string | null
          subscription_end?: string | null
          subscription_status?: string
          threshold?: number
          threshold_down?: number
          timezone?: string | null
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
      reflections: {
        Row: {
          breathing_completed: boolean
          context: string | null
          created_at: string
          haiku: string | null
          haiku_read: boolean
          history_insight_data: Json | null
          history_read: boolean
          id: string
          is_favorite: boolean
          learning_body: string | null
          learning_citation: string | null
          learning_read: boolean
          learning_title: string | null
          learning_url: string | null
          message: string
          mood: string | null
          mood_after: string | null
          note: string | null
          outcome: string | null
          signal_body: string | null
          signal_read: boolean
          signal_source: string | null
          signal_title: string | null
          signal_url: string | null
          tags: string[] | null
          user_id: string
          zoom_out_data: Json | null
          zoom_out_read: boolean
        }
        Insert: {
          breathing_completed?: boolean
          context?: string | null
          created_at?: string
          haiku?: string | null
          haiku_read?: boolean
          history_insight_data?: Json | null
          history_read?: boolean
          id?: string
          is_favorite?: boolean
          learning_body?: string | null
          learning_citation?: string | null
          learning_read?: boolean
          learning_title?: string | null
          learning_url?: string | null
          message: string
          mood?: string | null
          mood_after?: string | null
          note?: string | null
          outcome?: string | null
          signal_body?: string | null
          signal_read?: boolean
          signal_source?: string | null
          signal_title?: string | null
          signal_url?: string | null
          tags?: string[] | null
          user_id: string
          zoom_out_data?: Json | null
          zoom_out_read?: boolean
        }
        Update: {
          breathing_completed?: boolean
          context?: string | null
          created_at?: string
          haiku?: string | null
          haiku_read?: boolean
          history_insight_data?: Json | null
          history_read?: boolean
          id?: string
          is_favorite?: boolean
          learning_body?: string | null
          learning_citation?: string | null
          learning_read?: boolean
          learning_title?: string | null
          learning_url?: string | null
          message?: string
          mood?: string | null
          mood_after?: string | null
          note?: string | null
          outcome?: string | null
          signal_body?: string | null
          signal_read?: boolean
          signal_source?: string | null
          signal_title?: string | null
          signal_url?: string | null
          tags?: string[] | null
          user_id?: string
          zoom_out_data?: Json | null
          zoom_out_read?: boolean
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
          reflection_id: string | null
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
          reflection_id?: string | null
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
          reflection_id?: string | null
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
          {
            foreignKeyName: "ritual_completions_reflection_id_fkey"
            columns: ["reflection_id"]
            isOneToOne: false
            referencedRelation: "reflections"
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
          created_at: string
          description: string | null
          id: string
          status: string
          title: string
          vote_count: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          title: string
          vote_count?: number
        }
        Update: {
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
      signal_sources: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
          type: string
          url: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          type?: string
          url?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          type?: string
          url?: string | null
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
      [_ in never]: never
    }
    Functions: {
      find_similar_reflection: {
        Args: {
          _min_age_days?: number
          _reflection_id: string
          _user_id: string
        }
        Returns: {
          context: string
          created_at: string
          id: string
          message: string
          mood: string
          note: string
          outcome: string
          tags: string[]
        }[]
      }
      get_holzen_number: { Args: never; Returns: Json }
      owns_collection: {
        Args: { _collection_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
