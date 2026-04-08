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
      finishes: {
        Row: {
          enabled: boolean
          id: string
          name_en: string
          name_he: string
          sort_order: number
          subtype_id: string
          surcharge_pct: number
          thumbnail_url: string | null
        }
        Insert: {
          enabled?: boolean
          id?: string
          name_en: string
          name_he?: string
          sort_order?: number
          subtype_id: string
          surcharge_pct?: number
          thumbnail_url?: string | null
        }
        Update: {
          enabled?: boolean
          id?: string
          name_en?: string
          name_he?: string
          sort_order?: number
          subtype_id?: string
          surcharge_pct?: number
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finishes_subtype_id_fkey"
            columns: ["subtype_id"]
            isOneToOne: false
            referencedRelation: "product_subtypes"
            referencedColumns: ["id"]
          },
        ]
      }
      frame_colors: {
        Row: {
          color_name_en: string
          color_name_he: string
          frame_style_id: string
          hex_code: string
          id: string
        }
        Insert: {
          color_name_en: string
          color_name_he?: string
          frame_style_id: string
          hex_code?: string
          id?: string
        }
        Update: {
          color_name_en?: string
          color_name_he?: string
          frame_style_id?: string
          hex_code?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "frame_colors_frame_style_id_fkey"
            columns: ["frame_style_id"]
            isOneToOne: false
            referencedRelation: "frame_styles"
            referencedColumns: ["id"]
          },
        ]
      }
      frame_styles: {
        Row: {
          enabled: boolean
          id: string
          material: string
          name_en: string
          name_he: string
          price_per_cm: number
          sort_order: number
        }
        Insert: {
          enabled?: boolean
          id?: string
          material: string
          name_en: string
          name_he?: string
          price_per_cm?: number
          sort_order?: number
        }
        Update: {
          enabled?: boolean
          id?: string
          material?: string
          name_en?: string
          name_he?: string
          price_per_cm?: number
          sort_order?: number
        }
        Relationships: []
      }
      frame_widths: {
        Row: {
          enabled: boolean
          id: string
          sort_order: number
          surcharge_pct: number
          width_cm: number
        }
        Insert: {
          enabled?: boolean
          id?: string
          sort_order?: number
          surcharge_pct?: number
          width_cm: number
        }
        Update: {
          enabled?: boolean
          id?: string
          sort_order?: number
          surcharge_pct?: number
          width_cm?: number
        }
        Relationships: []
      }
      glazing_options: {
        Row: {
          enabled: boolean
          id: string
          name_en: string
          name_he: string
          price_sqm: number
          sort_order: number
        }
        Insert: {
          enabled?: boolean
          id?: string
          name_en: string
          name_he?: string
          price_sqm?: number
          sort_order?: number
        }
        Update: {
          enabled?: boolean
          id?: string
          name_en?: string
          name_he?: string
          price_sqm?: number
          sort_order?: number
        }
        Relationships: []
      }
      material_tooltips: {
        Row: {
          best_for_en: string
          best_for_he: string
          durability_en: string
          durability_he: string
          finish_en: string
          finish_he: string
          id: string
          product_slug: string
          title_en: string
          title_he: string
        }
        Insert: {
          best_for_en?: string
          best_for_he?: string
          durability_en?: string
          durability_he?: string
          finish_en?: string
          finish_he?: string
          id?: string
          product_slug: string
          title_en?: string
          title_he?: string
        }
        Update: {
          best_for_en?: string
          best_for_he?: string
          durability_en?: string
          durability_he?: string
          finish_en?: string
          finish_he?: string
          id?: string
          product_slug?: string
          title_en?: string
          title_he?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string | null
          id: string
          image_url: string | null
          product_selections: Json
          shopify_order_id: string | null
          status: string
          total_price_ils: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          id?: string
          image_url?: string | null
          product_selections?: Json
          shopify_order_id?: string | null
          status?: string
          total_price_ils?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          id?: string
          image_url?: string | null
          product_selections?: Json
          shopify_order_id?: string | null
          status?: string
          total_price_ils?: number
          user_id?: string | null
        }
        Relationships: []
      }
      price_tiers: {
        Row: {
          id: string
          product_id: string
          subtype_id: string | null
          tier_threshold_sqm: number
          tier1_price_sqm: number
          tier2_price_sqm: number
        }
        Insert: {
          id?: string
          product_id: string
          subtype_id?: string | null
          tier_threshold_sqm?: number
          tier1_price_sqm?: number
          tier2_price_sqm?: number
        }
        Update: {
          id?: string
          product_id?: string
          subtype_id?: string | null
          tier_threshold_sqm?: number
          tier1_price_sqm?: number
          tier2_price_sqm?: number
        }
        Relationships: [
          {
            foreignKeyName: "price_tiers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_tiers_subtype_id_fkey"
            columns: ["subtype_id"]
            isOneToOne: false
            referencedRelation: "product_subtypes"
            referencedColumns: ["id"]
          },
        ]
      }
      product_subtypes: {
        Row: {
          description_en: string | null
          description_he: string | null
          enabled: boolean
          id: string
          name_en: string
          name_he: string
          pack_depth_cm: number | null
          pack_height_cm: number | null
          pack_weight_kg: number | null
          pack_width_cm: number | null
          product_id: string
          sort_order: number
          thickness_mm: number | null
          thumbnail_url: string | null
        }
        Insert: {
          description_en?: string | null
          description_he?: string | null
          enabled?: boolean
          id?: string
          name_en: string
          name_he?: string
          pack_depth_cm?: number | null
          pack_height_cm?: number | null
          pack_weight_kg?: number | null
          pack_width_cm?: number | null
          product_id: string
          sort_order?: number
          thickness_mm?: number | null
          thumbnail_url?: string | null
        }
        Update: {
          description_en?: string | null
          description_he?: string | null
          enabled?: boolean
          id?: string
          name_en?: string
          name_he?: string
          pack_depth_cm?: number | null
          pack_height_cm?: number | null
          pack_weight_kg?: number | null
          pack_width_cm?: number | null
          product_id?: string
          sort_order?: number
          thickness_mm?: number | null
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_subtypes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          description_en: string | null
          description_he: string | null
          enabled: boolean
          id: string
          max_height_cm: number
          max_width_cm: number
          name_en: string
          name_he: string
          slug: string
          sort_order: number
          thumbnail_url: string | null
        }
        Insert: {
          created_at?: string
          description_en?: string | null
          description_he?: string | null
          enabled?: boolean
          id?: string
          max_height_cm?: number
          max_width_cm?: number
          name_en: string
          name_he?: string
          slug: string
          sort_order?: number
          thumbnail_url?: string | null
        }
        Update: {
          created_at?: string
          description_en?: string | null
          description_he?: string | null
          enabled?: boolean
          id?: string
          max_height_cm?: number
          max_width_cm?: number
          name_en?: string
          name_he?: string
          slug?: string
          sort_order?: number
          thumbnail_url?: string | null
        }
        Relationships: []
      }
      shopify_config: {
        Row: {
          admin_api_token: string
          api_version: string
          client_id: string
          client_secret: string
          created_at: string
          enabled: boolean
          id: string
          oauth_scopes: string
          store_domain: string
          updated_at: string
        }
        Insert: {
          admin_api_token?: string
          api_version?: string
          client_id?: string
          client_secret?: string
          created_at?: string
          enabled?: boolean
          id?: string
          oauth_scopes?: string
          store_domain?: string
          updated_at?: string
        }
        Update: {
          admin_api_token?: string
          api_version?: string
          client_id?: string
          client_secret?: string
          created_at?: string
          enabled?: boolean
          id?: string
          oauth_scopes?: string
          store_domain?: string
          updated_at?: string
        }
        Relationships: []
      }
      shopify_oauth_state: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          nonce: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          nonce: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          nonce?: string
        }
        Relationships: []
      }
      shopify_sync_jobs: {
        Row: {
          collection_id: string | null
          combinations: Json
          created_at: string
          error_log: Json
          id: string
          last_batch_index: number
          product_id: string | null
          status: string
          synced_count: number
          total_combinations: number
          updated_at: string
        }
        Insert: {
          collection_id?: string | null
          combinations?: Json
          created_at?: string
          error_log?: Json
          id?: string
          last_batch_index?: number
          product_id?: string | null
          status?: string
          synced_count?: number
          total_combinations?: number
          updated_at?: string
        }
        Update: {
          collection_id?: string | null
          combinations?: Json
          created_at?: string
          error_log?: Json
          id?: string
          last_batch_index?: number
          product_id?: string | null
          status?: string
          synced_count?: number
          total_combinations?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopify_sync_jobs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_variant_mappings: {
        Row: {
          add_frame: boolean | null
          canvas_edge_wrap_id: string | null
          created_at: string
          enabled: boolean
          finish_id: string | null
          frame_color_id: string | null
          frame_style_id: string | null
          frame_width_id: string | null
          glazing_id: string | null
          id: string
          mapping_key: string
          product_id: string
          shopify_variant_id: string
          size_id: string | null
          subframe_id: string | null
          subtype_id: string | null
          updated_at: string
        }
        Insert: {
          add_frame?: boolean | null
          canvas_edge_wrap_id?: string | null
          created_at?: string
          enabled?: boolean
          finish_id?: string | null
          frame_color_id?: string | null
          frame_style_id?: string | null
          frame_width_id?: string | null
          glazing_id?: string | null
          id?: string
          mapping_key: string
          product_id: string
          shopify_variant_id: string
          size_id?: string | null
          subframe_id?: string | null
          subtype_id?: string | null
          updated_at?: string
        }
        Update: {
          add_frame?: boolean | null
          canvas_edge_wrap_id?: string | null
          created_at?: string
          enabled?: boolean
          finish_id?: string | null
          frame_color_id?: string | null
          frame_style_id?: string | null
          frame_width_id?: string | null
          glazing_id?: string | null
          id?: string
          mapping_key?: string
          product_id?: string
          shopify_variant_id?: string
          size_id?: string | null
          subframe_id?: string | null
          subtype_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopify_variant_mappings_finish_id_fkey"
            columns: ["finish_id"]
            isOneToOne: false
            referencedRelation: "finishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopify_variant_mappings_frame_color_id_fkey"
            columns: ["frame_color_id"]
            isOneToOne: false
            referencedRelation: "frame_colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopify_variant_mappings_frame_style_id_fkey"
            columns: ["frame_style_id"]
            isOneToOne: false
            referencedRelation: "frame_styles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopify_variant_mappings_frame_width_id_fkey"
            columns: ["frame_width_id"]
            isOneToOne: false
            referencedRelation: "frame_widths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopify_variant_mappings_glazing_id_fkey"
            columns: ["glazing_id"]
            isOneToOne: false
            referencedRelation: "glazing_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopify_variant_mappings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopify_variant_mappings_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "size_presets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopify_variant_mappings_subframe_id_fkey"
            columns: ["subframe_id"]
            isOneToOne: false
            referencedRelation: "subframe_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopify_variant_mappings_subtype_id_fkey"
            columns: ["subtype_id"]
            isOneToOne: false
            referencedRelation: "product_subtypes"
            referencedColumns: ["id"]
          },
        ]
      }
      size_presets: {
        Row: {
          aspect_ratio: string
          enabled: boolean
          height_cm: number
          id: string
          pack_depth_cm: number | null
          pack_height_cm: number | null
          pack_weight_kg: number | null
          pack_width_cm: number | null
          product_id: string
          sort_order: number
          width_cm: number
        }
        Insert: {
          aspect_ratio: string
          enabled?: boolean
          height_cm: number
          id?: string
          pack_depth_cm?: number | null
          pack_height_cm?: number | null
          pack_weight_kg?: number | null
          pack_width_cm?: number | null
          product_id: string
          sort_order?: number
          width_cm: number
        }
        Update: {
          aspect_ratio?: string
          enabled?: boolean
          height_cm?: number
          id?: string
          pack_depth_cm?: number | null
          pack_height_cm?: number | null
          pack_weight_kg?: number | null
          pack_width_cm?: number | null
          product_id?: string
          sort_order?: number
          width_cm?: number
        }
        Relationships: [
          {
            foreignKeyName: "size_presets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      subframe_options: {
        Row: {
          color: string
          enabled: boolean
          height_cm: number
          id: string
          inset_cm: number
          material: string
          name_en: string
          name_he: string
          surcharge_pct: number
          width_cm: number
        }
        Insert: {
          color?: string
          enabled?: boolean
          height_cm?: number
          id?: string
          inset_cm?: number
          material: string
          name_en: string
          name_he?: string
          surcharge_pct?: number
          width_cm?: number
        }
        Update: {
          color?: string
          enabled?: boolean
          height_cm?: number
          id?: string
          inset_cm?: number
          material?: string
          name_en?: string
          name_he?: string
          surcharge_pct?: number
          width_cm?: number
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
