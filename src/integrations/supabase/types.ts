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
      cancellation_settings: {
        Row: {
          driver_fee_after_accept: number
          free_window_seconds: number
          id: string
          is_active: boolean
          passenger_fee_after_arrived: number
          updated_at: string
        }
        Insert: {
          driver_fee_after_accept?: number
          free_window_seconds?: number
          id?: string
          is_active?: boolean
          passenger_fee_after_arrived?: number
          updated_at?: string
        }
        Update: {
          driver_fee_after_accept?: number
          free_window_seconds?: number
          id?: string
          is_active?: boolean
          passenger_fee_after_arrived?: number
          updated_at?: string
        }
        Relationships: []
      }
      cancellations: {
        Row: {
          canceled_by: string
          created_at: string
          driver_id: string | null
          fee_amount: number
          id: string
          reason: string
          ride_id: string
          ride_status_at_cancel: string
          seconds_since_accept: number | null
          user_id: string
        }
        Insert: {
          canceled_by: string
          created_at?: string
          driver_id?: string | null
          fee_amount?: number
          id?: string
          reason: string
          ride_id: string
          ride_status_at_cancel: string
          seconds_since_accept?: number | null
          user_id: string
        }
        Update: {
          canceled_by?: string
          created_at?: string
          driver_id?: string | null
          fee_amount?: number
          id?: string
          reason?: string
          ride_id?: string
          ride_status_at_cancel?: string
          seconds_since_accept?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cancellations_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_settings: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          percentage: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          percentage?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          percentage?: number
          updated_at?: string
        }
        Relationships: []
      }
      coupon_redemptions: {
        Row: {
          coupon_id: string
          created_at: string
          discount_applied: number
          id: string
          ride_id: string | null
          user_id: string
        }
        Insert: {
          coupon_id: string
          created_at?: string
          discount_applied: number
          id?: string
          ride_id?: string | null
          user_id: string
        }
        Update: {
          coupon_id?: string
          created_at?: string
          discount_applied?: number
          id?: string
          ride_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_amount: number | null
          discount_pct: number | null
          first_ride_only: boolean
          id: string
          is_active: boolean
          max_discount: number | null
          min_ride_price: number
          updated_at: string
          usage_count: number
          usage_limit: number | null
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_amount?: number | null
          discount_pct?: number | null
          first_ride_only?: boolean
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_ride_price?: number
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_amount?: number | null
          discount_pct?: number | null
          first_ride_only?: boolean
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_ride_price?: number
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      driver_documents: {
        Row: {
          created_at: string
          driver_id: string
          file_path: string
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["driver_document_status"]
          type: Database["public"]["Enums"]["driver_document_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          driver_id: string
          file_path: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["driver_document_status"]
          type: Database["public"]["Enums"]["driver_document_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          driver_id?: string
          file_path?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["driver_document_status"]
          type?: Database["public"]["Enums"]["driver_document_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_documents_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_payouts: {
        Row: {
          amount: number
          commission_amount: number
          created_at: string
          driver_id: string
          gross_amount: number
          id: string
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          ride_id: string | null
          status: Database["public"]["Enums"]["payout_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          commission_amount?: number
          created_at?: string
          driver_id: string
          gross_amount?: number
          id?: string
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          ride_id?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          commission_amount?: number
          created_at?: string
          driver_id?: string
          gross_amount?: number
          id?: string
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          ride_id?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_payouts_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_payouts_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          created_at: string
          document: string
          id: string
          is_approved: boolean
          location_lat: number | null
          location_lng: number | null
          moto_model: string
          onboarding_status: Database["public"]["Enums"]["driver_onboarding_status"]
          photo_url: string | null
          plate: string
          rating_avg: number | null
          rejection_reason: string | null
          rest_until: string | null
          status: Database["public"]["Enums"]["driver_status"]
          total_rides: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document: string
          id?: string
          is_approved?: boolean
          location_lat?: number | null
          location_lng?: number | null
          moto_model: string
          onboarding_status?: Database["public"]["Enums"]["driver_onboarding_status"]
          photo_url?: string | null
          plate: string
          rating_avg?: number | null
          rejection_reason?: string | null
          rest_until?: string | null
          status?: Database["public"]["Enums"]["driver_status"]
          total_rides?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document?: string
          id?: string
          is_approved?: boolean
          location_lat?: number | null
          location_lng?: number | null
          moto_model?: string
          onboarding_status?: Database["public"]["Enums"]["driver_onboarding_status"]
          photo_url?: string | null
          plate?: string
          rating_avg?: number | null
          rejection_reason?: string | null
          rest_until?: string | null
          status?: Database["public"]["Enums"]["driver_status"]
          total_rides?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          ride_id: string
          status: Database["public"]["Enums"]["payment_status"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          ride_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          ride_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_ride_bonus_paid: boolean
          full_name: string | null
          id: string
          phone: string | null
          referral_code: string | null
          referred_by: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_ride_bonus_paid?: boolean
          full_name?: string | null
          id?: string
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_ride_bonus_paid?: boolean
          full_name?: string | null
          id?: string
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
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
      ratings: {
        Row: {
          comment: string | null
          created_at: string
          from_user_id: string
          id: string
          ride_id: string
          score: number
          to_user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          from_user_id: string
          id?: string
          ride_id: string
          score: number
          to_user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          from_user_id?: string
          id?: string
          ride_id?: string
          score?: number
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          read_at: string | null
          ride_id: string
          sender_id: string
          sender_role: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          ride_id: string
          sender_id: string
          sender_role: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          ride_id?: string
          sender_id?: string
          sender_role?: string
        }
        Relationships: []
      }
      rides: {
        Row: {
          accepted_at: string | null
          canceled_at: string | null
          canceled_by: string | null
          cancellation_fee: number | null
          cancellation_reason: string | null
          completed_at: string | null
          coupon_code: string | null
          created_at: string
          declined_driver_ids: string[]
          destination_address: string
          destination_lat: number | null
          destination_lng: number | null
          discount_amount: number
          driver_id: string | null
          estimated_distance_km: number | null
          estimated_duration_min: number | null
          estimated_price: number | null
          final_price: number | null
          id: string
          matching_driver_id: string | null
          matching_expires_at: string | null
          origin_address: string
          origin_lat: number | null
          origin_lng: number | null
          passenger_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["ride_status"]
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          canceled_at?: string | null
          canceled_by?: string | null
          cancellation_fee?: number | null
          cancellation_reason?: string | null
          completed_at?: string | null
          coupon_code?: string | null
          created_at?: string
          declined_driver_ids?: string[]
          destination_address: string
          destination_lat?: number | null
          destination_lng?: number | null
          discount_amount?: number
          driver_id?: string | null
          estimated_distance_km?: number | null
          estimated_duration_min?: number | null
          estimated_price?: number | null
          final_price?: number | null
          id?: string
          matching_driver_id?: string | null
          matching_expires_at?: string | null
          origin_address: string
          origin_lat?: number | null
          origin_lng?: number | null
          passenger_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["ride_status"]
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          canceled_at?: string | null
          canceled_by?: string | null
          cancellation_fee?: number | null
          cancellation_reason?: string | null
          completed_at?: string | null
          coupon_code?: string | null
          created_at?: string
          declined_driver_ids?: string[]
          destination_address?: string
          destination_lat?: number | null
          destination_lng?: number | null
          discount_amount?: number
          driver_id?: string | null
          estimated_distance_km?: number | null
          estimated_duration_min?: number | null
          estimated_price?: number | null
          final_price?: number | null
          id?: string
          matching_driver_id?: string | null
          matching_expires_at?: string | null
          origin_address?: string
          origin_lat?: number | null
          origin_lng?: number | null
          passenger_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["ride_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rides_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_matching_driver_id_fkey"
            columns: ["matching_driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_places: {
        Row: {
          address: string
          category: string
          created_at: string
          id: string
          label: string
          lat: number
          lng: number
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          category?: string
          created_at?: string
          id?: string
          label: string
          lat: number
          lng: number
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          category?: string
          created_at?: string
          id?: string
          label?: string
          lat?: number
          lng?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      search_history: {
        Row: {
          address: string
          id: string
          lat: number | null
          lng: number | null
          searched_at: string
          user_id: string
        }
        Insert: {
          address: string
          id?: string
          lat?: number | null
          lng?: number | null
          searched_at?: string
          user_id: string
        }
        Update: {
          address?: string
          id?: string
          lat?: number | null
          lng?: number | null
          searched_at?: string
          user_id?: string
        }
        Relationships: []
      }
      surge_rules: {
        Row: {
          created_at: string
          day_of_week: number | null
          hour_end: number
          hour_start: number
          id: string
          is_active: boolean
          label: string
          multiplier: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week?: number | null
          hour_end?: number
          hour_start?: number
          id?: string
          is_active?: boolean
          label: string
          multiplier?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number | null
          hour_end?: number
          hour_start?: number
          id?: string
          is_active?: boolean
          label?: string
          multiplier?: number
          updated_at?: string
        }
        Relationships: []
      }
      tariffs: {
        Row: {
          base_fare: number
          cancellation_fee: number
          created_at: string
          id: string
          is_active: boolean
          minimum_fare: number
          per_km: number
          per_minute: number
          updated_at: string
        }
        Insert: {
          base_fare?: number
          cancellation_fee?: number
          created_at?: string
          id?: string
          is_active?: boolean
          minimum_fare?: number
          per_km?: number
          per_minute?: number
          updated_at?: string
        }
        Update: {
          base_fare?: number
          cancellation_fee?: number
          created_at?: string
          id?: string
          is_active?: boolean
          minimum_fare?: number
          per_km?: number
          per_minute?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          type: Database["public"]["Enums"]["wallet_transaction_type"]
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type: Database["public"]["Enums"]["wallet_transaction_type"]
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type?: Database["public"]["Enums"]["wallet_transaction_type"]
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_offered_ride: { Args: { _ride_id: string }; Returns: Json }
      apply_referral_code: { Args: { _code: string }; Returns: Json }
      assign_driver_role: { Args: { _user_id: string }; Returns: undefined }
      cancel_ride: {
        Args: { _canceled_by: string; _reason: string; _ride_id: string }
        Returns: Json
      }
      decline_offered_ride: { Args: { _ride_id: string }; Returns: Json }
      generate_referral_code: { Args: never; Returns: string }
      get_active_surge: { Args: never; Returns: Json }
      get_shared_ride: { Args: { _ride_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      offer_ride_to_next_driver: { Args: { _ride_id: string }; Returns: Json }
      process_ride_payment: {
        Args: {
          _amount: number
          _driver_id: string
          _passenger_id: string
          _ride_id: string
        }
        Returns: boolean
      }
      redeem_coupon: {
        Args: { _code: string; _discount: number; _ride_id: string }
        Returns: Json
      }
      validate_coupon: {
        Args: { _code: string; _ride_price: number }
        Returns: Json
      }
    }
    Enums: {
      app_role: "passenger" | "driver" | "admin"
      driver_document_status: "pending" | "approved" | "rejected"
      driver_document_type:
        | "cnh_front"
        | "cnh_back"
        | "crlv"
        | "selfie_with_doc"
        | "moto_front"
        | "moto_plate"
      driver_onboarding_status:
        | "pending_documents"
        | "in_review"
        | "approved"
        | "rejected"
      driver_status: "available" | "unavailable" | "on_ride"
      payment_method: "pix" | "card" | "cash"
      payment_status: "pending" | "completed" | "refunded"
      payout_status: "pending" | "paid" | "canceled"
      ride_status:
        | "REQUESTED"
        | "ACCEPTED"
        | "ARRIVING"
        | "ARRIVED"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "CANCELED"
      wallet_transaction_type:
        | "credit"
        | "debit"
        | "commission"
        | "payout"
        | "refund"
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
      app_role: ["passenger", "driver", "admin"],
      driver_document_status: ["pending", "approved", "rejected"],
      driver_document_type: [
        "cnh_front",
        "cnh_back",
        "crlv",
        "selfie_with_doc",
        "moto_front",
        "moto_plate",
      ],
      driver_onboarding_status: [
        "pending_documents",
        "in_review",
        "approved",
        "rejected",
      ],
      driver_status: ["available", "unavailable", "on_ride"],
      payment_method: ["pix", "card", "cash"],
      payment_status: ["pending", "completed", "refunded"],
      payout_status: ["pending", "paid", "canceled"],
      ride_status: [
        "REQUESTED",
        "ACCEPTED",
        "ARRIVING",
        "ARRIVED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELED",
      ],
      wallet_transaction_type: [
        "credit",
        "debit",
        "commission",
        "payout",
        "refund",
      ],
    },
  },
} as const
