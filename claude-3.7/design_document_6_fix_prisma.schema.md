<think>
The user has provided a `package.json` and the output of `npm install` which failed during `prisma generate` due to validation errors in the `prisma/schema.prisma` file I previously generated.

The errors are:
1.  `Error parsing attribute "@default": The defined default value \`SINGLE\` is not a valid value of the enum specified for the field.`
    *   File: `prisma/schema.prisma`
    *   Line: 336
    *   Field: `type` in `QuizQuestion` model
    *   Current: `type QuizQuestionType @default(SINGLE)`
    *   Enum `QuizQuestionType`: `SINGLE_CHOICE_TEXT`, `MULTIPLE_CHOICE_TEXT`, `SINGLE_CHOICE_IMAGE`, `MULTIPLE_CHOICE_IMAGE`, `SCALE`, `TEXT_INPUT`
    *   **Issue:** `SINGLE` is not a value in `QuizQuestionType`. It should be one of the defined enum values, likely `SINGLE_CHOICE_TEXT`.

2.  `Error parsing attribute "@default": The defined default value \`ACTIVE\` is not a valid value of the enum specified for the field.`
    *   File: `prisma/schema.prisma`
    *   Line: 486
    *   Field: `status` in `UserReward` model
    *   Current: `status UserRewardStatus @default(ACTIVE)`
    *   Enum `UserRewardStatus`: `AVAILABLE`, `APPLIED`, `USED`, `EXPIRED`
    *   **Issue:** `ACTIVE` is not a value in `UserRewardStatus`. It should be `AVAILABLE`.

My task is to:
1.  Identify these errors in the `prisma/schema.prisma` I provided.
2.  Determine the correct default values based on the enum definitions.
3.  Generate an updated (replacement) version of `prisma/schema.prisma` with these fixes.
4.  Ensure no other parts of the schema are unintentionally changed. I'll do a mental diff with the version the user posted (which is the one I generated).
5.  Provide a summary and conclusion.

**Plan:**

1.  **Locate Error 1:** Line 336, `QuizQuestion` model, `type` field.
    *   Original: `type QuizQuestionType @default(SINGLE)`
    *   Enum `QuizQuestionType` has `SINGLE_CHOICE_TEXT`, `MULTIPLE_CHOICE_TEXT`, etc.
    *   **Fix:** Change `@default(SINGLE)` to `@default(SINGLE_CHOICE_TEXT)`. This seems like the most logical default for a generic quiz question type if a more specific default isn't obvious.

2.  **Locate Error 2:** Line 486, `UserReward` model, `status` field.
    *   Original: `status UserRewardStatus @default(ACTIVE)`
    *   Enum `UserRewardStatus` has `AVAILABLE`, `APPLIED`, `USED`, `EXPIRED`.
    *   **Fix:** Change `@default(ACTIVE)` to `@default(AVAILABLE)`. When a user redeems a reward, it becomes "available" for use.

3.  **Review `package.json`:** The `package.json` seems up-to-date with modern T3 stack dependencies (Next 15, React 19, Prisma 6, NextAuth 5 beta). The `previewFeatures = ["jsonProtocol"]` in Prisma generator options has a warning that it's deprecated and no longer needed as a preview feature. I should remove this.

4.  **Generate updated `prisma/schema.prisma`:** Incorporate these fixes and remove the deprecated preview feature.

5.  **Validation:** Mentally re-run `prisma generate` with the fixes to ensure it would pass.

Let's proceed with the fixes.
</think>

You've done an excellent job identifying the `prisma generate` errors! The `package.json` looks good with up-to-date dependencies for a modern T3 stack application. The Prisma validation errors are indeed due to incorrect default enum values.

Here's the step-by-step analysis and the corrected `prisma/schema.prisma` file:

**Identified Issues in `prisma/schema.prisma`:**

1.  **`QuizQuestion.type` default value:**
    *   **Error:** `@default(SINGLE)` is used, but `SINGLE` is not a defined member of the `QuizQuestionType` enum.
    *   **Correction:** The most logical default member from `enum QuizQuestionType { SINGLE_CHOICE_TEXT, MULTIPLE_CHOICE_TEXT, SINGLE_CHOICE_IMAGE, MULTIPLE_CHOICE_IMAGE, SCALE, TEXT_INPUT }` would be `SINGLE_CHOICE_TEXT`.

2.  **`UserReward.status` default value:**
    *   **Error:** `@default(ACTIVE)` is used, but `ACTIVE` is not a defined member of the `UserRewardStatus` enum.
    *   **Correction:** The most appropriate default from `enum UserRewardStatus { AVAILABLE, APPLIED, USED, EXPIRED }` when a reward is first redeemed by a user is `AVAILABLE`.

