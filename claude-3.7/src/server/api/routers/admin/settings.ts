// src/server/api/routers/admin/settings.ts
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

// Zod schema for SiteSettings (matching Prisma model structure for Json fields)
const SocialLinksSchema = z.record(z.string().url()).optional().nullable(); // { platform: url }
const ShippingMethodSchema = z.object({
  id: z.string(),
  name: z.string(),
  cost: z.number(),
  estimatedDelivery: z.string(),
  regions: z.array(z.string()).optional(), // e.g., array of country codes or state codes
});
const TaxRateSchema = z.object({
  region: z.string(), // e.g., "CA", "NY", or "*" for default
  rate: z.number().min(0).max(1), // e.g., 0.08 for 8%
  name: z.string().optional(), // e.g., "Sales Tax"
  inclusive: z.boolean().optional().default(false), // Is tax included in price
});
const StoreAddressSchema = z.object({
    line1: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
}).optional().nullable();

const SiteSettingsInputSchema = z.object({
  siteName: z.string().min(1).optional(),
  logoUrl: z.string().url().nullable().optional(),
  faviconUrl: z.string().url().nullable().optional(),
  primaryColor: z.string().regex(/^#([0-9a-f]{3}){1,2}$/i, "Invalid hex color").optional(),
  secondaryColor: z.string().regex(/^#([0-9a-f]{3}){1,2}$/i, "Invalid hex color").optional(),
  accentColor: z.string().regex(/^#([0-9a-f]{3}){1,2}$/i, "Invalid hex color").optional(),
  defaultCurrency: z.string().length(3).toUpperCase().optional(), // ISO 4217
  defaultLanguage: z.string().length(2).toLowerCase().optional(), // ISO 639-1
  contactEmail: z.string().email().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  socialLinks: SocialLinksSchema,
  shippingMethods: z.array(ShippingMethodSchema).nullable().optional(),
  taxRates: z.array(TaxRateSchema).nullable().optional(),
  defaultMetaTitle: z.string().nullable().optional(),
  defaultMetaDescription: z.string().nullable().optional(),
  maintenanceMode: z.boolean().optional(),
  storeAddress: StoreAddressSchema,
});


export const adminSettingsRouter = createTRPCRouter({
  getSiteSettings: adminProcedure
    .query(async ({ ctx }) => {
      console.log("Admin: Fetching site settings");
      const settings = await ctx.db.siteSettings.findUnique({
        where: { id: "global_settings" },
      });
      if (!settings) { // Should ideally be seeded
        // Create default settings if they don't exist
        return ctx.db.siteSettings.create({ data: { id: "global_settings" }});
      }
      return settings;
    }),

  updateSiteSettings: adminProcedure
    .input(SiteSettingsInputSchema)
    .mutation(async ({ ctx, input }) => {
      console.log("Admin: Updating site settings with input:", input);
      // Ensure fields that should be JSON are correctly structured if not null
      const dataToUpdate = {
        ...input,
        socialLinks: input.socialLinks === undefined ? undefined : (input.socialLinks ?? Prisma.JsonNull),
        shippingMethods: input.shippingMethods === undefined ? undefined : (input.shippingMethods ?? Prisma.JsonNull),
        taxRates: input.taxRates === undefined ? undefined : (input.taxRates ?? Prisma.JsonNull),
        storeAddress: input.storeAddress === undefined ? undefined : (input.storeAddress ?? Prisma.JsonNull),
      };
      
      return ctx.db.siteSettings.update({
        where: { id: "global_settings" },
        data: dataToUpdate,
      });
    }),
});