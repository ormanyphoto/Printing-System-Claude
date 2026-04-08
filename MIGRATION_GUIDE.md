# Or Many Fine Art – Full Project Migration Guide

## Quick Start (Local Development)

```bash
# 1. Clone the repo from GitHub (your Lovable project syncs to GitHub)
git clone <YOUR_GITHUB_REPO_URL>
cd or-many-fine-art

# 2. Install dependencies
npm install

# 3. Create .env file (see Environment Variables section below)

# 4. Start dev server
npm run dev
# App runs on http://localhost:8080

# 5. For Supabase local development (optional)
npx supabase init   # if not already done
npx supabase start  # starts local Supabase
npx supabase db push # apply migrations
```

---

## 1. Project Overview

**Stack:** React 18 + Vite 5 + TypeScript 5 + Tailwind CSS 3 + shadcn/ui  
**Backend:** Supabase (Auth, Database, Edge Functions, Storage)  
**Integrations:** Shopify (OAuth + variant sync), DHL (shipping rates), VirusTotal (file scanning)  
**i18n:** English + Hebrew (RTL support)

---

## 2. Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
VITE_SUPABASE_PROJECT_ID=your_project_ref
```

### Edge Function Secrets (set in Supabase Dashboard → Settings → Secrets)

| Secret Name | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (admin access) |
| `SUPABASE_DB_URL` | Direct Postgres connection string |
| `SHOPIFY_ADMIN_TOKEN` | Shopify Admin API token (fallback) |
| `DHL_API_KEY` | DHL Express API key |
| `DHL_ACCOUNT_NUMBER` | DHL account number |
| `VIRUSTOTAL_API_KEY` | VirusTotal API key for file scanning |
| `LOVABLE_API_KEY` | AI gateway key (replace with your own AI provider) |

---

## 3. File/Folder Structure

```
├── index.html                          # Entry HTML
├── package.json                        # Dependencies & scripts
├── vite.config.ts                      # Vite configuration
├── tailwind.config.ts                  # Tailwind + design tokens
├── tsconfig.json / tsconfig.app.json   # TypeScript config
├── postcss.config.js                   # PostCSS config
├── eslint.config.js                    # ESLint config
├── vitest.config.ts                    # Test config
├── components.json                     # shadcn/ui config
├── public/
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
├── src/
│   ├── main.tsx                        # App entry point (i18n, RTL setup)
│   ├── App.tsx                         # Router & providers
│   ├── App.css                         # Global styles
│   ├── index.css                       # Tailwind + CSS variables/tokens
│   ├── i18n.ts                         # i18next configuration
│   ├── vite-env.d.ts                   # Vite type declarations
│   ├── assets/                         # Images (frames, products, rooms)
│   ├── components/
│   │   ├── ui/                         # shadcn/ui primitives (40+ components)
│   │   ├── admin/                      # Admin panel components
│   │   │   ├── AdminLayout.tsx         # Admin shell with sidebar nav
│   │   │   ├── ThumbnailUpload.tsx     # Image upload for admin
│   │   │   └── VariantMappingsManager.tsx # Shopify variant mapping UI
│   │   ├── home/                       # Landing page components
│   │   ├── layout/                     # Header, Footer
│   │   ├── order/                      # Order flow components
│   │   │   ├── ImageUpload.tsx         # File upload with virus scan
│   │   │   ├── PhotoEditor.tsx         # Crop/edit uploaded photo
│   │   │   ├── ProductSelector.tsx     # Product type picker
│   │   │   ├── SizeSelector.tsx        # Size preset selector
│   │   │   ├── FinishSelector.tsx      # Finish options
│   │   │   ├── FramedOptionsSelector.tsx # Frame style/color/width
│   │   │   ├── CanvasOptionsSelector.tsx # Canvas-specific options
│   │   │   ├── SubframeSelector.tsx    # Subframe options
│   │   │   ├── SubtypeSelector.tsx     # Product subtype picker
│   │   │   ├── WhiteBorderSelector.tsx # White border toggle
│   │   │   ├── OrderSummary.tsx        # Order review
│   │   │   ├── PriceSummary.tsx        # Price breakdown
│   │   │   ├── ProductPreview.tsx      # 2D preview
│   │   │   ├── Product3DPreview.tsx    # Three.js 3D preview
│   │   │   ├── WallMockup.tsx          # Room mockup preview
│   │   │   ├── QualityIndicator.tsx    # Resolution quality badge
│   │   │   ├── MaterialTooltip.tsx     # Product info tooltips
│   │   │   └── StepProgress.tsx        # Step progress bar
│   │   └── NavLink.tsx
│   ├── hooks/
│   │   ├── useOrderFlow.ts            # Main order state machine
│   │   ├── useEmbed.ts                # Shopify iframe detection
│   │   ├── useLocalizedField.ts       # i18n field helper
│   │   ├── use-mobile.tsx             # Mobile breakpoint hook
│   │   └── use-toast.ts               # Toast notification hook
│   ├── integrations/supabase/
│   │   ├── client.ts                  # Supabase client (auto-generated)
│   │   └── types.ts                   # Database types (auto-generated)
│   ├── lib/
│   │   ├── pricing.ts                 # Price calculation logic
│   │   ├── aspect-ratio.ts            # Aspect ratio utilities
│   │   ├── frame-textures.ts          # Frame texture mapping
│   │   ├── error-messages.ts          # Safe error message formatting
│   │   ├── tiff-preview.ts            # TIFF file preview support
│   │   └── utils.ts                   # General utilities (cn, etc.)
│   ├── pages/
│   │   ├── Index.tsx                  # Landing page (redirects to /order)
│   │   ├── Order.tsx                  # Main order flow page
│   │   ├── Login.tsx                  # Admin login
│   │   ├── OrderHistory.tsx           # User order history
│   │   ├── NotFound.tsx               # 404 page
│   │   └── admin/                     # Admin pages (15 pages)
│   │       ├── AdminDashboard.tsx
│   │       ├── AdminProducts.tsx
│   │       ├── AdminProductDetail.tsx
│   │       ├── AdminSizes.tsx
│   │       ├── AdminShipping.tsx
│   │       ├── AdminFrameStyles.tsx
│   │       ├── AdminFrameColors.tsx
│   │       ├── AdminFrameWidths.tsx
│   │       ├── AdminGlazing.tsx
│   │       ├── AdminSubframes.tsx
│   │       ├── AdminFinishes.tsx
│   │       ├── AdminSubtypes.tsx
│   │       ├── AdminPriceTiers.tsx
│   │       ├── AdminOrders.tsx
│   │       ├── AdminIntegrations.tsx
│   │       └── AdminTooltips.tsx
│   └── test/
│       ├── setup.ts
│       └── example.test.ts
├── supabase/
│   ├── config.toml                    # Supabase project config
│   ├── migrations/                    # 24 SQL migration files
│   └── functions/                     # 5 Edge Functions
│       ├── dhl-rates/index.ts         # DHL shipping rate calculator
│       ├── shopify-sync/index.ts      # Shopify order sync
│       ├── shopify-oauth/index.ts     # Shopify OAuth flow
│       ├── shopify-generate-variants/index.ts  # Bulk variant generator
│       └── virus-scan/index.ts        # VirusTotal file scanning
```

---

## 4. Database Schema (Full SQL)

Run this in your Supabase SQL Editor or via `psql` after creating a new Supabase project:

```sql
-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- ============================================
-- TABLES
-- ============================================

CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en text NOT NULL,
  name_he text NOT NULL DEFAULT '',
  slug text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT true,
  max_width_cm integer NOT NULL DEFAULT 300,
  max_height_cm integer NOT NULL DEFAULT 150,
  sort_order integer NOT NULL DEFAULT 0,
  description_en text DEFAULT '',
  description_he text DEFAULT '',
  thumbnail_url text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.product_subtypes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name_en text NOT NULL,
  name_he text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  thickness_mm numeric,
  description_en text DEFAULT '',
  description_he text DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  pack_width_cm numeric,
  pack_height_cm numeric,
  pack_depth_cm numeric,
  pack_weight_kg numeric,
  thumbnail_url text
);

CREATE TABLE public.size_presets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  width_cm integer NOT NULL,
  height_cm integer NOT NULL,
  aspect_ratio text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  pack_width_cm numeric,
  pack_height_cm numeric,
  pack_depth_cm numeric,
  pack_weight_kg numeric
);

CREATE TABLE public.price_tiers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  subtype_id uuid REFERENCES product_subtypes(id) ON DELETE CASCADE,
  tier1_price_sqm numeric NOT NULL DEFAULT 0,
  tier2_price_sqm numeric NOT NULL DEFAULT 0,
  tier_threshold_sqm numeric NOT NULL DEFAULT 0.25
);

