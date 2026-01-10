export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "user" | "admin";
export type VideoStatus = "uploading" | "processing" | "ready" | "failed" | "deleted";
export type TranscodeStatus = "pending" | "processing" | "completed" | "failed";
export type SubscriptionTier = "free" | "starter" | "pro" | "business" | "scale" | "enterprise" | "enterprise_plus" | "ultimate";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          role: UserRole;
          storage_limit_bytes: number;
          storage_used_bytes: number;
          bandwidth_limit_bytes: number;
          bandwidth_used_bytes: number;
          bandwidth_reset_at: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          storage_limit_bytes?: number;
          storage_used_bytes?: number;
          bandwidth_limit_bytes?: number;
          bandwidth_used_bytes?: number;
          bandwidth_reset_at?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          storage_limit_bytes?: number;
          storage_used_bytes?: number;
          bandwidth_limit_bytes?: number;
          bandwidth_used_bytes?: number;
          bandwidth_reset_at?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          tier: SubscriptionTier;
          storage_limit_gb: number;
          bandwidth_limit_gb: number;
          starts_at: string;
          expires_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tier?: SubscriptionTier;
          storage_limit_gb?: number;
          bandwidth_limit_gb?: number;
          starts_at?: string;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tier?: SubscriptionTier;
          storage_limit_gb?: number;
          bandwidth_limit_gb?: number;
          starts_at?: string;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      videos: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          original_key: string | null;
          original_size_bytes: number;
          original_filename: string | null;
          mime_type: string | null;
          hls_key: string | null;
          thumbnail_key: string | null;
          duration_seconds: number | null;
          width: number | null;
          height: number | null;
          status: VideoStatus;
          error_message: string | null;
          views_count: number;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          original_key?: string | null;
          original_size_bytes?: number;
          original_filename?: string | null;
          mime_type?: string | null;
          hls_key?: string | null;
          thumbnail_key?: string | null;
          duration_seconds?: number | null;
          width?: number | null;
          height?: number | null;
          status?: VideoStatus;
          error_message?: string | null;
          views_count?: number;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          original_key?: string | null;
          original_size_bytes?: number;
          original_filename?: string | null;
          mime_type?: string | null;
          hls_key?: string | null;
          thumbnail_key?: string | null;
          duration_seconds?: number | null;
          width?: number | null;
          height?: number | null;
          status?: VideoStatus;
          error_message?: string | null;
          views_count?: number;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      transcode_jobs: {
        Row: {
          id: string;
          video_id: string;
          status: TranscodeStatus;
          priority: number;
          progress: number;
          current_step: string | null;
          worker_id: string | null;
          started_at: string | null;
          completed_at: string | null;
          error_message: string | null;
          retry_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          video_id: string;
          status?: TranscodeStatus;
          priority?: number;
          progress?: number;
          current_step?: string | null;
          worker_id?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          error_message?: string | null;
          retry_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          video_id?: string;
          status?: TranscodeStatus;
          priority?: number;
          progress?: number;
          current_step?: string | null;
          worker_id?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          error_message?: string | null;
          retry_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      api_keys: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          key_prefix: string;
          key_hash: string;
          permissions: Json;
          rate_limit_per_minute: number;
          is_active: boolean;
          last_used_at: string | null;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          key_prefix: string;
          key_hash: string;
          permissions?: Json;
          rate_limit_per_minute?: number;
          is_active?: boolean;
          last_used_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          key_prefix?: string;
          key_hash?: string;
          permissions?: Json;
          rate_limit_per_minute?: number;
          is_active?: boolean;
          last_used_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
      };
      webhooks: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          url: string;
          secret: string;
          events: string[];
          is_active: boolean;
          last_triggered_at: string | null;
          failure_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          url: string;
          secret: string;
          events?: string[];
          is_active?: boolean;
          last_triggered_at?: string | null;
          failure_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          url?: string;
          secret?: string;
          events?: string[];
          is_active?: boolean;
          last_triggered_at?: string | null;
          failure_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      webhook_deliveries: {
        Row: {
          id: string;
          webhook_id: string;
          event_type: string;
          payload: Json;
          response_status: number | null;
          response_body: string | null;
          duration_ms: number | null;
          success: boolean;
          attempt: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          webhook_id: string;
          event_type: string;
          payload: Json;
          response_status?: number | null;
          response_body?: string | null;
          duration_ms?: number | null;
          success?: boolean;
          attempt?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          webhook_id?: string;
          event_type?: string;
          payload?: Json;
          response_status?: number | null;
          response_body?: string | null;
          duration_ms?: number | null;
          success?: boolean;
          attempt?: number;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      user_role: UserRole;
      video_status: VideoStatus;
      transcode_status: TranscodeStatus;
      subscription_tier: SubscriptionTier;
    };
  };
}

// Helper types
export type User = Database["public"]["Tables"]["users"]["Row"];
export type Video = Database["public"]["Tables"]["videos"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
export type TranscodeJob = Database["public"]["Tables"]["transcode_jobs"]["Row"];
export type ApiKey = Database["public"]["Tables"]["api_keys"]["Row"];
export type Webhook = Database["public"]["Tables"]["webhooks"]["Row"];
export type WebhookDelivery = Database["public"]["Tables"]["webhook_deliveries"]["Row"];

// Webhook event types
export type WebhookEventType =
  | "media.uploaded"
  | "media.processing"
  | "media.ready"
  | "media.failed"
  | "media.deleted";
