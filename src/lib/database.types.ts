export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================
// Domain Types (for typed JSON fields)
// ============================================

export interface Ingredient {
  item: string;
  quantity: string;
  notes: string;
}

export interface Step {
  instruction: string;
}

export interface Nutrition {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sodium?: number;
}

export interface RecipeEquipmentJoin {
  equipment_id: string;
  is_required: boolean;
  notes: string | null;
  equipment: KitchenEquipment;
}

export interface KitchenEquipment {
  id: string;
  name: string;
  category: string;
  description: string | null;
}

export interface RecipeUsageStats {
  recipe_id: string;
  total_meal_plans: number;
  this_week_plans: number;
  total_cooks: number;
}

// ============================================
// Convenience Type Aliases
// ============================================

export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert'];
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update'];

export type Repo = Database['public']['Tables']['repos']['Row'];
export type RepoInsert = Database['public']['Tables']['repos']['Insert'];
export type RepoUpdate = Database['public']['Tables']['repos']['Update'];

export type Recipe = Database['public']['Tables']['recipes']['Row'];
export type RecipeInsert = Database['public']['Tables']['recipes']['Insert'];
export type RecipeUpdate = Database['public']['Tables']['recipes']['Update'];

export type PullRequest = Database['public']['Tables']['pull_requests']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type Star = Database['public']['Tables']['stars']['Row'];
export type Follow = Database['public']['Tables']['follows']['Row'];

// Recipe with parsed JSON fields (for use in components)
export interface RecipeWithParsedFields extends Omit<Recipe, 'ingredients' | 'steps' | 'nutrition'> {
  ingredients: Ingredient[];
  steps: Step[];
  nutrition: Nutrition | null;
}

// Recipe with joined relations
export interface RecipeWithRelations extends RecipeWithParsedFields {
  repo?: Repo;
  author?: UserProfile;
}

// ============================================
// Database Schema
// ============================================

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          username: string
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          location: string | null
          cooking_specialty: string | null
          dietary_tags: string[]
          is_pro: boolean
          follower_count: number
          following_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          cooking_specialty?: string | null
          dietary_tags?: string[]
          is_pro?: boolean
          follower_count?: number
          following_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          cooking_specialty?: string | null
          dietary_tags?: string[]
          is_pro?: boolean
          follower_count?: number
          following_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      repos: {
        Row: {
          id: string
          owner_id: string
          title: string
          description: string | null
          tags: string[]
          is_private: boolean
          star_count: number
          fork_count: number
          recipe_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          title: string
          description?: string | null
          tags?: string[]
          is_private?: boolean
          star_count?: number
          fork_count?: number
          recipe_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          title?: string
          description?: string | null
          tags?: string[]
          is_private?: boolean
          star_count?: number
          fork_count?: number
          recipe_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      recipes: {
        Row: {
          id: string
          repo_id: string
          title: string
          ingredients: Json
          steps: Json
          tags: string[]
          cooking_time: number | null
          prep_time: number | null
          skill_level: string
          yield_amount: string | null
          notes: string | null
          nutrition: Json | null
          hero_image_url: string | null
          star_count: number
          fork_count: number
          current_version: number
          original_recipe_id: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          repo_id: string
          title: string
          ingredients?: Json
          steps?: Json
          tags?: string[]
          cooking_time?: number | null
          prep_time?: number | null
          skill_level?: string
          yield_amount?: string | null
          notes?: string | null
          nutrition?: Json | null
          hero_image_url?: string | null
          star_count?: number
          fork_count?: number
          current_version?: number
          original_recipe_id?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          repo_id?: string
          title?: string
          ingredients?: Json
          steps?: Json
          tags?: string[]
          cooking_time?: number | null
          prep_time?: number | null
          skill_level?: string
          yield_amount?: string | null
          notes?: string | null
          nutrition?: Json | null
          hero_image_url?: string | null
          star_count?: number
          fork_count?: number
          current_version?: number
          original_recipe_id?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      pull_requests: {
        Row: {
          id: string
          source_recipe_id: string
          target_recipe_id: string
          author_id: string
          title: string
          description: string | null
          status: string
          created_at: string
          updated_at: string
          merged_at: string | null
        }
        Insert: {
          id?: string
          source_recipe_id: string
          target_recipe_id: string
          author_id: string
          title: string
          description?: string | null
          status?: string
          created_at?: string
          updated_at?: string
          merged_at?: string | null
        }
        Update: {
          id?: string
          source_recipe_id?: string
          target_recipe_id?: string
          author_id?: string
          title?: string
          description?: string | null
          status?: string
          created_at?: string
          updated_at?: string
          merged_at?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string | null
          link: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message?: string | null
          link?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string | null
          link?: string | null
          read?: boolean
          created_at?: string
        }
      }
      stars: {
        Row: {
          user_id: string
          recipe_id: string | null
          repo_id: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          recipe_id?: string | null
          repo_id?: string | null
          created_at?: string
        }
        Update: {
          user_id?: string
          recipe_id?: string | null
          repo_id?: string | null
          created_at?: string
        }
      }
      follows: {
        Row: {
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
    }
  }
}