CREATE TABLE public.finishes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subtype_id uuid NOT NULL REFERENCES product_subtypes(id) ON DELETE CASCADE,
  name_en text NOT NULL,
  name_he text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  surcharge_pct numeric NOT NULL DEFAULT 0,
  thumbnail_url text DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE public.frame_styles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en text NOT NULL,
  name_he text NOT NULL DEFAULT '',
  material text NOT NULL,
  price_per_cm numeric NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE public.frame_colors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  frame_style_id uuid NOT NULL REFERENCES frame_styles(id) ON DELETE CASCADE,
  color_name_en text NOT NULL,
  color_name_he text NOT NULL DEFAULT '',
  hex_code text NOT NULL DEFAULT '#000000'
);

CREATE TABLE public.frame_widths (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  width_cm numeric NOT NULL,
  surcharge_pct numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true
);

CREATE TABLE public.glazing_options (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en text NOT NULL,
  name_he text NOT NULL DEFAULT '',
  price_sqm numeric NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE public.subframe_options (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en text NOT NULL,
  name_he text NOT NULL DEFAULT '',
  material text NOT NULL,
  color text NOT NULL DEFAULT '',
  width_cm numeric NOT NULL DEFAULT 4,
  height_cm numeric NOT NULL DEFAULT 1.5,
  inset_cm numeric NOT NULL DEFAULT 6,
  surcharge_pct numeric NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true
);

CREATE TABLE public.material_tooltips (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_slug text NOT NULL UNIQUE,
  title_en text NOT NULL DEFAULT '',
  title_he text NOT NULL DEFAULT '',
  finish_en text NOT NULL DEFAULT '',
  finish_he text NOT NULL DEFAULT '',
  best_for_en text NOT NULL DEFAULT '',
  best_for_he text NOT NULL DEFAULT '',
  durability_en text NOT NULL DEFAULT '',
  durability_he text NOT NULL DEFAULT ''
);

CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  shopify_order_id text,
  product_selections jsonb NOT NULL DEFAULT '{}',
  image_url text,
  total_price_ils numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  customer_email text,
  customer_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

CREATE TABLE public.shopify_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_domain text NOT NULL DEFAULT '',
  api_version text NOT NULL DEFAULT '2024-01',
  client_id text NOT NULL DEFAULT '',
  client_secret text NOT NULL DEFAULT '',
  admin_api_token text NOT NULL DEFAULT '',
  oauth_scopes text NOT NULL DEFAULT 'read_orders,write_orders,read_draft_orders,write_draft_orders',
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.shopify_oauth_state (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nonce text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes')
);

CREATE TABLE public.shopify_sync_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  collection_id text,
  status text NOT NULL DEFAULT 'pending',
  synced_count integer NOT NULL DEFAULT 0,
  total_combinations integer NOT NULL DEFAULT 0,
  last_batch_index integer NOT NULL DEFAULT 0,
  combinations jsonb NOT NULL DEFAULT '[]',
  error_log jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.shopify_variant_mappings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  subtype_id uuid REFERENCES product_subtypes(id) ON DELETE SET NULL,
  size_id uuid REFERENCES size_presets(id) ON DELETE SET NULL,
  finish_id uuid REFERENCES finishes(id) ON DELETE SET NULL,
  frame_style_id uuid REFERENCES frame_styles(id) ON DELETE SET NULL,
  frame_color_id uuid REFERENCES frame_colors(id) ON DELETE SET NULL,
  frame_width_id uuid REFERENCES frame_widths(id) ON DELETE SET NULL,
  glazing_id uuid REFERENCES glazing_options(id) ON DELETE SET NULL,
  subframe_id uuid REFERENCES subframe_options(id) ON DELETE SET NULL,
  canvas_edge_wrap_id text,
  add_frame boolean DEFAULT false,
  shopify_variant_id text NOT NULL,
  mapping_key text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_subtypes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.size_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frame_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frame_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frame_widths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glazing_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subframe_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_tooltips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_oauth_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_variant_mappings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Products (public read, admin write)
CREATE POLICY "Products are publicly readable" ON products FOR SELECT USING (true);
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Product subtypes
CREATE POLICY "Subtypes are publicly readable" ON product_subtypes FOR SELECT USING (true);
CREATE POLICY "Admins can manage subtypes" ON product_subtypes FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Size presets
CREATE POLICY "Size presets are publicly readable" ON size_presets FOR SELECT USING (true);
CREATE POLICY "Admins can manage size_presets" ON size_presets FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Price tiers
CREATE POLICY "Price tiers are publicly readable" ON price_tiers FOR SELECT USING (true);
CREATE POLICY "Admins can manage price_tiers" ON price_tiers FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Finishes
CREATE POLICY "Finishes are publicly readable" ON finishes FOR SELECT USING (true);
CREATE POLICY "Admins can manage finishes" ON finishes FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Frame styles
CREATE POLICY "Frame styles are publicly readable" ON frame_styles FOR SELECT USING (true);
CREATE POLICY "Admins can manage frame_styles" ON frame_styles FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Frame colors
CREATE POLICY "Frame colors are publicly readable" ON frame_colors FOR SELECT USING (true);
CREATE POLICY "Admins can manage frame_colors" ON frame_colors FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Frame widths
CREATE POLICY "Frame widths are publicly readable" ON frame_widths FOR SELECT USING (true);
CREATE POLICY "Admins can manage frame_widths" ON frame_widths FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Glazing options
CREATE POLICY "Glazing options are publicly readable" ON glazing_options FOR SELECT USING (true);
CREATE POLICY "Admins can manage glazing_options" ON glazing_options FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Subframe options
CREATE POLICY "Subframe options are publicly readable" ON subframe_options FOR SELECT USING (true);
CREATE POLICY "Admins can manage subframe_options" ON subframe_options FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Material tooltips
CREATE POLICY "Material tooltips are publicly readable" ON material_tooltips FOR SELECT USING (true);
CREATE POLICY "Admins can manage material_tooltips" ON material_tooltips FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Orders
CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own orders" ON orders FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own orders" ON orders FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage orders" ON orders FOR ALL USING (has_role(auth.uid(), 'admin'));

-- User roles
CREATE POLICY "Users can read own roles" ON user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage user_roles" ON user_roles FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Shopify config (admin only)
CREATE POLICY "Shopify config is readable by admins" ON shopify_config FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage shopify_config" ON shopify_config FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Shopify OAuth state
CREATE POLICY "Admins can manage oauth state" ON shopify_oauth_state FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Shopify sync jobs
CREATE POLICY "Admins can manage sync jobs" ON shopify_sync_jobs FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Shopify variant mappings
CREATE POLICY "Variant mappings are publicly readable" ON shopify_variant_mappings FOR SELECT USING (true);
CREATE POLICY "Admins can manage shopify_variant_mappings" ON shopify_variant_mappings FOR ALL USING (has_role(auth.uid(), 'admin'));
```

---

## 5. Storage Buckets

Create these buckets in your new Supabase project (Dashboard → Storage):

| Bucket | Public | Purpose |
|---|---|---|
| `admin-thumbnails` | Yes | Product/subtype thumbnail images |
| `order-images` | No | Customer uploaded print files |

---

## 6. Edge Functions

All edge functions are in `supabase/functions/`. Deploy them with:

```bash
npx supabase functions deploy dhl-rates --no-verify-jwt
npx supabase functions deploy shopify-sync --no-verify-jwt
npx supabase functions deploy shopify-oauth --no-verify-jwt
npx supabase functions deploy shopify-generate-variants --no-verify-jwt
npx supabase functions deploy virus-scan --no-verify-jwt
```

### Function Summary:

| Function | Purpose |
|---|---|
| `dhl-rates` | Calculates DHL Express shipping rates based on package dimensions |
| `shopify-sync` | Tests Shopify connection & creates draft orders |
| `shopify-oauth` | Handles Shopify OAuth authorization flow |
| `shopify-generate-variants` | Bulk creates/updates Shopify products & variants with pricing and box metafields |
| `virus-scan` | Scans uploaded files via VirusTotal API |

---

## 7. Authentication

- Uses **Supabase Auth** with email/password login
- Admin access controlled via `user_roles` table with `app_role` enum
- Login page at `/login`
- Admin routes protected in `AdminLayout.tsx` (checks `has_role` function)

### Setting up an admin user:
1. Create a user via Supabase Auth
2. Insert into `user_roles`: `INSERT INTO user_roles (user_id, role) VALUES ('USER_UUID', 'admin');`

---

## 8. Routing

| Route | Component | Access |
|---|---|---|
| `/` | Redirect → `/order` | Public |
| `/order` | Order flow | Public |
| `/login` | Admin login | Public |
| `/admin` | Admin dashboard | Admin only |
| `/admin/products` | Product management | Admin only |
| `/admin/product/:slug` | Product detail | Admin only |
| `/admin/sizes` | Size presets | Admin only |
| `/admin/shipping` | Shipping config | Admin only |
| `/admin/frame-styles` | Frame styles | Admin only |
| `/admin/frame-colors` | Frame colors | Admin only |
| `/admin/frame-widths` | Frame widths | Admin only |
| `/admin/glazing` | Glazing options | Admin only |
| `/admin/subframes` | Subframe options | Admin only |
| `/admin/orders` | Order management | Admin only |
| `/admin/integrations` | Shopify integration | Admin only |
| `/admin/tooltips` | Material tooltips | Admin only |

---

## 9. Integrations

### Shopify
- **OAuth flow** via `shopify-oauth` edge function
- **Redirect URL:** `https://YOUR_SUPABASE_URL/functions/v1/shopify-oauth`
- **Scopes:** `read_orders,write_orders,read_products,write_products`
- Admin token stored in `shopify_config.admin_api_token`
- Variant mappings use a deterministic pipe-separated key format
- Box dimensions synced as Shopify variant metafields (`shipping` namespace)

### DHL Express
- Rate calculation via `dhl-rates` edge function
- Requires `DHL_API_KEY` and `DHL_ACCOUNT_NUMBER` secrets

### VirusTotal
- File scanning before accepting uploads
- Requires `VIRUSTOTAL_API_KEY` secret

### Shopify Embed (iframe)
- App detects if running inside an iframe
- Uses `postMessage` bridge for cart redirects (`lovable:checkout` event)
- Language sync via `lovable:setLanguage` message

---

## 10. Things That Cannot Be Directly Exported

1. **Database Data:** Export your data from the Lovable Cloud UI (Cloud → Database → Tables → Export) or use `pg_dump`
2. **Auth Users:** Users are in `auth.users` (managed by Supabase). Export via Supabase dashboard or migrate manually.
3. **Storage Files:** Download files from Supabase Storage dashboard or use the Supabase CLI: `npx supabase storage ls` / `npx supabase storage cp`
4. **Secrets/API Keys:** You'll need to re-enter all secrets in your new Supabase project's dashboard (Settings → Secrets)
5. **AI Gateway (LOVABLE_API_KEY):** Replace with your own AI provider (OpenAI, Google AI, etc.) if you use AI features

---

## 11. Supabase CLI Setup (New Project)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
npx supabase login

# Link to your new project
npx supabase link --project-ref YOUR_NEW_PROJECT_REF

# Push all migrations
npx supabase db push

# Deploy edge functions
npx supabase functions deploy --no-verify-jwt

# Set secrets
npx supabase secrets set SHOPIFY_ADMIN_TOKEN=xxx
npx supabase secrets set DHL_API_KEY=xxx
npx supabase secrets set DHL_ACCOUNT_NUMBER=xxx
npx supabase secrets set VIRUSTOTAL_API_KEY=xxx
```

---

## 12. Build & Deploy

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# The dist/ folder can be deployed to any static host:
# Vercel, Netlify, Cloudflare Pages, AWS S3+CloudFront, etc.
```

For self-hosting details: https://docs.lovable.dev/tips-tricks/self-hosting
