export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name_en: string;
          name_he: string;
          slug: string;
          enabled: boolean;
          max_width_cm: number;
          max_height_cm: number;
          sort_order: number;
          description_en: string;
          description_he: string;
          thumbnail_url: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };
      product_subtypes: {
        Row: {
          id: string;
          product_id: string;
          name_en: string;
          name_he: string;
          enabled: boolean;
          thickness_mm: number | null;
          description_en: string;
          description_he: string;
          sort_order: number;
          pack_width_cm: number | null;
          pack_height_cm: number | null;
          pack_depth_cm: number | null;
          pack_weight_kg: number | null;
          thumbnail_url: string | null;
        };
        Insert: Omit<Database['public']['Tables']['product_subtypes']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['product_subtypes']['Insert']>;
      };
      size_presets: {
        Row: {
          id: string;
          product_id: string;
          width_cm: number;
          height_cm: number;
          aspect_ratio: string;
          enabled: boolean;
          sort_order: number;
          pack_width_cm: number | null;
          pack_height_cm: number | null;
          pack_depth_cm: number | null;
          pack_weight_kg: number | null;
        };
        Insert: Omit<Database['public']['Tables']['size_presets']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['size_presets']['Insert']>;
      };
      price_tiers: {
        Row: {
          id: string;
          product_id: string;
          subtype_id: string | null;
          tier1_price_sqm: number;
          tier2_price_sqm: number;
          tier_threshold_sqm: number;
        };
        Insert: Omit<Database['public']['Tables']['price_tiers']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['price_tiers']['Insert']>;
      };
      finishes: {
        Row: {
          id: string;
          subtype_id: string;
          name_en: string;
          name_he: string;
          enabled: boolean;
          surcharge_pct: number;
          thumbnail_url: string;
          sort_order: number;
        };
        Insert: Omit<Database['public']['Tables']['finishes']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['finishes']['Insert']>;
      };
      frame_styles: {
        Row: {
          id: string;
          name_en: string;
          name_he: string;
          material: string;
          price_per_cm: number;
          enabled: boolean;
          sort_order: number;
        };
        Insert: Omit<Database['public']['Tables']['frame_styles']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['frame_styles']['Insert']>;
      };
      frame_colors: {
        Row: {
          id: string;
          frame_style_id: string;
          color_name_en: string;
          color_name_he: string;
          hex_code: string;
        };
        Insert: Omit<Database['public']['Tables']['frame_colors']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['frame_colors']['Insert']>;
      };
      frame_widths: {
        Row: {
          id: string;
          width_cm: number;
          surcharge_pct: number;
          sort_order: number;
          enabled: boolean;
        };
        Insert: Omit<Database['public']['Tables']['frame_widths']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['frame_widths']['Insert']>;
      };
      glazing_options: {
        Row: {
          id: string;
          name_en: string;
          name_he: string;
          price_sqm: number;
          enabled: boolean;
          sort_order: number;
        };
        Insert: Omit<Database['public']['Tables']['glazing_options']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['glazing_options']['Insert']>;
      };
      subframe_options: {
        Row: {
          id: string;
          name_en: string;
          name_he: string;
          material: string;
          color: string;
          width_cm: number;
          height_cm: number;
          inset_cm: number;
          surcharge_pct: number;
          enabled: boolean;
        };
        Insert: Omit<Database['public']['Tables']['subframe_options']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['subframe_options']['Insert']>;
      };
      material_tooltips: {
        Row: {
          id: string;
          product_slug: string;
          title_en: string;
          title_he: string;
          finish_en: string;
          finish_he: string;
          best_for_en: string;
          best_for_he: string;
          durability_en: string;
          durability_he: string;
        };
        Insert: Omit<Database['public']['Tables']['material_tooltips']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['material_tooltips']['Insert']>;
      };
      orders: {
        Row: {
          id: string;
          user_id: string | null;
          shopify_order_id: string | null;
          product_selections: Json;
          image_url: string | null;
          total_price_ils: number;
          status: string;
          customer_email: string | null;
          customer_name: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: 'admin' | 'user';
        };
        Insert: Omit<Database['public']['Tables']['user_roles']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['user_roles']['Insert']>;
      };
      shopify_config: {
        Row: {
          id: string;
          store_domain: string;
          api_version: string;
          client_id: string;
          client_secret: string;
          admin_api_token: string;
          oauth_scopes: string;
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['shopify_config']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['shopify_config']['Insert']>;
      };
      shopify_variant_mappings: {
        Row: {
          id: string;
          product_id: string;
          subtype_id: string | null;
          size_id: string | null;
          finish_id: string | null;
          frame_style_id: string | null;
          frame_color_id: string | null;
          frame_width_id: string | null;
          glazing_id: string | null;
          subframe_id: string | null;
          canvas_edge_wrap_id: string | null;
          add_frame: boolean;
          shopify_variant_id: string;
          mapping_key: string;
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['shopify_variant_mappings']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['shopify_variant_mappings']['Insert']>;
      };
    };
    Functions: {
      has_role: {
        Args: { _user_id: string; _role: string };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: 'admin' | 'user';
    };
  };
};