3.  **Prisma Generator `previewFeatures`:**
    *   The warning `Preview feature "jsonProtocol" is deprecated. The functionality can be used without specifying it as a preview feature.` indicates that `previewFeatures = ["jsonProtocol"]` should be removed from the `generator client` block. Prisma versions from 5.0.0 onwards include JSON protocol by default.

**Applying the Fixes:**

I will now provide the complete and updated `prisma/schema.prisma` file with these corrections. I have carefully reviewed the rest of the schema you provided (which was the one I generated) to ensure no other unintended changes are made.

---

**Updated `prisma/schema.prisma`**

```prisma
// prisma/schema.prisma

generator client {
  provider        = "prisma-client-js"
  // previewFeatures = ["jsonProtocol"] // Removed as it's deprecated and default in Prisma 5+
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Core Models
model User {
  id                String           @id @default(cuid())
  name              String?
  email             String?          @unique
  emailVerified     DateTime?
  image             String?
  password          String? // Hashed password
  roleDefinitionId  String?          // For advanced RBAC, FK to RoleDefinition
  role              Role             @default(CUSTOMER) // Simple role, can coexist or be replaced by RoleDefinition
  stripeCustomerId  String?          @unique // For Stripe subscriptions and customer management
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt

  definedRole       RoleDefinition?  @relation(fields: [roleDefinitionId], references: [id])
  accounts          Account[]
  sessions          Session[]
  orders            Order[]
  reviews           Review[]
  quizResponses     QuizResponse[]
  addresses         Address[]
  wishlist          WishlistItem[]
  cart              CartItem[]
  notifications     Notification[]
  subscriptions     ProductSubscription[]
  loyaltyPointLogs  LoyaltyPointLog[]
  userRewards       UserReward[]
  smartHomeConnections SmartHomePlatformConnection[]
  createdPurchaseOrders PurchaseOrder[] @relation("POCreatedBy")
  updatedPurchaseOrders PurchaseOrder[] @relation("POUpdatedBy")
  automationRules   AutomationRule[]
  scentSchedules    ScentSchedule[]

  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

// Product Catalog Models
model Product {
  id                String              @id @default(cuid())
  name              String
  slug              String              @unique
  description       String              @db.Text
  price             Decimal             @db.Decimal(10, 2)
  compareAtPrice    Decimal?            @db.Decimal(10, 2)
  costPrice         Decimal?            @db.Decimal(10, 2)
  sku               String?             @unique
  barcode           String?
  weight            Float?              // in grams
  dimensions        Json?               // {length, width, height} in cm
  inStock           Boolean             @default(true)
  lowStockThreshold Int?                @default(5)
  stockQuantity     Int                 @default(0) // Default to 0, manage through variants or direct updates
  featured          Boolean             @default(false)
  bestSeller        Boolean             @default(false)
  isNew             Boolean             @default(false)
  onSale            Boolean             @default(false)
  saleEndDate       DateTime?
  publishedAt       DateTime?
  metaTitle         String?
  metaDescription   String?
  modelUrl          String?             // For AR Visualization
  arPlacement       String?             // e.g., "floor", "table", "wall" for AR hints
  leadTime          Int?                // Days for inventory reordering
  safetyStock       Int?                // Minimum stock before reordering (for forecasting)
  turnoverRate      Float?              // For inventory analytics
  forecastedDemand  Int?                // For inventory analytics
  depletionDate     DateTime?           // For inventory analytics
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  images            ProductImage[]
  categories        Category[]          @relation("ProductToCategory")
  tags              Tag[]               @relation("ProductToTag")
  orderItems        OrderItem[]
  reviews           Review[]
  variants          ProductVariant[]
  relatedProducts   Product[]           @relation("RelatedProducts") // Explicit many-to-many
  recommendedWith   Product[]           @relation("RelatedProducts") // Explicit many-to-many ( Prisma needs explicit name for self-relations)
  cartItems         CartItem[]
  wishlistItems     WishlistItem[]
  collections       Collection[]        @relation("ProductToCollection")
  subscriptions     ProductSubscription[]
  purchaseOrderItems PurchaseOrderItem[]
  smartHomeDevices  SmartHomeDevice[]   @relation("CurrentScentInDevice") // If a product is a scent for a device
  loyaltyRewards    Reward[]            @relation("FreeProductReward") // If a product can be a free reward

  @@index([slug])
  @@index([featured])
  @@map("products")
}

model ProductImage {
  id          String    @id @default(cuid())
  productId   String
  url         String
  altText     String?
  width       Int?
  height      Int?
  position    Int       @default(0)

  product     Product   @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@map("product_images")
}

model ProductVariant {
  id            String    @id @default(cuid())
  productId     String
  name          String    // e.g., "10ml", "Lavender Scent"
  sku           String?   @unique
  price         Decimal?  @db.Decimal(10, 2) // Overrides product price if set
  stockQuantity Int       @default(0)
  options       Json      // Array of {name: string, value: string} pairs
  imageUrl      String?   // Variant-specific image
  isDefault     Boolean   @default(false)

  product       Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  cartItems     CartItem[]
  orderItems    OrderItem[] @relation("VariantOrderItems") // Explicit relation name
  
  @@map("product_variants")
}

model Category {
  id          String    @id @default(cuid())
  name        String    @unique
  slug        String    @unique
  description String?   @db.Text
  imageUrl    String?
  parentId    String?
  position    Int       @default(0)

  parent      Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete:SetNull)
  children    Category[] @relation("CategoryHierarchy")
  products    Product[]  @relation("ProductToCategory")

  @@index([slug])
  @@map("categories")
}

model Tag {
  id          String    @id @default(cuid())
  name        String    @unique
  slug        String    @unique

  products    Product[] @relation("ProductToTag")

  @@index([slug])
  @@map("tags")
}

model Collection {
  id          String    @id @default(cuid())
  name        String    @unique
  slug        String    @unique
  description String?   @db.Text
  imageUrl    String?
  active      Boolean   @default(true)
  featured    Boolean   @default(false)
  startDate   DateTime?
  endDate     DateTime?

  products    Product[] @relation("ProductToCollection")

  @@index([slug])
  @@map("collections")
}

// Order Management Models
model Order {
  id              String       @id @default(cuid())
  userId          String
  status          OrderStatus  @default(PENDING)
  subtotal        Decimal      @db.Decimal(10, 2)
  shippingCost    Decimal      @db.Decimal(10, 2) @default(0.00)
  tax             Decimal      @db.Decimal(10, 2) @default(0.00)
  discountAmount  Decimal      @db.Decimal(10, 2) @default(0.00)
  total           Decimal      @db.Decimal(10, 2)
  shippingAddress Json         // Store structured address
  billingAddress  Json?        // Store structured address
  paymentMethod   String?
  paymentIntentId String?      @unique
  currency        String       @default("USD")
  notes           String?      @db.Text // Customer notes for the order
  trackingNumber  String?
  shippingMethod  String?
  refundAmount    Decimal?     @db.Decimal(10, 2)
  cancelReason    String?
  orderNumber     String       @unique // User-friendly order ID, e.g., SCNT-XXXXXXX
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  user            User         @relation(fields: [userId], references: [id])
  orderItems      OrderItem[]
  history         OrderHistory[]
  loyaltyPointLog LoyaltyPointLog[] // Points earned/spent for this order
  userRewardsUsed UserReward[]    // Rewards used in this order

  @@index([orderNumber])
  @@map("orders")
}

model OrderItem {
  id            String   @id @default(cuid())
  orderId       String
  productId     String
  variantId     String?
  name          String   // Product name at time of purchase
  sku           String?  // SKU at time of purchase
  price         Decimal  @db.Decimal(10, 2) // Price per unit at purchase
  quantity      Int
  subtotal      Decimal  @db.Decimal(10, 2) // price * quantity for this item
  imageUrl      String?
  productData   Json     // Snapshot of product/variant details at purchase time

  order         Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product       Product  @relation(fields: [productId], references: [id], onDelete:Restrict) // Prevent product deletion if in orders
  variant       ProductVariant? @relation("VariantOrderItems", fields: [variantId], references: [id], onDelete:Restrict)

  @@map("order_items")
}

model OrderHistory {
  id        String      @id @default(cuid())
  orderId   String
  status    OrderStatus
  comment   String?     @db.Text
  createdAt DateTime    @default(now())
  createdBy String?     // User ID or "SYSTEM" if automated

  order     Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@map("order_history")
}

// Customer Interaction Models
model Address {
  id           String    @id @default(cuid())
  userId       String
  addressLine1 String
  addressLine2 String?
  city         String
  state        String    // Or Province
  postalCode   String
  country      String    // ISO 2-letter code recommended
  phoneNumber  String?
  isDefaultShipping Boolean @default(false)
  isDefaultBilling  Boolean @default(false)
  addressType  AddressType // SHIPPING, BILLING

  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("addresses")
}

model Review {
  id                 String   @id @default(cuid())
  userId             String
  productId          String
  orderItemId        String?  @unique // To link review to a specific purchase (for "verified purchase")
  rating             Int      @db.SmallInt // 1-5
  title              String?
  comment            String?  @db.Text
  status             ReviewStatus @default(PENDING)
  helpfulCount       Int      @default(0)
  notHelpfulCount    Int      @default(0)
  isVerifiedPurchase Boolean  @default(false)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  user               User     @relation(fields: [userId], references: [id])
  product            Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  // orderItem       OrderItem? @relation(fields: [orderItemId], references: [id]) // If linking to OrderItem

  @@map("reviews")
}

model QuizQuestion {
  id           String         @id @default(cuid())
  question     String
  description  String?        @db.Text
  options      Json           // Array of options: {id: string, label: string, value: string, imageUrl?: string, description?: string, tags?: string[]}
  order        Int            // For sequencing the questions
  type         QuizQuestionType @default(SINGLE_CHOICE_TEXT) // CORRECTED DEFAULT
  imageUrl     String?
  tooltipText  String?

  responses    QuizResponse[] @relation("QuizResponseToQuestion")

  @@map("quiz_questions")
}

model QuizResponse {
  id         String   @id @default(cuid())
  userId     String?  // Nullable for anonymous users
  questionId String
  answer     Json     // Selected option ID(s), store as array of strings: `["option_id_1", "option_id_2"]`
  sessionId  String?  // For anonymous users to group responses
  createdAt  DateTime @default(now())

  user       User?        @relation(fields: [userId], references: [id], onDelete: SetNull)
  question   QuizQuestion @relation("QuizResponseToQuestion", fields: [questionId], references: [id], onDelete:Cascade)

  @@map("quiz_responses")
}

model NewsletterSubscriber {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  active    Boolean  @default(true)
  source    String?  // e.g., "footer_form", "quiz_signup", "checkout_opt_in"
  interests String[] // Array of topic interests (e.g., product category slugs)
  createdAt DateTime @default(now())
  
  @@map("newsletter_subscribers")
}

model CartItem {
  id          String    @id @default(cuid())
  userId      String?   // Nullable for guest carts
  sessionId   String?   // For guest carts, links to client-side session/cookie
  productId   String
  variantId   String?
  quantity    Int
  addedAt     DateTime  @default(now())

  user        User?     @relation(fields: [userId], references: [id], onDelete: Cascade)
  product     Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  variant     ProductVariant? @relation(fields: [variantId], references: [id], onDelete: SetNull)

  @@unique([sessionId, productId, variantId], name: "guestCartUniqueItem")
  @@unique([userId, productId, variantId], name: "userCartUniqueItem")
  @@map("cart_items")
}

model WishlistItem {
  id          String    @id @default(cuid())
  userId      String
  productId   String
  variantId   String?   // Optional: if user wishes for a specific variant
  addedAt     DateTime  @default(now())

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  product     Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  // variant  ProductVariant? @relation(fields: [variantId], references: [id])

  @@unique([userId, productId, variantId])
  @@map("wishlist_items")
}

// Subscription & Loyalty Models
model ProductSubscription {
  id                String    @id @default(cuid())
  userId            String
  productId         String
  variantId         String?   // If subscription is for a specific variant
  frequency         SubscriptionFrequency
  status            SubscriptionStatus @default(ACTIVE) // ACTIVE, PAUSED, CANCELLED
  nextBillingDate   DateTime? // Renamed from nextDelivery for clarity of billing cycle
  nextShipDate      DateTime? // Actual next ship date
  lastBilledDate    DateTime?
  lastShippedDate   DateTime?
  stripeSubscriptionId String? @unique // Stripe Subscription ID
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  cancelledAt       DateTime?

  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  product           Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  // variant        ProductVariant? @relation(fields: [variantId], references: [id])

  @@map("product_subscriptions")
}

model LoyaltyTier {
  id         String    @id @default(cuid())
  name       String    @unique // e.g., BRONZE, SILVER, GOLD, PLATINUM
  minPoints  Int       @unique // Points required to enter this tier
  benefits   Json      // e.g., { discountPercent: 5, freeShipping: true, exclusiveAccess: ["events"] }
  color      String?   // Hex color for UI e.g. #CD7F32 for Bronze
  icon       String?   // Icon name or URL

  rewards    Reward[]  // Rewards that might be tier-specific
  @@map("loyalty_tiers")
}

model LoyaltyPointLog {
  id          String    @id @default(cuid())
  userId      String
  points      Int       // Can be positive (earned) or negative (spent/expired)
  type        LoyaltyPointLogType // EARN_PURCHASE, REDEEM_REWARD, etc.
  description String    // e.g., "Points for order #SCNT-123", "Redeemed 10% Off Coupon"
  orderId     String?   // If points earned/related to an order
  userRewardId String?  // If points were spent on a reward
  expiresAt   DateTime? // If points have an expiry
  createdAt   DateTime  @default(now())

  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  order       Order?     @relation(fields: [orderId], references: [id], onDelete:SetNull)
  userReward  UserReward? @relation(fields: [userRewardId], references: [id], onDelete:SetNull)
  
  @@map("loyalty_point_logs")
}

model Reward {
  id                     String    @id @default(cuid())
  name                   String
  description            String?
  pointsCost             Int
  type                   RewardType // DISCOUNT_PERCENT, DISCOUNT_FIXED, FREE_PRODUCT, etc.
  value                  Json      // Specifics of the reward, e.g., { "percentage": 10 }, { "amount": 5.00 }, { "productId": "prod_xyz" }
  requiredTierId         String?   // Minimum loyalty tier to redeem this reward
  imageUrl               String?
  isActive               Boolean   @default(true)
  validFrom              DateTime?
  validUntil             DateTime? // Expiry date of the reward offering itself
  maxRedemptions         Int?      // Overall limit for this reward type
  maxRedemptionsPerUser  Int?      @default(1) // How many times one user can redeem this specific reward

  tier                   LoyaltyTier? @relation(fields: [requiredTierId], references: [id])
  userRewards            UserReward[]
  freeProduct            Product?     @relation("FreeProductReward", fields: [freeProductId], references: [id])
  freeProductId          String?

  @@map("rewards")
}

model UserReward {
  id          String    @id @default(cuid())
  userId      String
  rewardId    String
  redeemedAt  DateTime  @default(now())
  status      UserRewardStatus @default(AVAILABLE) // CORRECTED DEFAULT
  couponCode  String?   @unique // If the reward generates a unique coupon code
  expiresAt   DateTime? // Expiry date of this specific user's redeemed reward
  orderId     String?   // Order in which this reward was used

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  reward      Reward    @relation(fields: [rewardId], references: [id])
  order       Order?    @relation(fields: [orderId], references: [id], onDelete:SetNull)
  loyaltyPointLogs LoyaltyPointLog[]

  @@map("user_rewards")
}

// RBAC Models
model RoleDefinition {
  id            String    @id @default(cuid())
  name          String    @unique // e.g., "Administrator", "Content Manager", "Support Agent"
  description   String?
  isSystemRole  Boolean   @default(false) // True for core roles that shouldn't be deleted
  permissions   PermissionAssignment[]
  users         User[]

  @@map("role_definitions")
}

model Permission {
  id          String    @id @default(cuid())
  action      String    // e.g., "create", "read", "update", "delete", "manage"
  subject     String    // e.g., "Product", "OrderAll", "OrderOwn", "UserRole"
  category    String    // For grouping in UI: "Products", "Orders", "Users", "Settings"
  description String?
  assignments PermissionAssignment[]

  @@unique([action, subject]) // A permission is unique by its action and subject
  @@map("permissions")
}

model PermissionAssignment {
  roleId        String
  permissionId  String
  
  role          RoleDefinition @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission    Permission     @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@id([roleId, permissionId])
  @@map("permission_assignments")
}

// Inventory Forecasting Models
model Supplier {
  id            String    @id @default(cuid())
  name          String    @unique
  contactName   String?
  contactEmail  String?   @unique
  contactPhone  String?
  address       Json?     // { line1, city, state, postalCode, country }
  notes         String?   @db.Text
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  purchaseOrders PurchaseOrder[]

  @@map("suppliers")
}

model PurchaseOrder {
  id                  String    @id @default(cuid())
  orderNumber         String    @unique // e.g., PO-2024-0001
  supplierId          String
  status              PurchaseOrderStatus @default(DRAFT) // Changed default to DRAFT
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  expectedDeliveryDate DateTime?
  actualDeliveryDate  DateTime?
  shippingCost        Decimal?  @db.Decimal(10, 2)
  subtotal            Decimal   @db.Decimal(12, 2) @default(0.00)
  totalCost           Decimal   @db.Decimal(12, 2) @default(0.00) // subtotal + shipping + tax (if any)
  notes               String?   @db.Text
  createdById         String?   // Admin user who created it
  updatedById         String?   // Admin user who last updated it

  supplier            Supplier  @relation(fields: [supplierId], references: [id])
  items               PurchaseOrderItem[]
  createdBy           User?     @relation("POCreatedBy", fields: [createdById], references: [id], onDelete:SetNull)
  updatedBy           User?     @relation("POUpdatedBy", fields: [updatedById], references: [id], onDelete:SetNull)

  @@map("purchase_orders")
}

model PurchaseOrderItem {
  id                String    @id @default(cuid())
  purchaseOrderId   String
  productId         String
  quantityOrdered   Int
  quantityReceived  Int       @default(0)
  unitCost          Decimal   @db.Decimal(10, 2) // Cost per unit from supplier

  purchaseOrder     PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)
  product           Product       @relation(fields: [productId], references: [id])

  @@map("purchase_order_items")
}

// Smart Home Models
model SmartHomePlatformConnection {
  id            String    @id @default(cuid())
  userId        String
  platformKey   String    // e.g., "philips_hue", "google_home", "homekit" (unique key for the platform)
  platformName  String    // User-friendly name
  accessToken   String    @db.Text // Encrypted
  refreshToken  String?   @db.Text // Encrypted
  tokenExpiresAt DateTime?
  scopesGranted String[]
  externalUserId String?  // User ID on the external platform, if available
  lastSyncedAt  DateTime?
  syncStatus    String?   // e.g., "SUCCESS", "ERROR", "PENDING"
  syncMessage   String?   @db.Text
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  user          User      @relation(fields: [userId], references: [id], onDelete:Cascade)
  devices       SmartHomeDevice[]

  @@unique([userId, platformKey])
  @@map("smart_home_platform_connections")
}

model SmartHomeDevice {
  id             String    @id @default(cuid())
  connectionId   String
  externalDeviceId String  // ID from the smart home platform
  name           String    // User-given name or name from platform
  type           SmartHomeDeviceType // e.g., DIFFUSER, SMART_PLUG_CONTROLLING_DIFFUSER
  roomName       String?
  isOnline       Boolean   @default(false)
  isActive       Boolean   @default(false) // e.g., diffuser is currently running
  capabilities   Json?     // e.g., { "supportsIntensity": true, "supportsScentSelection": true, "intensityLevels": [1,2,3] }
  currentState   Json?     // e.g., { "intensity": 2, "currentScentProductId": "prod_xyz" }
  currentScentProductId String?
  lastActivityAt DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  connection     SmartHomePlatformConnection @relation(fields: [connectionId], references: [id], onDelete:Cascade)
  currentScent   Product?  @relation("CurrentScentInDevice", fields: [currentScentProductId], references: [id], onDelete:SetNull)
  schedules      ScentSchedule[]
  automationActions AutomationAction[]

  @@unique([connectionId, externalDeviceId])
  @@map("smart_home_devices")
}

model AutomationRule {
  id            String    @id @default(cuid())
  userId        String
  name          String
  description   String?
  enabled       Boolean   @default(true)
  triggerType   AutomationTriggerType
  triggerConfig Json      // Specifics for the trigger, e.g., { "time": "19:00", "daysOfWeek": [1,2,3,4,5] } or { "eventSourceDeviceId": "dev_abc", "eventProperty": "motion", "eventValue": "detected" }
  lastTriggered DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  user          User      @relation(fields: [userId], references: [id], onDelete:Cascade)
  actions       AutomationAction[]

  @@map("automation_rules")
}

model AutomationAction {
  id            String    @id @default(cuid())
  ruleId        String
  deviceId      String    // SmartHomeDevice ID
  actionType    String    // e.g., "TURN_ON", "TURN_OFF", "SET_SCENT", "SET_INTENSITY", "RUN_FOR_DURATION"
  parameters    Json?     // e.g., { "scentProductId": "prod_xyz", "intensity": 3, "durationMinutes": 60 }
  executionOrder Int      @default(0) // For sequencing actions within a rule

  rule          AutomationRule    @relation(fields: [ruleId], references: [id], onDelete:Cascade)
  device        SmartHomeDevice   @relation(fields: [deviceId], references: [id], onDelete:Cascade)

  @@map("automation_actions")
}

model ScentSchedule {
  id            String    @id @default(cuid())
  userId        String
  deviceId      String    // SmartHomeDevice ID (must be a diffuser type)
  name          String
  description   String?
  enabled       Boolean   @default(true)
  entries       Json      // Array of: { id: string, scentProductId: string, startTime: "HH:mm", endTime: "HH:mm", daysOfWeek: number[] /*0=Sun, 6=Sat*/, intensity?: number }
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  user          User            @relation(fields: [userId], references: [id], onDelete:Cascade)
  device        SmartHomeDevice @relation(fields: [deviceId], references: [id], onDelete:Cascade)

  @@map("scent_schedules")
}

// Operational Models
model Notification {
  id          String    @id @default(cuid())
  userId      String
  type        NotificationType
  title       String
  message     String    @db.Text
  isRead      Boolean   @default(false)
  readAt      DateTime?
  link        String?   // URL for action when notification is clicked
  data        Json?     // e.g., { "orderId": "...", "productId": "..." }
  createdAt   DateTime  @default(now())

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("notifications")
}

model SiteSettings {
  id                String  @id @default("global_settings") // Use a fixed ID for singleton
  siteName          String  @default("The Scent")
  logoUrl           String?
  faviconUrl        String?
  primaryColor      String  @default("#2a7c8a")
  secondaryColor    String  @default("#e0a86f")
  accentColor       String  @default("#ff7b4f")
  defaultCurrency   String  @default("USD") // ISO 4217 currency code
  defaultLanguage   String  @default("en")  // ISO 639-1 language code
  contactEmail      String?
  contactPhone      String?
  socialLinks       Json?   // e.g., { "twitter": "url", "facebook": "url", "instagram": "url" }
  shippingMethods   Json?   // Array of objects: { id: string, name: string, cost: number, estimatedDelivery: string, regions: string[] }
  taxRates          Json?   // Array of objects: { region: string (e.g., "CA", "NY"), rate: number (e.g., 0.08 for 8%) }
  defaultMetaTitle  String?
  defaultMetaDescription String?
  maintenanceMode   Boolean @default(false)
  storeAddress      Json?   // { line1, city, state, postalCode, country }
  updatedAt         DateTime @updatedAt
  
  @@map("site_settings")
}


// Enums
enum Role {
  ADMIN     // Super admin, full access
  MANAGER   // Manages store operations based on RoleDefinition
  CUSTOMER  // Regular user
}

enum OrderStatus {
  PENDING     // Order placed, awaiting payment confirmation or initial processing.
  AWAITING_PAYMENT // If payment is not immediate.
  PROCESSING  // Payment received/verified, order is being prepared for shipment.
  PAID        // Payment confirmed. (Can be a distinct step or merged with PROCESSING)
  ON_HOLD     // Order temporarily paused (e.g., stock issue, fraud check, customer request).
  SHIPPED     // Order has been dispatched to the carrier.
  IN_TRANSIT  // Order is with the carrier, on its way.
  OUT_FOR_DELIVERY // Order is with the local delivery agent.
  DELIVERED   // Order has been successfully delivered to the customer.
  COMPLETED   // All post-delivery actions are finished (e.g., return window closed). Often synonymous with DELIVERED.
  CANCELLED   // Order cancelled by customer or admin before shipment.
  REFUND_PENDING // Refund initiated, awaiting processing.
  REFUNDED    // Order has been partially or fully refunded.
  FAILED      // Order failed (e.g., payment failure, critical processing error).
}

enum AddressType {
  SHIPPING
  BILLING
}

enum ReviewStatus {
  PENDING   // Awaiting moderation
  APPROVED
  REJECTED
}

enum NotificationType {
  // Order Related
  ORDER_CONFIRMATION
  ORDER_PAYMENT_SUCCESS
  ORDER_PAYMENT_FAILED
  ORDER_STATUS_UPDATE // Generic status update
  ORDER_SHIPPED
  ORDER_OUT_FOR_DELIVERY
  ORDER_DELIVERED
  ORDER_CANCELLED
  ORDER_REFUNDED
  // Account Related
  WELCOME_EMAIL
  PASSWORD_RESET
  EMAIL_VERIFICATION
  PROFILE_UPDATE
  // Product Related
  LOW_STOCK_ALERT     // For admin
  BACK_IN_STOCK       // For users subscribed to alerts
  NEW_PRODUCT_LAUNCHED
  PRICE_DROP_ALERT    // For wishlisted/viewed items
  // Subscription Related
  SUBSCRIPTION_CREATED
  SUBSCRIPTION_REMINDER // Upcoming billing/shipment
  SUBSCRIPTION_PAYMENT_SUCCESS
  SUBSCRIPTION_PAYMENT_FAILED
  SUBSCRIPTION_CANCELLED
  SUBSCRIPTION_UPDATED
  // Loyalty Related
  LOYALTY_POINTS_EARNED
  LOYALTY_TIER_UPGRADE
  LOYALTY_REWARD_REDEEMED
  LOYALTY_POINTS_EXPIRING_SOON
  // Smart Home Related
  SMART_HOME_DEVICE_CONNECTED
  SMART_HOME_DEVICE_OFFLINE
  SMART_HOME_AUTOMATION_TRIGGERED
  SMART_HOME_SCENT_LOW // If diffuser reports low scent
  // Marketing & General
  PROMOTIONAL_OFFER
  NEWSLETTER_UPDATE
  SURVEY_INVITATION
  SYSTEM_ANNOUNCEMENT // e.g., maintenance
  ADMIN_ALERT         // For critical system issues for admins
}

enum SubscriptionFrequency {
  WEEKLY
  BIWEEKLY  // Every 2 weeks
  MONTHLY
  EVERY_TWO_MONTHS
  QUARTERLY // Every 3 months
  EVERY_SIX_MONTHS
  ANNUALLY
}

enum SubscriptionStatus {
  ACTIVE
  PAUSED
  CANCELLED         // User initiated cancellation
  EXPIRED           // If subscriptions have a fixed term and it ended
  PENDING_PAYMENT   // Payment failed, subscription on hold
  ADMIN_SUSPENDED   // Suspended by admin
}

enum LoyaltyPointLogType {
  EARN_PURCHASE
  EARN_REVIEW_PRODUCT
  EARN_SIGNUP_BONUS
  EARN_REFERRAL_BONUS
  EARN_COMPLETE_QUIZ
  EARN_BIRTHDAY_BONUS
  EARN_SOCIAL_SHARE
  REDEEM_REWARD
  ADJUST_ADMIN_CREDIT // Admin manually adds points
  ADJUST_ADMIN_DEBIT  // Admin manually removes points
  EXPIRE_POINTS       // Points expired due to inactivity
  REFUND_POINTS       // Points returned due to order refund/cancellation
}

enum RewardType {
  DISCOUNT_PERCENTAGE // e.g., 10% off next order
  DISCOUNT_FIXED_AMOUNT // e.g., $5 off
  FREE_SHIPPING
  FREE_PRODUCT        // A specific product for free
  VOUCHER_CODE        // Generic voucher code for store credit
  EXCLUSIVE_ACCESS    // e.g., early access to sales/products
  GIFT_CARD
}

enum UserRewardStatus {
  AVAILABLE // Redeemed from points, ready to be applied/used
  APPLIED   // e.g., discount applied to a cart, awaiting checkout
  USED      // Successfully used (e.g., in a completed order)
  EXPIRED   // This specific redeemed reward instance has expired
}

enum PurchaseOrderStatus {
  DRAFT     // PO created but not yet finalized/sent
  PENDING   // PO sent to supplier, awaiting confirmation
  CONFIRMED // Supplier confirmed the order
  SHIPPED   // Supplier has shipped the items
  PARTIALLY_RECEIVED // Some items received
  RECEIVED  // All items received and verified
  CANCELLED // PO cancelled
  CLOSED    // PO completed and closed (e.g., after payment to supplier)
}

enum SmartHomeDeviceType {
  AROMA_DIFFUSER
  SMART_PLUG_DIFFUSER // A smart plug controlling a traditional diffuser
  AIR_PURIFIER_WITH_SCENT
  SMART_LIGHT_SCENT_SYNC // Lights that sync with scent experiences
  OTHER_WELLNESS_DEVICE
}

enum AutomationTriggerType {
  TIME_OF_DAY
  SUNRISE
  SUNSET
  USER_ENTERS_LOCATION // Geofencing
  USER_LEAVES_LOCATION
  DEVICE_STATE_CHANGE  // e.g., another device turns on/off
  SENSOR_READING       // e.g., temperature > X, humidity < Y
  VOICE_COMMAND        // via integrated voice assistant
  APP_EVENT            // e.g., quiz completed, meditation session started
}

enum QuizQuestionType {
  SINGLE_CHOICE_TEXT
  MULTIPLE_CHOICE_TEXT
  SINGLE_CHOICE_IMAGE
  MULTIPLE_CHOICE_IMAGE
  SCALE // e.g., rate from 1-5
  TEXT_INPUT // For open-ended questions, if any
}
```

---

**Summary and Conclusion:**

The `prisma generate` command failed due to two specific issues in the `prisma/schema.prisma` file:
1.  The default value for `QuizQuestion.type` was `SINGLE`, which is not a valid member of the `QuizQuestionType` enum. This has been corrected to `SINGLE_CHOICE_TEXT`.
2.  The default value for `UserReward.status` was `ACTIVE`, which is not a valid member of the `UserRewardStatus` enum. This has been corrected to `AVAILABLE`.
3.  Additionally, the `previewFeatures = ["jsonProtocol"]` line in the `generator client` block was removed as it's deprecated and no longer necessary for Prisma versions 5.0.0 and above (the `package.json` indicates Prisma 6.x).

I have provided the complete, corrected `prisma/schema.prisma` file above. With these changes, `prisma generate` should now run successfully. The `package.json` file itself did not require changes based on these errors.

This meticulous review and targeted fixing ensure that the database schema aligns with Prisma's validation rules and best practices, allowing the project to proceed with a correct foundation.
