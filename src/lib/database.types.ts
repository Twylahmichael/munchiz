export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type OrderStatus = "pending" | "confirmed" | "preparing" | "on_the_way" | "completed" | "cancelled";
export type OrderType = "delivery" | "pickup";
export type PaymentMethod = "cash" | "mpesa";
export type PaymentStatus = "pending" | "paid" | "failed";
export type UserRole = "customer" | "admin";
export type DriverStatus = "available" | "on_delivery" | "offline";
export type DiscountType = "percentage" | "fixed";
export type CampaignType = "push_notification" | "sms" | "email" | "in_app";
export type CampaignStatus = "draft" | "scheduled" | "sent" | "cancelled";
export type TargetAudience = "all" | "new_customers" | "returning" | "inactive";
export type RewardTier = "bronze" | "silver" | "gold" | "platinum";
export type LeadSource = "walk_in" | "social_media" | "referral" | "website" | "other";
export type LeadStatus = "new" | "contacted" | "converted" | "lost";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string;
          email: string;
          role: UserRole;
          is_approved: boolean;
          default_delivery_address: string | null;
          delivery_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          phone?: string;
          email?: string;
          role?: UserRole;
          is_approved?: boolean;
          default_delivery_address?: string | null;
          delivery_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string;
          phone?: string;
          email?: string;
          role?: UserRole;
          is_approved?: boolean;
          default_delivery_address?: string | null;
          delivery_notes?: string | null;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          sort_order: number;
          icon: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          sort_order?: number;
          icon?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          sort_order?: number;
          icon?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      menu_items: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          description: string;
          price: number;
          photo_url: string | null;
          is_available: boolean;
          sort_order: number;
          favorites_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          description: string;
          price: number;
          photo_url?: string | null;
          is_available?: boolean;
          sort_order?: number;
          favorites_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string;
          name?: string;
          description?: string;
          price?: number;
          photo_url?: string | null;
          is_available?: boolean;
          sort_order?: number;
          favorites_count?: number;
          updated_at?: string;
        };
      };
      deals: {
        Row: {
          id: string;
          title: string;
          description: string;
          original_price: number;
          deal_price: number;
          menu_item_ids: string[];
          photo_url: string | null;
          start_date: string | null;
          end_date: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          original_price: number;
          deal_price: number;
          menu_item_ids?: string[];
          photo_url?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          original_price?: number;
          deal_price?: number;
          menu_item_ids?: string[];
          photo_url?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string | null;
          customer_name: string;
          customer_phone: string;
          order_type: OrderType;
          delivery_address: string | null;
          delivery_notes: string | null;
          location_notes: string | null;
          pickup_branch_id: string | null;
          pickup_branch_name: string | null;
          zone_id: string | null;
          zone_name: string | null;
          estimated_time_minutes: number | null;
          items_summary: Json;
          subtotal: number;
          delivery_fee: number;
          total_amount: number;
          payment_method: PaymentMethod;
          payment_status: PaymentStatus;
          status: OrderStatus;
          assigned_driver_id: string | null;
          whatsapp_sent: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          customer_name: string;
          customer_phone: string;
          order_type: OrderType;
          delivery_address?: string | null;
          delivery_notes?: string | null;
          location_notes?: string | null;
          pickup_branch_id?: string | null;
          pickup_branch_name?: string | null;
          zone_id?: string | null;
          zone_name?: string | null;
          estimated_time_minutes?: number | null;
          items_summary: Json;
          subtotal?: number;
          delivery_fee?: number;
          total_amount: number;
          payment_method?: PaymentMethod;
          payment_status?: PaymentStatus;
          status?: OrderStatus;
          assigned_driver_id?: string | null;
          whatsapp_sent?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string | null;
          customer_name?: string;
          customer_phone?: string;
          order_type?: OrderType;
          delivery_address?: string | null;
          delivery_notes?: string | null;
          location_notes?: string | null;
          pickup_branch_id?: string | null;
          pickup_branch_name?: string | null;
          zone_id?: string | null;
          zone_name?: string | null;
          estimated_time_minutes?: number | null;
          items_summary?: Json;
          subtotal?: number;
          delivery_fee?: number;
          total_amount?: number;
          payment_method?: PaymentMethod;
          payment_status?: PaymentStatus;
          status?: OrderStatus;
          assigned_driver_id?: string | null;
          whatsapp_sent?: boolean;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          menu_item_id: string;
          item_name: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          menu_item_id: string;
          item_name: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
          created_at?: string;
        };
        Update: {
          order_id?: string;
          menu_item_id?: string;
          item_name?: string;
          quantity?: number;
          unit_price?: number;
          subtotal?: number;
        };
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          menu_item_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          menu_item_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          menu_item_id?: string;
        };
      };
      site_settings: {
        Row: {
          id: string;
          business_name: string;
          tagline: string;
          whatsapp_number: string;
          phone_number: string;
          logo_url: string | null;
          location_text: string;
          google_maps_embed_url: string | null;
          operating_hours: Json;
          tiktok_handle: string | null;
          instagram_handle: string | null;
          delivery_fee: number;
          minimum_order_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_name?: string;
          tagline?: string;
          whatsapp_number?: string;
          phone_number?: string;
          logo_url?: string | null;
          location_text?: string;
          google_maps_embed_url?: string | null;
          operating_hours?: Json;
          tiktok_handle?: string | null;
          instagram_handle?: string | null;
          delivery_fee?: number;
          minimum_order_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          business_name?: string;
          tagline?: string;
          whatsapp_number?: string;
          phone_number?: string;
          logo_url?: string | null;
          location_text?: string;
          google_maps_embed_url?: string | null;
          operating_hours?: Json;
          tiktok_handle?: string | null;
          instagram_handle?: string | null;
          delivery_fee?: number;
          minimum_order_amount?: number;
          updated_at?: string;
        };
      };
      vendors: {
        Row: {
          id: string;
          name: string;
          contact_phone: string;
          contact_email: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          contact_phone?: string;
          contact_email?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          contact_phone?: string;
          contact_email?: string;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      drivers: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          phone: string;
          is_active: boolean;
          current_status: DriverStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          phone?: string;
          is_active?: boolean;
          current_status?: DriverStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string | null;
          name?: string;
          phone?: string;
          is_active?: boolean;
          current_status?: DriverStatus;
          updated_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          title: string;
          amount: number;
          category: string;
          date: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          amount: number;
          category?: string;
          date?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          amount?: number;
          category?: string;
          date?: string;
          notes?: string | null;
          updated_at?: string;
        };
      };
      promos: {
        Row: {
          id: string;
          code: string;
          discount_type: DiscountType;
          discount_value: number;
          min_order_amount: number;
          max_uses: number | null;
          times_used: number;
          start_date: string;
          end_date: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          discount_type: DiscountType;
          discount_value: number;
          min_order_amount?: number;
          max_uses?: number | null;
          times_used?: number;
          start_date?: string;
          end_date: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          discount_type?: DiscountType;
          discount_value?: number;
          min_order_amount?: number;
          max_uses?: number | null;
          times_used?: number;
          start_date?: string;
          end_date?: string;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      flash_sales: {
        Row: {
          id: string;
          menu_item_id: string;
          flash_price: number;
          start_time: string;
          end_time: string;
          max_quantity: number | null;
          sold_count: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          menu_item_id: string;
          flash_price: number;
          start_time: string;
          end_time: string;
          max_quantity?: number | null;
          sold_count?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          menu_item_id?: string;
          flash_price?: number;
          start_time?: string;
          end_time?: string;
          max_quantity?: number | null;
          sold_count?: number;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      bundles: {
        Row: {
          id: string;
          name: string;
          description: string;
          menu_item_ids: string[];
          bundle_price: number;
          photo_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          menu_item_ids?: string[];
          bundle_price: number;
          photo_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string;
          menu_item_ids?: string[];
          bundle_price?: number;
          photo_url?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      campaigns: {
        Row: {
          id: string;
          name: string;
          type: CampaignType;
          message: string;
          target_audience: TargetAudience;
          scheduled_at: string | null;
          sent_at: string | null;
          status: CampaignStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: CampaignType;
          message?: string;
          target_audience?: TargetAudience;
          scheduled_at?: string | null;
          sent_at?: string | null;
          status?: CampaignStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          type?: CampaignType;
          message?: string;
          target_audience?: TargetAudience;
          scheduled_at?: string | null;
          sent_at?: string | null;
          status?: CampaignStatus;
          updated_at?: string;
        };
      };
      rewards: {
        Row: {
          id: string;
          user_id: string;
          points: number;
          tier: RewardTier;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          points?: number;
          tier?: RewardTier;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          points?: number;
          tier?: RewardTier;
          updated_at?: string;
        };
      };
      customer_leads: {
        Row: {
          id: string;
          name: string;
          phone: string;
          email: string | null;
          source: LeadSource;
          notes: string | null;
          status: LeadStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string;
          email?: string | null;
          source?: LeadSource;
          notes?: string | null;
          status?: LeadStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          phone?: string;
          email?: string | null;
          source?: LeadSource;
          notes?: string | null;
          status?: LeadStatus;
          updated_at?: string;
        };
      };
      support_tickets: {
        Row: {
          id: string;
          user_id: string | null;
          order_id: string | null;
          subject: string;
          message: string;
          status: TicketStatus;
          priority: TicketPriority;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          order_id?: string | null;
          subject: string;
          message?: string;
          status?: TicketStatus;
          priority?: TicketPriority;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string | null;
          order_id?: string | null;
          subject?: string;
          message?: string;
          status?: TicketStatus;
          priority?: TicketPriority;
          updated_at?: string;
        };
      };
      zones: {
        Row: {
          id: string;
          name: string;
          delivery_fee: number;
          estimated_time_minutes: number;
          areas: string[];
          description: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          delivery_fee?: number;
          estimated_time_minutes?: number;
          areas?: string[];
          description?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          delivery_fee?: number;
          estimated_time_minutes?: number;
          areas?: string[];
          description?: string;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      addon_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          sort_order?: number;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      addons: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          description: string;
          price: number;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          description?: string;
          price?: number;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string;
          name?: string;
          description?: string;
          price?: number;
          is_active?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
      };
      menu_item_addons: {
        Row: {
          menu_item_id: string;
          addon_id: string;
          created_at: string;
        };
        Insert: {
          menu_item_id: string;
          addon_id: string;
          created_at?: string;
        };
        Update: {
          menu_item_id?: string;
          addon_id?: string;
        };
      };
      branches: {
        Row: {
          id: string;
          name: string;
          address: string;
          phone: string;
          operating_hours: Json;
          estimated_pickup_minutes: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string;
          phone?: string;
          operating_hours?: Json;
          estimated_pickup_minutes?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          address?: string;
          phone?: string;
          operating_hours?: Json;
          estimated_pickup_minutes?: number;
          is_active?: boolean;
          updated_at?: string;
        };
      };
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];
export type Deal = Database["public"]["Tables"]["deals"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type Favorite = Database["public"]["Tables"]["favorites"]["Row"];
export type SiteSettings = Database["public"]["Tables"]["site_settings"]["Row"];
export type Vendor = Database["public"]["Tables"]["vendors"]["Row"];
export type Driver = Database["public"]["Tables"]["drivers"]["Row"];
export type Expense = Database["public"]["Tables"]["expenses"]["Row"];
export type Promo = Database["public"]["Tables"]["promos"]["Row"];
export type FlashSale = Database["public"]["Tables"]["flash_sales"]["Row"];
export type Bundle = Database["public"]["Tables"]["bundles"]["Row"];
export type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];
export type Reward = Database["public"]["Tables"]["rewards"]["Row"];
export type CustomerLead = Database["public"]["Tables"]["customer_leads"]["Row"];
export type SupportTicket = Database["public"]["Tables"]["support_tickets"]["Row"];
export type Zone = Database["public"]["Tables"]["zones"]["Row"];
export type Branch = Database["public"]["Tables"]["branches"]["Row"];
export type AddonCategory = Database["public"]["Tables"]["addon_categories"]["Row"];
export type Addon = Database["public"]["Tables"]["addons"]["Row"];
export type MenuItemAddon = Database["public"]["Tables"]["menu_item_addons"]["Row"];
