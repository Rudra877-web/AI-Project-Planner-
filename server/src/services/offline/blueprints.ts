import type { HttpMethod } from '../../types/domain';
import type { DomainKey } from './domainDetect';

/**
 * Per-domain blueprint: the domain vocabulary that makes a generated plan
 * specific to the idea rather than generic CRUD.
 *
 * `synthesize.ts` combines a blueprint with the chosen stack and experience
 * level. Entities are the source of truth — pages reference entities, API
 * groups reference entities, and tasks/tests are derived from the endpoints —
 * which is how §27's "everything connected" becomes structural rather than
 * aspirational: change a table and the plan tells you which endpoints and
 * pages it feeds.
 */

export interface BlueprintField {
  name: string;
  dataType: string;
  isPrimary?: boolean;
  isForeign?: boolean;
  isNullable?: boolean;
  isUnique?: boolean;
  defaultValue?: string | null;
  description?: string;
  referencesTable?: string;
  referencesField?: string;
}

export interface BlueprintTable {
  name: string;
  description: string;
  fields: BlueprintField[];
}

export interface BlueprintPage {
  name: string;
  route: string;
  purpose: string;
  components: string[];
  userActions: string[];
  /** Endpoint signatures this page calls, e.g. "GET /api/orders". */
  apis: string[];
  entities: string[];
  isProtected?: boolean;
  isAdmin?: boolean;
}

export interface BlueprintEndpoint {
  method: HttpMethod;
  path: string;
  description: string;
  requiresAuth: boolean;
  relatedTables: string[];
  requestBody?: Record<string, unknown> | null;
  responseExample?: Record<string, unknown> | null;
}

export interface BlueprintApiGroup {
  name: string;
  description: string;
  endpoints: BlueprintEndpoint[];
}

export interface BlueprintFeature {
  title: string;
  description: string;
}

export interface Blueprint {
  domain: DomainKey;
  label: string;
  problemStatement: string;
  targetUsers: string[];
  goals: string[];
  tables: BlueprintTable[];
  pages: BlueprintPage[];
  coreFeatures: BlueprintFeature[];
  futureFeatures: BlueprintFeature[];
  apiGroups: BlueprintApiGroup[];
}

/** The universal primary-key column every table gets. */
const PK = {
  name: 'id',
  dataType: 'uuid',
  isPrimary: true,
  description: 'Primary key (UUID)',
};

/**
 * Foreign-key shorthand. `table` is the target table name; the sentinel
 * `__users__` means "the platform's users table", which the generated plan
 * always has because auth is part of every app. Any other table name must
 * exist in the same blueprint.
 */
function fk(name: string, table: string, description?: string): BlueprintField {
  return {
    name,
    dataType: 'uuid',
    isForeign: true,
    description: description ?? `References ${table}.id`,
    referencesTable: table,
    referencesField: 'id',
  };
}

const CREATED_AT = {
  name: 'createdAt',
  dataType: 'timestamp',
  description: 'Row creation time',
};

function col(name: string, dataType: string, description?: string, extra: Partial<BlueprintField> = {}): BlueprintField {
  return { name, dataType, description, ...extra };
}

export const BLUEPRINTS: Record<Exclude<DomainKey, 'generic'>, Blueprint> = {
  // ── Food delivery ─────────────────────────────────────────────────────────
  'food-delivery': {
    domain: 'food-delivery',
    label: 'Food delivery',
    problemStatement:
      'People want restaurant-quality food without leaving home, but discovering nearby restaurants, ordering reliably and knowing when the food arrives is fragmented across phone calls and third-party apps.',
    targetUsers: ['Hungry customers who want to order in', 'Restaurant owners looking for reach', 'Couriers who want flexible work'],
    goals: [
      'Let customers browse nearby restaurants and order in under a minute',
      'Give restaurants an easy menu and order dashboard',
      'Give customers live order and delivery tracking',
    ],
    tables: [
      {
        name: 'restaurants',
        description: 'Partner restaurants that list menus and receive orders.',
        fields: [
          PK,
          col('name', 'varchar', 'Display name', { isUnique: true }),
          col('slug', 'varchar', 'URL-friendly identifier', { isUnique: true }),
          col('description', 'text', 'Short blurb shown in listings'),
          col('cuisine', 'varchar', 'Cuisine category'),
          col('address', 'text', 'Street address'),
          col('latitude', 'decimal', 'Map pin latitude'),
          col('longitude', 'decimal', 'Map pin longitude'),
          col('phone', 'varchar', 'Contact phone (nullable)'),
          col('openingHours', 'text', 'Human-readable opening hours'),
          col('deliveryRadiusKm', 'decimal', 'Maximum delivery distance'),
          col('deliveryFee', 'decimal', 'Flat delivery fee'),
          col('ratingAvg', 'decimal', 'Average rating'),
          col('ratingCount', 'integer', 'Number of ratings'),
          col('isOpen', 'boolean', 'Whether the restaurant currently accepts orders'),
          col('status', 'varchar', 'pending | approved | suspended', { defaultValue: "'pending'" }),
          CREATED_AT,
        ],
      },
      {
        name: 'menus',
        description: 'A restaurant menu, organised into sections.',
        fields: [
          PK,
          fk('restaurantId', 'restaurants'),
          col('name', 'varchar', 'Menu name (e.g. Lunch menu)'),
          col('isActive', 'boolean', 'Whether the menu is currently orderable'),
          CREATED_AT,
        ],
      },
      {
        name: 'menu_items',
        description: 'Individual dishes belonging to a menu section.',
        fields: [
          PK,
          fk('menuId', 'menus'),
          col('name', 'varchar', 'Dish name'),
          col('description', 'text', 'Ingredients and notes'),
          col('price', 'decimal', 'Price in minor currency units'),
          col('category', 'varchar', 'Section within the menu (starters, mains)'),
          col('imageUrl', 'text', 'Dish photo'),
          col('isAvailable', 'boolean', 'Whether the dish can be ordered'),
          col('prepMinutes', 'integer', 'Typical preparation time'),
          col('popularity', 'integer', 'Order count used for sorting'),
        ],
      },
      {
        name: 'orders',
        description: 'Customer orders; price is snapshotted at order time.',
        fields: [
          PK,
          fk('userId', '__users__', 'Who placed the order'),
          fk('restaurantId', 'restaurants', 'Which restaurant fulfils the order'),
          col('status', 'varchar', 'pending | confirmed | preparing | out_for_delivery | delivered | cancelled'),
          col('subtotal', 'decimal', 'Total item price'),
          col('deliveryFee', 'decimal', 'Charged delivery fee'),
          col('total', 'decimal', 'Subtotal + fee'),
          col('deliveryAddress', 'text', 'Snapshot of the destination address'),
          col('latitude', 'decimal', 'Destination latitude'),
          col('longitude', 'decimal', 'Destination longitude'),
          col('notes', 'text', 'Customer instructions (nullable)'),
          col('paymentStatus', 'varchar', 'unpaid | paid | refunded'),
          col('estimatedReadyAt', 'timestamp', 'Restaurant ETA (nullable)'),
          col('estimatedDeliveryAt', 'timestamp', 'Courier ETA (nullable)'),
          col('placedAt', 'timestamp', 'When the order was placed'),
          col('deliveredAt', 'timestamp', 'When the order completed (nullable)'),
          CREATED_AT,
        ],
      },
      {
        name: 'order_items',
        description: 'Line items on an order, with price snapshots.',
        fields: [
          PK,
          fk('orderId', 'orders'),
          fk('menuItemId', 'menu_items'),
          col('name', 'varchar', 'Dish name at time of order'),
          col('quantity', 'integer', 'Units ordered'),
          col('unitPrice', 'decimal', 'Price per unit at time of order'),
          col('notes', 'text', 'Per-item instruction (nullable)'),
        ],
      },
      {
        name: 'deliveries',
        description: 'Delivery leg of an order, assigned to a courier.',
        fields: [
          PK,
          fk('orderId', 'orders'),
          fk('courierId', '__users__', 'Assigned courier'),
          col('status', 'varchar', 'assigned | picked_up | en_route | delivered | failed'),
          col('pickupLat', 'decimal', 'Restaurant pickup position (nullable)'),
          col('pickupLng', 'decimal', 'Restaurant pickup position (nullable)'),
          col('dropoffLat', 'decimal', 'Destination position (nullable)'),
          col('dropoffLng', 'decimal', 'Destination position (nullable)'),
          col('startedAt', 'timestamp', 'When the courier accepted (nullable)'),
          col('completedAt', 'timestamp', 'When delivery finished (nullable)'),
          col('payAmount', 'decimal', 'Courier payout for this delivery'),
        ],
      },
      {
        name: 'payments',
        description: 'Payment attempts for orders, through the payments provider.',
        fields: [
          PK,
          fk('orderId', 'orders'),
          col('provider', 'varchar', 'Payment provider token, e.g. stripe'),
          col('providerRef', 'varchar', 'Provider charge/session id (nullable)'),
          col('amount', 'decimal', 'Amount charged'),
          col('status', 'varchar', 'requires_action | succeeded | failed | refunded'),
          col('method', 'varchar', 'card | wallet | cash (nullable)'),
          col('paidAt', 'timestamp', 'When the charge succeeded (nullable)'),
          CREATED_AT,
        ],
      },
      {
        name: 'reviews',
        description: 'Customer ratings of orders and restaurants.',
        fields: [
          PK,
          fk('orderId', 'orders'),
          fk('restaurantId', 'restaurants'),
          fk('userId', '__users__', 'Author'),
          col('rating', 'integer', '1–5 stars'),
          col('comment', 'text', 'Written review (nullable)'),
          col('createdAt', 'timestamp', 'When the review was written'),
        ],
      },
    ],
    pages: [
      {
        name: 'Home',
        route: '/',
        purpose: 'Browse restaurants near the user, search by cuisine or name.',
        components: ['SearchBar', 'RestaurantCard', 'CuisineFilter', 'MapPreview'],
        userActions: ['Search', 'Filter by cuisine', 'Click a restaurant'],
        apis: ['GET /api/restaurants'],
        entities: ['restaurants'],
      },
      {
        name: 'Restaurant Detail',
        route: '/restaurants/:id',
        purpose: 'Show the menu, ratings and delivery info for one restaurant.',
        components: ['RestaurantHeader', 'MenuSection', 'MenuItemCard', 'RatingList', 'AddToCartButton'],
        userActions: ['Add items to cart', 'View ratings', 'Check delivery time'],
        apis: ['GET /api/restaurants/:id', 'GET /api/restaurants/:id/menu', 'GET /api/restaurants/:id/reviews'],
        entities: ['restaurants', 'menus', 'menu_items', 'reviews'],
      },
      {
        name: 'Cart & Checkout',
        route: '/checkout',
        purpose: 'Review the cart, enter delivery details and pay.',
        components: ['CartList', 'AddressForm', 'PaymentForm', 'OrderSummary'],
        userActions: ['Adjust quantities', 'Enter address', 'Pay', 'Add note'],
        apis: ['POST /api/orders', 'POST /api/payments'],
        entities: ['orders', 'order_items', 'payments'],
        isProtected: true,
      },
      {
        name: 'My Orders',
        route: '/orders',
        purpose: 'List past and current orders with live status.',
        components: ['OrderCard', 'StatusTimeline', 'ReorderButton', 'ReviewDialog'],
        userActions: ['Track order', 'Reorder', 'Leave a review'],
        apis: ['GET /api/orders', 'GET /api/orders/:id'],
        entities: ['orders', 'deliveries'],
        isProtected: true,
      },
      {
        name: 'Track Order',
        route: '/orders/:id/track',
        purpose: 'Live map view of the courier and order status.',
        components: ['OrderTracker', 'MapView', 'CourierCard', 'ETATicker'],
        userActions: ['Watch live position', 'Contact courier'],
        apis: ['GET /api/orders/:id', 'GET /api/orders/:id/tracking'],
        entities: ['orders', 'deliveries'],
        isProtected: true,
      },
      {
        name: 'Courier Portal',
        route: '/courier',
        purpose: 'Courier inbox of available and assigned deliveries.',
        components: ['DeliveryQueue', 'DeliveryCard', 'NavigationButton', 'EarningsSummary'],
        userActions: ['Accept delivery', 'Mark picked up', 'Mark delivered'],
        apis: ['GET /api/deliveries', 'POST /api/deliveries/:id/accept', 'PATCH /api/deliveries/:id/status'],
        entities: ['deliveries', 'orders'],
        isProtected: true,
      },
      {
        name: 'Restaurant Dashboard',
        route: '/restaurant',
        purpose: 'Restaurant staff manage menu and incoming orders.',
        components: ['LiveOrderList', 'OrderDetailPanel', 'MenuEditor', 'AvailabilityToggle', 'StatsCards'],
        userActions: ['Update menu', 'Toggle availability', 'Confirm order', 'Mark ready'],
        apis: ['GET /api/restaurants/me', 'PATCH /api/menu-items/:id', 'PATCH /api/orders/:id/status'],
        entities: ['restaurants', 'menus', 'menu_items', 'orders'],
        isProtected: true,
        isAdmin: true,
      },
    ],
    coreFeatures: [
      { title: 'Restaurant discovery', description: 'Search and filter nearby restaurants by cuisine, rating and delivery time.' },
      { title: 'Menu browsing', description: 'Sectioned menus with photos, descriptions and dietary information per dish.' },
      { title: 'Live order tracking', description: 'Real-time order status from confirmed to out-for-delivery, with courier position.' },
      { title: 'Courier dispatch', description: 'Automated assignment plus a manual fallback queue with acceptance flow.' },
      { title: 'Reviews & ratings', description: 'Post-delivery ratings drive restaurant ranking.' },
    ],
    futureFeatures: [
      { title: 'Scheduled ordering', description: 'Place an order for a future time slot.' },
      { title: 'Loyalty points', description: 'Earn points per order and redeem across restaurants.' },
      { title: 'Group orders', description: 'Multiple people contribute items to one order.' },
      { title: 'Restaurant analytics', description: 'Sales and menu performance reports for owners.' },
    ],
    apiGroups: [
      {
        name: 'Restaurants',
        description: 'Public discovery of restaurants, menus and reviews.',
        endpoints: [
          { method: 'GET', path: '/api/restaurants', description: 'List restaurants, filterable by cuisine, keyword and location.', requiresAuth: false, relatedTables: ['restaurants'] },
          { method: 'GET', path: '/api/restaurants/:id', description: 'Full restaurant details, rating and hours.', requiresAuth: false, relatedTables: ['restaurants'] },
          { method: 'GET', path: '/api/restaurants/:id/menu', description: 'Active menu with sections and items.', requiresAuth: false, relatedTables: ['menus', 'menu_items'] },
          { method: 'GET', path: '/api/restaurants/:id/reviews', description: 'Paginated reviews for a restaurant.', requiresAuth: false, relatedTables: ['reviews'] },
          { method: 'GET', path: '/api/restaurants/me', description: 'The current user\'s restaurant, for owners.', requiresAuth: true, relatedTables: ['restaurants'] },
          { method: 'PATCH', path: '/api/menu-items/:id', description: 'Owner: edit a dish or toggle availability. Owner-scoped.', requiresAuth: true, relatedTables: ['menu_items', 'menus'] },
        ],
      },
      {
        name: 'Orders',
        description: 'Order lifecycle for customers and restaurants.',
        endpoints: [
          { method: 'POST', path: '/api/orders', description: 'Place an order from the current cart.', requiresAuth: true, relatedTables: ['orders', 'order_items', 'payments'] },
          { method: 'GET', path: '/api/orders', description: 'List the current user\'s orders, newest first.', requiresAuth: true, relatedTables: ['orders'] },
          { method: 'GET', path: '/api/orders/:id', description: 'Order with items, delivery and payment status.', requiresAuth: true, relatedTables: ['orders', 'order_items', 'deliveries', 'payments'] },
          { method: 'GET', path: '/api/orders/:id/tracking', description: 'Live tracking positions for an in-flight order.', requiresAuth: true, relatedTables: ['orders', 'deliveries'] },
          { method: 'PATCH', path: '/api/orders/:id/status', description: 'Restaurant updates order status (confirmed, preparing, ready).', requiresAuth: true, relatedTables: ['orders'] },
        ],
      },
      {
        name: 'Deliveries',
        description: 'Courier-side assignment and status changes.',
        endpoints: [
          { method: 'GET', path: '/api/deliveries', description: 'Available and assigned deliveries for the courier.', requiresAuth: true, relatedTables: ['deliveries'] },
          { method: 'POST', path: '/api/deliveries/:id/accept', description: 'Accept an available delivery (idempotent, transactional).', requiresAuth: true, relatedTables: ['deliveries', 'orders'] },
          { method: 'PATCH', path: '/api/deliveries/:id/status', description: 'Update live status and positions.', requiresAuth: true, relatedTables: ['deliveries'] },
        ],
      },
      {
        name: 'Payments',
        description: 'Charge orders through the payment provider.',
        endpoints: [
          { method: 'POST', path: '/api/payments', description: 'Create a payment intent for an order.', requiresAuth: true, relatedTables: ['payments', 'orders'] },
          { method: 'POST', path: '/api/payments/webhook', description: 'Provider webhook — updates payment status.', requiresAuth: false, relatedTables: ['payments', 'orders'] },
        ],
      },
      {
        name: 'Reviews',
        description: 'Ratings left after delivery.',
        endpoints: [
          { method: 'POST', path: '/api/reviews', description: 'Leave a review for a completed order.', requiresAuth: true, relatedTables: ['reviews', 'restaurants'] },
          { method: 'GET', path: '/api/restaurants/:id/reviews', description: 'Paginated reviews.', requiresAuth: false, relatedTables: ['reviews'] },
        ],
      },
    ],
  },

  // ── E-commerce ────────────────────────────────────────────────────────────
  ecommerce: {
    domain: 'ecommerce',
    label: 'E-commerce store',
    problemStatement:
      'Selling online means maintaining a catalogue, taking payments, getting orders to customers and knowing what is in stock — all while the storefront itself must stay fast and trustworthy.',
    targetUsers: ['Online shoppers', 'Store operators managing the catalogue', 'Warehouse staff fulfilling orders'],
    goals: [
      'Publish a searchable catalogue that stays correct',
      'Take an order end to end with payment and fulfilment',
      'Keep inventory and order state consistent',
    ],
    tables: [
      {
        name: 'categories',
        description: 'Product taxonomy; tree via parentId.',
        fields: [PK, col('name', 'varchar', 'Category name', { isUnique: true }), col('slug', 'varchar', 'URL slug', { isUnique: true }), fk('parentId', 'categories', 'Parent category (nullable)'), col('description', 'text', 'Category blurb'), col('sortOrder', 'integer', 'Display order')],
      },
      {
        name: 'products',
        description: 'Sellable items with snapshot-able core attributes.',
        fields: [
          PK,
          fk('categoryId', 'categories'),
          col('name', 'varchar', 'Product name'),
          col('slug', 'varchar', 'URL slug', { isUnique: true }),
          col('description', 'text', 'Full product description'),
          col('price', 'decimal', 'Current price'),
          col('compareAtPrice', 'decimal', 'Original price for discounts (nullable)'),
          col('sku', 'varchar', 'Stock keeping unit', { isUnique: true }),
          col('status', 'varchar', 'draft | active | archived', { defaultValue: "'draft'" }),
          col('isFeatured', 'boolean', 'Shown on the homepage', { defaultValue: 'false' }),
          col('stock', 'integer', 'Available quantity'),
          col('weightGrams', 'integer', 'Used for shipping estimates (nullable)'),
          col('ratingAvg', 'decimal', 'Average review rating'),
          col('ratingCount', 'integer', 'Review count'),
          col('createdAt', 'timestamp', 'Catalogue entry time'),
        ],
      },
      {
        name: 'product_images',
        description: 'Images per product with sort order.',
        fields: [PK, fk('productId', 'products'), col('url', 'text', 'Image URL'), col('altText', 'varchar', 'Accessibility text'), col('sortOrder', 'integer', 'Display order')],
      },
      {
        name: 'inventory_movements',
        description: 'Every stock change for audit: why and by how much.',
        fields: [PK, fk('productId', 'products'), col('delta', 'integer', 'Positive inbound, negative outbound'), col('reason', 'varchar', 'sale | restock | adjustment | return'), col('note', 'text', 'Optional human note'), fk('orderId', 'orders', 'Referencing order, when from a sale'), col('occurredAt', 'timestamp', 'When the movement happened')],
      },
      {
        name: 'carts',
        description: 'One active cart per user.',
        fields: [PK, fk('userId', '__users__'), col('status', 'varchar', 'open | abandoned | converted', { defaultValue: "'open'" }), col('expiresAt', 'timestamp', 'When an abandoned cart is cleared'), CREATED_AT],
      },
      {
        name: 'cart_items',
        description: 'Lines in a cart; price snapshotted.',
        fields: [PK, fk('cartId', 'carts'), fk('productId', 'products'), col('quantity', 'integer', 'Units chosen'), col('unitPrice', 'decimal', 'Price at add time'), CREATED_AT],
      },
      {
        name: 'orders',
        description: 'Placed orders with totals snapshotted.',
        fields: [
          PK,
          fk('userId', '__users__'),
          col('orderNumber', 'varchar', 'Human-friendly order number', { isUnique: true }),
          col('status', 'varchar', 'pending | paid | fulfilling | shipped | delivered | cancelled'),
          col('subtotal', 'decimal', 'Sum of line items'),
          col('shippingFee', 'decimal', 'Shipping charge'),
          col('tax', 'decimal', 'Calculated tax'),
          col('total', 'decimal', 'What the customer pays'),
          col('shippingAddress', 'text', 'Snapshot address'),
          col('shippingMethod', 'varchar', 'standard | express | pickup'),
          col('paymentStatus', 'varchar', 'unpaid | paid | refunded'),
          col('placedAt', 'timestamp', 'When the order was placed'),
          col('shippedAt', 'timestamp', 'When it left the warehouse (nullable)'),
          col('deliveredAt', 'timestamp', 'When it arrived (nullable)'),
          CREATED_AT,
        ],
      },
      {
        name: 'order_items',
        description: 'Order lines with immutable name and price.',
        fields: [PK, fk('orderId', 'orders'), fk('productId', 'products'), col('name', 'varchar', 'Product name at purchase'), col('sku', 'varchar', 'SKU at purchase'), col('quantity', 'integer', 'Units'), col('unitPrice', 'decimal', 'Price at purchase'), col('discount', 'decimal', 'Line discount applied')],
      },
      {
        name: 'reviews',
        description: 'Verified-purchase product reviews.',
        fields: [PK, fk('productId', 'products'), fk('orderId', 'orders'), fk('userId', '__users__'), col('rating', 'integer', '1–5'), col('title', 'varchar', 'Review headline (nullable)'), col('body', 'text', 'Review text (nullable)'), col('createdAt', 'timestamp', 'When written')],
      },
    ],
    pages: [
      { name: 'Home', route: '/', purpose: 'Featured products, collections and marketing entry points.', components: ['HeroCarousel', 'FeaturedProducts', 'CategoryGrid', 'NewsletterSignup'], userActions: ['Browse collections', 'View product'], apis: ['GET /api/products?featured=true', 'GET /api/categories'], entities: ['products', 'categories'] },
      { name: 'Product Listing', route: '/products', purpose: 'Searchable, filterable catalogue.', components: ['FilterSidebar', 'ProductGrid', 'SortMenu', 'Pagination'], userActions: ['Filter by category/price', 'Sort', 'Search'], apis: ['GET /api/products'], entities: ['products', 'categories'] },
      { name: 'Product Detail', route: '/products/:slug', purpose: 'Gallery, description, price, stock and reviews.', components: ['ImageGallery', 'VariantSelector', 'AddToCartButton', 'ReviewSection'], userActions: ['Add to cart', 'View reviews', 'Select variant'], apis: ['GET /api/products/:slug', 'GET /api/products/:slug/reviews'], entities: ['products', 'product_images', 'reviews'] },
      { name: 'Cart', route: '/cart', purpose: 'Review items before checkout.', components: ['CartTable', 'QuantityStepper', 'OrderSummary', 'CheckoutButton'], userActions: ['Update quantity', 'Remove', 'Proceed to checkout'], apis: ['GET /api/cart', 'PATCH /api/cart/items/:id'], entities: ['carts', 'cart_items'], isProtected: true },
      { name: 'Checkout', route: '/checkout', purpose: 'Address, shipping method and payment.', components: ['AddressForm', 'ShippingMethodPicker', 'PaymentForm', 'OrderSummary'], userActions: ['Enter address', 'Pick shipping', 'Pay'], apis: ['POST /api/orders', 'POST /api/payments'], entities: ['orders', 'order_items'], isProtected: true },
      { name: 'Order Confirmation', route: '/orders/:id', purpose: 'Receipt and shipment tracking.', components: ['OrderSummary', 'StatusTimeline', 'TrackLink'], userActions: ['Track shipment', 'Download receipt'], apis: ['GET /api/orders/:id'], entities: ['orders', 'order_items'], isProtected: true },
      { name: 'Account', route: '/account', purpose: 'Profile, order history and saved addresses.', components: ['ProfilePanel', 'OrderList', 'AddressBook'], userActions: ['Edit profile', 'View order history'], apis: ['GET /api/orders', 'PATCH /api/account'], entities: ['orders'], isProtected: true },
      { name: 'Admin Catalogue', route: '/admin/products', purpose: 'Manage products, inventory and categories.', components: ['ProductTable', 'ProductFormModal', 'InventoryBadge', 'BulkActions'], userActions: ['Create/edit/archive product', 'Adjust stock', 'Manage categories'], apis: ['POST /api/products', 'PUT /api/products/:id', 'GET /api/inventory/movements'], entities: ['products', 'inventory_movements', 'categories'], isProtected: true, isAdmin: true },
    ],
    coreFeatures: [
      { title: 'Catalogue management', description: 'Product, variant and category CRUD with draft/active/archive lifecycle.' },
      { title: 'Search & filtering', description: 'Keyword search combined with category, price and availability filters.' },
      { title: 'Cart & checkout', description: 'Persistent cart with price snapshots and a three-step checkout.' },
      { title: 'Payments', description: 'Card payments with provider webhooks and automatic refunds.' },
      { title: 'Order fulfilment', description: 'Status workflow from paid to shipped, wired into inventory.' },
    ],
    futureFeatures: [
      { title: 'Wishlists', description: 'Saved products shared across sessions.' },
      { title: 'Discount codes', description: 'Percentage and fixed coupons with usage limits.' },
      { title: 'Email receipts', description: 'Transactional order emails via a mail provider.' },
      { title: 'Recommendations', description: 'Related products based on purchase history.' },
    ],
    apiGroups: [
      { name: 'Catalogue', description: 'Public product and category access.', endpoints: [
        { method: 'GET', path: '/api/products', description: 'Filterable, sortable, paginated product list.', requiresAuth: false, relatedTables: ['products'] },
        { method: 'GET', path: '/api/products/:slug', description: 'Single product with images.', requiresAuth: false, relatedTables: ['products', 'product_images'] },
        { method: 'GET', path: '/api/categories', description: 'Category tree.', requiresAuth: false, relatedTables: ['categories'] },
        { method: 'POST', path: '/api/products', description: 'Admin: create a product.', requiresAuth: true, relatedTables: ['products'] },
        { method: 'PUT', path: '/api/products/:id', description: 'Admin: update a product.', requiresAuth: true, relatedTables: ['products'] },
      ]},
      { name: 'Cart', description: 'Session cart operations.', endpoints: [
        { method: 'GET', path: '/api/cart', description: 'Current cart with lines.', requiresAuth: true, relatedTables: ['carts', 'cart_items'] },
        { method: 'POST', path: '/api/cart/items', description: 'Add a product to the cart.', requiresAuth: true, relatedTables: ['cart_items', 'carts'] },
        { method: 'PATCH', path: '/api/cart/items/:id', description: 'Update quantity of a cart line.', requiresAuth: true, relatedTables: ['cart_items'] },
        { method: 'DELETE', path: '/api/cart/items/:id', description: 'Remove a cart line.', requiresAuth: true, relatedTables: ['cart_items'] },
      ]},
      { name: 'Orders', description: 'Checkout and order history.', endpoints: [
        { method: 'POST', path: '/api/orders', description: 'Convert the cart into an order, in a transaction with stock decrement.', requiresAuth: true, relatedTables: ['orders', 'order_items', 'inventory_movements'] },
        { method: 'GET', path: '/api/orders', description: 'The current user\'s orders.', requiresAuth: true, relatedTables: ['orders'] },
        { method: 'GET', path: '/api/orders/:id', description: 'Order detail with lines and shipment state.', requiresAuth: true, relatedTables: ['orders', 'order_items'] },
        { method: 'PATCH', path: '/api/orders/:id/status', description: 'Admin: advance fulfilment status.', requiresAuth: true, relatedTables: ['orders'] },
        { method: 'PATCH', path: '/api/account', description: 'Update the caller\'s profile and default address.', requiresAuth: true, relatedTables: ['orders'] },
      ]},
      { name: 'Payments', description: 'Charging and webhooks.', endpoints: [
        { method: 'POST', path: '/api/payments', description: 'Create a payment intent for the order.', requiresAuth: true, relatedTables: ['orders'] },
        { method: 'POST', path: '/api/payments/webhook', description: 'Provider webhook.', requiresAuth: false, relatedTables: ['orders'] },
      ]},
      { name: 'Inventory', description: 'Stock control and audit trail.', endpoints: [
        { method: 'GET', path: '/api/inventory', description: 'Admin: current stock levels.', requiresAuth: true, relatedTables: ['products'] },
        { method: 'GET', path: '/api/inventory/movements', description: 'Admin: audit trail of stock changes.', requiresAuth: true, relatedTables: ['inventory_movements'] },
        { method: 'PATCH', path: '/api/inventory/products/:id', description: 'Admin: set or adjust stock.', requiresAuth: true, relatedTables: ['products', 'inventory_movements'] },
      ]},
      { name: 'Reviews', description: 'Verified-purchase ratings.', endpoints: [
        { method: 'GET', path: '/api/products/:slug/reviews', description: 'Product reviews.', requiresAuth: false, relatedTables: ['reviews'] },
        { method: 'POST', path: '/api/reviews', description: 'Leave a review for a purchased product.', requiresAuth: true, relatedTables: ['reviews', 'products'] },
      ]},
    ],
  },

  // ── Marketplace ───────────────────────────────────────────────────────────
  marketplace: {
    domain: 'marketplace',
    label: 'Multi-vendor marketplace',
    problemStatement:
      'Connecting buyers and sellers at scale means arbitrating trust, handling payouts, deduplicating listings and moderating content — without letting either side see the other kind of problem.',
    targetUsers: ['Sellers who want an audience', 'Buyers seeking options and price competition', 'Platform operators enforcing trust'],
    goals: [
      'Let sellers publish listings with approval and moderation',
      'Match buyers to listings through search and categories',
      'Manage escrow-style payment and seller payouts',
    ],
    tables: [
      { name: 'sellers', description: 'Vendor accounts with public stores.', fields: [PK, fk('userId', '__users__'), col('displayName', 'varchar', 'Shop name'), col('description', 'text', 'Store blurb'), col('avatarUrl', 'text', 'Profile image'), col('ratingAvg', 'decimal', 'Average rating'), col('ratingCount', 'integer', 'Rating total'), col('status', 'varchar', 'pending | active | suspended', { defaultValue: "'pending'" }), col('payoutMethod', 'text', 'Payout configuration (nullable)'), CREATED_AT] },
      { name: 'categories', description: 'Listing taxonomy tree.', fields: [PK, col('name', 'varchar', 'Category name', { isUnique: true }), col('slug', 'varchar', 'URL slug', { isUnique: true }), fk('parentId', 'categories', 'Parent, nullable'), col('sortOrder', 'integer', 'Display order')] },
      { name: 'listings', description: 'The sellable unit — a seller\'s offer.', fields: [PK, fk('sellerId', 'sellers'), fk('categoryId', 'categories'), col('title', 'varchar', 'Listing title'), col('description', 'text', 'Full description'), col('price', 'decimal', 'Price'), col('currency', 'varchar', 'ISO currency code, e.g. USD'), col('condition', 'varchar', 'new | used | refurbished'), col('location', 'varchar', 'City or region'), col('status', 'varchar', 'draft | pending | active | sold | removed', { defaultValue: "'draft'" }), col('viewCount', 'integer', 'Views, for seller analytics'), col('createdAt', 'timestamp', 'Listing time'), col('publishedAt', 'timestamp', 'Approval time (nullable)')] },
      { name: 'offers', description: 'Buyer counter-offers on a listing.', fields: [PK, fk('listingId', 'listings'), fk('buyerId', '__users__'), col('amount', 'decimal', 'Offered price'), col('message', 'text', 'Optional note'), col('status', 'varchar', 'pending | accepted | declined | withdrawn'), col('createdAt', 'timestamp', 'Offer time')] },
      { name: 'orders', description: 'Marketplace purchase connecting seller and buyer.', fields: [PK, fk('listingId', 'listings'), fk('buyerId', '__users__'), col('total', 'decimal', 'Total charged'), col('commission', 'decimal', 'Platform share'), col('status', 'varchar', 'pending | paid | fulfilled | completed | disputed | refunded'), col('paymentStatus', 'varchar', 'unpaid | paid | held | released | refunded'), col('shippingAddress', 'text', 'Destination'), col('createdAt', 'timestamp', 'Order time'), col('completedAt', 'timestamp', 'Fulfilment completion (nullable)')] },
      { name: 'payouts', description: 'Money owed or paid to sellers, net of commission.', fields: [PK, fk('sellerId', 'sellers'), col('amount', 'decimal', 'Gross amount'), col('commission', 'decimal', 'Platform deduction'), col('net', 'decimal', 'Amount to pay'), col('status', 'varchar', 'pending | paid | failed'), col('paidAt', 'timestamp', 'When paid (nullable)'), col('createdAt', 'timestamp', 'Payout run time')] },
      { name: 'reviews', description: 'Mutual reviews between buyer and seller.', fields: [PK, fk('orderId', 'orders'), fk('authorId', '__users__'), col('score', 'integer', '1–5'), col('body', 'text', 'Review text (nullable)'), col('createdAt', 'timestamp', 'Review time')] },
      { name: 'messages', description: 'Buyer–seller threads scoped to a listing.', fields: [PK, fk('listingId', 'listings'), fk('senderId', '__users__'), fk('receiverId', '__users__'), col('body', 'text', 'Message content'), col('readAt', 'timestamp', 'When read (nullable)'), col('createdAt', 'timestamp', 'Sent time')] },
    ],
    pages: [
      { name: 'Search', route: '/search', purpose: 'Browse and filter all active listings.', components: ['SearchBar', 'FilterRail', 'ListingCard', 'MapToggle'], userActions: ['Search', 'Filter by category/price/location', 'Save listing'], apis: ['GET /api/listings'], entities: ['listings', 'categories'] },
      { name: 'Listing Detail', route: '/listings/:id', purpose: 'Listing details, seller profile and buy/offer flow.', components: ['ListingGallery', 'SellerCard', 'BuyButton', 'OfferForm', 'MessageThread'], userActions: ['Buy now', 'Make an offer', 'Message seller'], apis: ['GET /api/listings/:id', 'POST /api/offers', 'POST /api/messages'], entities: ['listings', 'sellers', 'offers', 'messages'] },
      { name: 'Seller Dashboard', route: '/seller', purpose: 'Seller storefront management and analytics.', components: ['ListingTable', 'ListingFormModal', 'SalesChart', 'PayoutHistory'], userActions: ['Create/edit listing', 'Accept offers', 'Mark sold'], apis: ['POST /api/listings', 'PATCH /api/listings/:id', 'GET /api/payouts'], entities: ['listings', 'orders', 'payouts'], isProtected: true },
      { name: 'My Purchases', route: '/purchases', purpose: 'Order and post-purchase actions for buyers.', components: ['OrderList', 'StatusBadge', 'ReviewDialog', 'DisputeButton'], userActions: ['Track order', 'Review', 'Open dispute'], apis: ['GET /api/orders', 'POST /api/reviews'], entities: ['orders', 'reviews'], isProtected: true },
      { name: 'Admin Moderation', route: '/admin', purpose: 'Approve sellers, moderate listings, resolve disputes.', components: ['PendingQueue', 'ListingReviewPanel', 'DisputeList', 'BanAction'], userActions: ['Approve seller', 'Remove listing', 'Resolve dispute'], apis: ['GET /api/admin/pending', 'PATCH /api/admin/listings/:id/approve'], entities: ['sellers', 'listings', 'orders'], isProtected: true, isAdmin: true },
    ],
    coreFeatures: [
      { title: 'Listing lifecycle', description: 'Draft → pending → active → sold, with seller submission and admin approval gates.' },
      { title: 'Two-sided search', description: 'Type-ahead search across titles plus category, price and location facets.' },
      { title: 'Offers & negotiation', description: 'Buyer counter-offers with seller accept/decline and automatic expiry.' },
      { title: 'Escrow payments', description: 'Funds held on purchase and released to the seller on fulfilment.' },
      { title: 'Trust & moderation', description: 'Reviews, ratings, seller identity and report handling.' },
    ],
    futureFeatures: [
      { title: 'Seller subscriptions', description: 'Tiered seller plans with listing boosts.' },
      { title: 'Shipping integrations', description: 'Label purchase and carrier pickups from within the app.' },
      { title: 'Wishlist & alerts', description: 'Saved searches that notify when a matching listing appears.' },
      { title: 'Analytics API', description: 'Seller-facing sales and traffic reports.' },
    ],
    apiGroups: [
      { name: 'Listings', description: 'Public and seller listing operations.', endpoints: [
        { method: 'GET', path: '/api/listings', description: 'Search active listings with filters and pagination.', requiresAuth: false, relatedTables: ['listings'] },
        { method: 'GET', path: '/api/listings/:id', description: 'Listing detail with seller summary.', requiresAuth: false, relatedTables: ['listings', 'sellers'] },
        { method: 'POST', path: '/api/listings', description: 'Seller: create a listing (enters moderation).', requiresAuth: true, relatedTables: ['listings'] },
        { method: 'PATCH', path: '/api/listings/:id', description: 'Seller: edit own listing. Owner-scoped.', requiresAuth: true, relatedTables: ['listings'] },
      ]},
      { name: 'Offers', description: 'Negotiation flow.', endpoints: [
        { method: 'POST', path: '/api/offers', description: 'Make a counter-offer on a listing. Buyer-scoped.', requiresAuth: true, relatedTables: ['offers', 'listings'] },
        { method: 'PATCH', path: '/api/offers/:id', description: 'Seller: accept or decline. Owner-scoped.', requiresAuth: true, relatedTables: ['offers'] },
      ]},
      { name: 'Orders', description: 'Purchases and escrow state.', endpoints: [
        { method: 'POST', path: '/api/orders', description: 'Purchase a listing; funds go to escrow.', requiresAuth: true, relatedTables: ['orders', 'listings'] },
        { method: 'GET', path: '/api/orders', description: 'Buyer order history.', requiresAuth: true, relatedTables: ['orders'] },
        { method: 'PATCH', path: '/api/orders/:id/fulfil', description: 'Seller marks as shipped/completed; releases escrow minus commission.', requiresAuth: true, relatedTables: ['orders', 'payouts'] },
        { method: 'GET', path: '/api/orders/:id/dispute', description: 'Open a dispute.', requiresAuth: true, relatedTables: ['orders'] },
      ]},
      { name: 'Payouts', description: 'Seller money movement.', endpoints: [
        { method: 'GET', path: '/api/payouts', description: 'Seller: payout history. Owner-scoped.', requiresAuth: true, relatedTables: ['payouts'] },
      ]},
      { name: 'Reviews', description: 'Mutual trust signals.', endpoints: [
        { method: 'POST', path: '/api/reviews', description: 'Review a counterparty after a completed order.', requiresAuth: true, relatedTables: ['reviews', 'orders'] },
        { method: 'GET', path: '/api/sellers/:id/reviews', description: 'Public seller reputation.', requiresAuth: false, relatedTables: ['reviews', 'sellers'] },
      ]},
      { name: 'Messaging', description: 'Buyer–seller communication.', endpoints: [
        { method: 'GET', path: '/api/messages', description: 'Threads for the current user.', requiresAuth: true, relatedTables: ['messages'] },
        { method: 'POST', path: '/api/messages', description: 'Send a message. Listing-scoped, participant-only.', requiresAuth: true, relatedTables: ['messages'] },
      ]},
      { name: 'Moderation', description: 'Admin queue.', endpoints: [
        { method: 'GET', path: '/api/admin/pending', description: 'Pending sellers and listings.', requiresAuth: true, relatedTables: ['sellers', 'listings'] },
        { method: 'PATCH', path: '/api/admin/listings/:id/approve', description: 'Approve or remove a listing.', requiresAuth: true, relatedTables: ['listings'] },
        { method: 'PATCH', path: '/api/admin/sellers/:id/approve', description: 'Approve or suspend a seller.', requiresAuth: true, relatedTables: ['sellers'] },
      ]},
    ],
  },

  // ── SaaS ──────────────────────────────────────────────────────────────────
  saas: {
    domain: 'saas',
    label: 'SaaS platform',
    problemStatement:
      'Teams need their work, customer context and usage in one place, but tool sprawl means data (and knowledge) scattered across disconnected products — and the vendor needs billing that tracks real usage.',
    targetUsers: ['Teams managing projects and customers', 'Team leads and admins', 'Operators who own subscriptions and billing'],
    goals: [
      'Give each team a workspace with shared context',
      'Track the work and customer relationship in one system',
      'Run subscription billing that reflects real usage',
    ],
    tables: [
      { name: 'workspaces', description: 'Tenancy boundary: every other row belongs to a workspace.', fields: [PK, col('name', 'varchar', 'Workspace name'), col('slug', 'varchar', 'URL slug', { isUnique: true }), col('plan', 'varchar', 'free | pro | business', { defaultValue: "'free'" }), col('seatLimit', 'integer', 'Team-member cap per plan'), col('features', 'text', 'JSON flags enabled for the plan'), col('createdAt', 'timestamp', 'Creation time')] },
      { name: 'workspace_members', description: 'Membership of a user in a workspace with a role.', fields: [PK, fk('workspaceId', 'workspaces'), fk('userId', '__users__'), col('role', 'varchar', 'owner | admin | member', { defaultValue: "'member'" }), col('joinedAt', 'timestamp', 'When they joined')] },
      { name: 'customers', description: 'CRM record: accounts the team sells to.', fields: [PK, fk('workspaceId', 'workspaces'), col('name', 'varchar', 'Company name'), col('email', 'varchar', 'Primary contact email'), col('phone', 'varchar', 'Contact phone (nullable)'), col('stage', 'varchar', 'lead | qualified | proposal | won | lost'), fk('ownerId', 'workspace_members', 'Member who owns the account'), col('value', 'decimal', 'Expected deal value'), col('nextFollowUpAt', 'timestamp', 'Next touchpoint (nullable)'), col('createdAt', 'timestamp', 'Account creation time')] },
      { name: 'projects', description: 'Bounded pieces of work with boards.', fields: [PK, fk('workspaceId', 'workspaces'), col('name', 'varchar', 'Project name'), col('description', 'text', 'Project summary'), col('status', 'varchar', 'planning | active | on_hold | done'), col('dueAt', 'timestamp', 'Target date (nullable)'), col('createdAt', 'timestamp', 'Creation time')] },
      { name: 'tasks', description: 'Work items with assignment and effort.', fields: [PK, fk('projectId', 'projects'), fk('assigneeId', '__users__', 'Assigned member (nullable)'), col('title', 'varchar', 'Task title'), col('description', 'text', 'Task detail'), col('status', 'varchar', 'todo | in_progress | review | done'), col('priority', 'varchar', 'low | medium | high | critical'), col('estimateHours', 'decimal', 'Effort estimate'), col('dueAt', 'timestamp', 'Due date (nullable)'), col('completedAt', 'timestamp', 'When done (nullable)'), col('createdAt', 'timestamp', 'Creation time')] },
      { name: 'subscriptions', description: 'A workspace\'s paid plan state.', fields: [PK, fk('workspaceId', 'workspaces'), col('plan', 'varchar', 'Billing plan id'), col('status', 'varchar', 'trialing | active | past_due | cancelled'), col('providerRef', 'varchar', 'Billing provider subscription id'), col('currentPeriodEnd', 'timestamp', 'Renewal time'), col('seats', 'integer', 'Paid seats'), col('createdAt', 'timestamp', 'Started time')] },
      { name: 'usage_events', description: 'One row per countable event for metered billing.', fields: [PK, fk('workspaceId', 'workspaces'), col('metric', 'varchar', 'api_requests | seats | storage_mb | ai_tokens'), col('quantity', 'integer', 'Event magnitude'), col('occurredAt', 'timestamp', 'Time of use')] },
      { name: 'invoices', description: 'Billed amounts per period.', fields: [PK, fk('subscriptionId', 'subscriptions'), col('invoiceNumber', 'varchar', 'Unique invoice number', { isUnique: true }), col('amount', 'decimal', 'Total'), col('currency', 'varchar', 'ISO code'), col('status', 'varchar', 'draft | open | paid | void'), col('dueAt', 'timestamp', 'Payment due date'), col('paidAt', 'timestamp', 'Payment time (nullable)'), col('lineItems', 'text', 'JSON array of line items')] },
      { name: 'support_tickets', description: 'Customer support requests from workspace members.', fields: [PK, fk('workspaceId', 'workspaces'), fk('reporterId', '__users__'), col('subject', 'varchar', 'Ticket subject'), col('body', 'text', 'Issue description'), col('status', 'varchar', 'open | in_progress | resolved | closed'), col('priority', 'varchar', 'low | medium | high | urgent'), col('assignedTo', 'varchar', 'Assignee display name (nullable)'), col('createdAt', 'timestamp', 'Opened time'), col('resolvedAt', 'timestamp', 'Resolution time (nullable)')] },
    ],
    pages: [
      { name: 'Dashboard', route: '/', purpose: 'Cross-project health: open tasks, pipeline, usage.', components: ['StatCards', 'TaskList', 'PipelineChart', 'UsageMeter'], userActions: ['Jump to project', 'View metrics'], apis: ['GET /api/workspace', 'GET /api/projects', 'GET /api/usage'], entities: ['projects', 'tasks', 'usage_events'], isProtected: true },
      { name: 'Projects', route: '/projects', purpose: 'Project list with boards.', components: ['ProjectCard', 'BoardView', 'TaskCard'], userActions: ['Create project', 'Move task', 'Assign'], apis: ['GET /api/projects', 'PATCH /api/tasks/:id'], entities: ['projects', 'tasks'], isProtected: true },
      { name: 'Customers', route: '/customers', purpose: 'CRM pipeline and account detail.', components: ['PipelineBoard', 'CustomerTable', 'CustomerDetailPanel', 'ActivityLog'], userActions: ['Update stage', 'Add follow-up', 'Log activity'], apis: ['GET /api/customers', 'PATCH /api/customers/:id'], entities: ['customers'], isProtected: true },
      { name: 'Billing', route: '/billing', purpose: 'Plan, usage and invoice history.', components: ['PlanCard', 'UsageBreakdown', 'InvoiceList', 'SeatManager'], userActions: ['Change plan', 'Add seats', 'Download invoice'], apis: ['GET /api/billing', 'POST /api/billing/checkout'], entities: ['subscriptions', 'invoices', 'usage_events'], isProtected: true },
      { name: 'Support', route: '/support', purpose: 'Tickets raised and answered.', components: ['TicketList', 'TicketThread', 'ReplyBox'], userActions: ['Create ticket', 'Reply', 'Resolve'], apis: ['GET /api/tickets', 'POST /api/tickets'], entities: ['support_tickets'], isProtected: true },
      { name: 'Settings', route: '/settings', purpose: 'Members, roles, API keys and workspace profile.', components: ['MemberTable', 'RolePicker', 'ApiKeysPanel', 'DangerZone'], userActions: ['Invite member', 'Change role', 'Rotate API key'], apis: ['GET /api/workspace/members', 'POST /api/workspace/members'], entities: ['workspace_members'], isProtected: true },
      { name: 'Admin', route: '/admin', purpose: 'Platform-wide users, plans and incidents.', components: ['UserTable', 'PlanEditor', 'IncidentLog'], userActions: ['Suspend user', 'Change plan limits'], apis: ['GET /api/admin/users'], entities: ['workspaces', 'subscriptions'], isProtected: true, isAdmin: true },
    ],
    coreFeatures: [
      { title: 'Workspaces & members', description: 'Everything is scoped to a workspace; roles gate what members can touch.' },
      { title: 'Boards & tasks', description: 'Kanban-style projects with priorities, estimates and due dates.' },
      { title: 'CRM pipeline', description: 'Customer stages, expected value and follow-up scheduling.' },
      { title: 'Metered subscriptions', description: 'Plan upgrades, seat management and usage-driven pricing.' },
      { title: 'Support inbox', description: 'Tickets that link back to the workspace and customer.' },
    ],
    futureFeatures: [
      { title: 'Automations', description: 'Rule-based task and pipeline transitions.' },
      { title: 'Public API', description: 'Keyed REST API for customer integrations.' },
      { title: 'Reporting exports', description: 'Scheduled CSV/PDF reports to email.' },
      { title: 'Audit log', description: 'Immutable record of member actions.' },
    ],
    apiGroups: [
      { name: 'Workspace', description: 'Tenancy-scoped core reads.', endpoints: [
        { method: 'GET', path: '/api/workspace', description: 'Current workspace profile and membership.', requiresAuth: true, relatedTables: ['workspaces', 'workspace_members'] },
        { method: 'GET', path: '/api/workspace/members', description: 'Member list with roles.', requiresAuth: true, relatedTables: ['workspace_members'] },
        { method: 'POST', path: '/api/workspace/members', description: 'Invite a member by email.', requiresAuth: true, relatedTables: ['workspace_members'] },
        { method: 'PATCH', path: '/api/workspace/members/:id', description: 'Change a member\'s role. Admin only.', requiresAuth: true, relatedTables: ['workspace_members'] },
      ]},
      { name: 'Projects & Tasks', description: 'Work item CRUD.', endpoints: [
        { method: 'GET', path: '/api/projects', description: 'Projects in the workspace.', requiresAuth: true, relatedTables: ['projects'] },
        { method: 'POST', path: '/api/projects', description: 'Create a project.', requiresAuth: true, relatedTables: ['projects'] },
        { method: 'PATCH', path: '/api/tasks/:id', description: 'Update status, assignee or priority. Workspace-scoped.', requiresAuth: true, relatedTables: ['tasks'] },
        { method: 'POST', path: '/api/tasks', description: 'Create a task under a project.', requiresAuth: true, relatedTables: ['tasks'] },
      ]},
      { name: 'Customers', description: 'CRM operations.', endpoints: [
        { method: 'GET', path: '/api/customers', description: 'Pipeline by stage.', requiresAuth: true, relatedTables: ['customers'] },
        { method: 'POST', path: '/api/customers', description: 'Create a customer account.', requiresAuth: true, relatedTables: ['customers'] },
        { method: 'PATCH', path: '/api/customers/:id', description: 'Update stage, value or contact details.', requiresAuth: true, relatedTables: ['customers'] },
      ]},
      { name: 'Billing', description: 'Subscription and usage.', endpoints: [
        { method: 'GET', path: '/api/billing', description: 'Plan, usage summary and open invoices.', requiresAuth: true, relatedTables: ['subscriptions', 'invoices', 'usage_events'] },
        { method: 'POST', path: '/api/billing/checkout', description: 'Create a checkout session to change plan or seats.', requiresAuth: true, relatedTables: ['subscriptions'] },
        { method: 'POST', path: '/api/billing/webhook', description: 'Provider webhook for subscription lifecycle.', requiresAuth: false, relatedTables: ['subscriptions', 'invoices'] },
        { method: 'POST', path: '/api/usage/events', description: 'Record metered usage events.', requiresAuth: true, relatedTables: ['usage_events'] },
        { method: 'GET', path: '/api/usage', description: 'Usage totals per metric for the current period.', requiresAuth: true, relatedTables: ['usage_events'] },
      ]},
      { name: 'Support', description: 'Tickets.', endpoints: [
        { method: 'GET', path: '/api/tickets', description: 'Tickets visible to the caller.', requiresAuth: true, relatedTables: ['support_tickets'] },
        { method: 'POST', path: '/api/tickets', description: 'Open a ticket.', requiresAuth: true, relatedTables: ['support_tickets'] },
        { method: 'PATCH', path: '/api/tickets/:id', description: 'Update status; agents may assign.', requiresAuth: true, relatedTables: ['support_tickets'] },
      ]},
      { name: 'Admin', description: 'Platform-wide control.', endpoints: [
        { method: 'GET', path: '/api/admin/users', description: 'All users with workspace counts.', requiresAuth: true, relatedTables: ['workspace_members'] },
        { method: 'PATCH', path: '/api/admin/workspaces/:id/plan', description: 'Force plan or quota changes.', requiresAuth: true, relatedTables: ['workspaces', 'subscriptions'] },
      ]},
    ],
  },

  // ── Booking ───────────────────────────────────────────────────────────────
  booking: {
    domain: 'booking',
    label: 'Booking & scheduling',
    problemStatement:
      'Back-and-forth messages to find a free slot waste everyone\'s time, and missed appointments leave staff idle. Availability needs to be communicated once and locked by a real booking.',
    targetUsers: ['Customers booking appointments', 'Service providers managing availability', 'Business owners filling their calendar'],
    goals: [
      'Show real availability instead of "call us"',
      'Lock a slot with a confirmed booking and reminder flow',
      'Reduce no-shows through confirmations and easy rescheduling',
    ],
    tables: [
      { name: 'providers', description: 'Schedulable entities: practitioners, venues, staff members.', fields: [PK, fk('userId', '__users__', 'Owner account (nullable)'), col('name', 'varchar', 'Display name'), col('description', 'text', 'Profile text'), col('category', 'varchar', 'salon | clinic | venue | advisor | other'), col('location', 'varchar', 'Where service happens'), col('timezone', 'varchar', 'IANA timezone'), col('ratingAvg', 'decimal', 'Average rating'), col('ratingCount', 'integer', 'Ratings'), col('status', 'varchar', 'active | paused', { defaultValue: "'active'" })] },
      { name: 'services', description: 'Bookable offerings with duration and price.', fields: [PK, fk('providerId', 'providers'), col('name', 'varchar', 'Service name'), col('description', 'text', 'Service detail'), col('durationMinutes', 'integer', 'Length'), col('price', 'decimal', 'Price'), col('currency', 'varchar', 'ISO code'), col('bufferMinutes', 'integer', 'Gap after this service'), col('isActive', 'boolean', 'Whether bookable'), col('createdAt', 'timestamp', 'Added time')] },
      { name: 'availability', description: 'Recurring weekly availability windows for a provider.', fields: [PK, fk('providerId', 'providers'), col('dayOfWeek', 'integer', '0–6, Sunday first'), col('startTime', 'varchar', 'HH:MM'), col('endTime', 'varchar', 'HH:MM'), col('isActive', 'boolean', 'Window currently used'), col('createdAt', 'timestamp', 'Defined time')] },
      { name: 'bookings', description: 'A locked slot with status through the lifecycle.', fields: [PK, fk('providerId', 'providers'), fk('serviceId', 'services'), fk('customerId', '__users__'), col('startAt', 'timestamp', 'Start time'), col('endAt', 'timestamp', 'End time (start + duration + buffer)'), col('status', 'varchar', 'pending | confirmed | cancelled | completed | no_show'), col('notes', 'text', 'Customer request (nullable)'), col('price', 'decimal', 'Price at booking time'), col('paymentStatus', 'varchar', 'unpaid | paid | refunded'), col('reminderSentAt', 'timestamp', 'Reminder dispatch (nullable)'), col('createdAt', 'timestamp', 'Booked time'), col('confirmedAt', 'timestamp', 'Confirmation time (nullable)')] },
      { name: 'payments', description: 'Charges and refunds for bookings.', fields: [PK, fk('bookingId', 'bookings'), col('amount', 'decimal', 'Amount'), col('providerRef', 'varchar', 'Provider charge id (nullable)'), col('status', 'varchar', 'succeeded | failed | refunded'), col('createdAt', 'timestamp', 'Attempt time')] },
      { name: 'reviews', description: 'Post-service reviews.', fields: [PK, fk('bookingId', 'bookings'), fk('providerId', 'providers'), col('rating', 'integer', '1–5'), col('body', 'text', 'Review (nullable)'), col('createdAt', 'timestamp', 'Written time')] },
    ],
    pages: [
      { name: 'Providers', route: '/', purpose: 'Browse providers by category and location.', components: ['ProviderCard', 'CategoryFilter', 'LocationPicker'], userActions: ['Filter providers', 'Open provider page'], apis: ['GET /api/providers'], entities: ['providers'] },
      { name: 'Provider Page', route: '/providers/:id', purpose: 'Services, availability calendar and booking entry.', components: ['ServiceList', 'ServicePicker', 'WeekCalendar', 'TimeSlotGrid', 'BookingForm'], userActions: ['Pick service', 'Pick slot', 'Book'], apis: ['GET /api/providers/:id', 'GET /api/providers/:id/availability', 'POST /api/bookings'], entities: ['providers', 'services', 'availability', 'bookings'] },
      { name: 'My Bookings', route: '/bookings', purpose: 'Upcoming and past appointments with actions.', components: ['BookingCard', 'StatusBadge', 'RescheduleDialog', 'CancelButton', 'ReviewDialog'], userActions: ['Reschedule', 'Cancel', 'Review'], apis: ['GET /api/bookings', 'PATCH /api/bookings/:id'], entities: ['bookings'], isProtected: true },
      { name: 'Provider Dashboard', route: '/provider', purpose: 'Calendar, availability editor and demand.', components: ['DayCalendar', 'AvailabilityEditor', 'BookingDetail', 'StatsRow'], userActions: ['Block time', 'Confirm booking', 'Mark no-show'], apis: ['GET /api/provider/bookings', 'PATCH /api/bookings/:id/status', 'PUT /api/availability'], entities: ['bookings', 'availability', 'providers'], isProtected: true },
      { name: 'Admin Archive', route: '/admin', purpose: 'Cross-provider reports and payments.', components: ['RevenueChart', 'BookingTable', 'PayoutSummary'], userActions: ['View reports', 'Export'], apis: ['GET /api/admin/stats'], entities: ['bookings', 'payments'], isProtected: true, isAdmin: true },
    ],
    coreFeatures: [
      { title: 'Live availability', description: 'Recurring windows minus existing bookings, shown as pickable slots.' },
      { title: 'Instant booking', description: 'Service + slot + payment in one flow; slot locked transactionally.' },
      { title: 'Reschedule & cancel', description: 'Self-service changes with re-opened availability and refund rules.' },
      { title: 'Reminders', description: 'Scheduled confirmations fired before the appointment.' },
    ],
    futureFeatures: [
      { title: 'Group sessions', description: 'Book multiple people into one slot.' },
      { title: 'Waitlists', description: 'Notify when a cancelled slot becomes free.' },
      { title: 'Calendar sync', description: 'Two-way Google/Outlook calendar integration.' },
      { title: 'Deposits', description: 'Require payment to hold certain services.' },
    ],
    apiGroups: [
      { name: 'Providers', description: 'Public provider discovery.', endpoints: [
        { method: 'GET', path: '/api/providers', description: 'List providers, filterable by category and location.', requiresAuth: false, relatedTables: ['providers'] },
        { method: 'GET', path: '/api/providers/:id', description: 'Provider profile with services.', requiresAuth: false, relatedTables: ['providers', 'services'] },
        { method: 'GET', path: '/api/providers/:id/availability', description: 'Open slots for a date range.', requiresAuth: false, relatedTables: ['availability', 'bookings'] },
      ]},
      { name: 'Bookings', description: 'Slot locking and lifecycle.', endpoints: [
        { method: 'POST', path: '/api/bookings', description: 'Book a slot; created in a transaction so double-booking is impossible.', requiresAuth: true, relatedTables: ['bookings', 'services'] },
        { method: 'GET', path: '/api/bookings', description: 'The caller\'s bookings.', requiresAuth: true, relatedTables: ['bookings'] },
        { method: 'PATCH', path: '/api/bookings/:id', description: 'Reschedule or cancel; reopens the slot. Owner-scoped.', requiresAuth: true, relatedTables: ['bookings'] },
        { method: 'PATCH', path: '/api/bookings/:id/status', description: 'Provider confirms, completes or no-shows. Owner-scoped.', requiresAuth: true, relatedTables: ['bookings'] },
      ]},
      { name: 'Availability', description: 'Provider calendar control.', endpoints: [
        { method: 'PUT', path: '/api/availability', description: 'Replace weekly windows for a provider.', requiresAuth: true, relatedTables: ['availability'] },
        { method: 'GET', path: '/api/provider/bookings', description: 'Provider\'s upcoming calendar. Owner-scoped.', requiresAuth: true, relatedTables: ['bookings'] },
      ]},
      { name: 'Payments', description: 'Charging for bookings.', endpoints: [
        { method: 'POST', path: '/api/payments', description: 'Charge a booking (deposit or full).', requiresAuth: true, relatedTables: ['payments', 'bookings'] },
        { method: 'POST', path: '/api/payments/refund', description: 'Refund a cancelled booking within policy.', requiresAuth: true, relatedTables: ['payments', 'bookings'] },
      ]},
      { name: 'Reporting', description: 'Cross-provider aggregates.', endpoints: [
        { method: 'GET', path: '/api/admin/stats', description: 'Revenue, utilisation and no-show rates. Admin only.', requiresAuth: true, relatedTables: ['bookings', 'payments'] },
      ]},
    ],
  },

  // ── Social ────────────────────────────────────────────────────────────────
  social: {
    domain: 'social',
    label: 'Social platform',
    problemStatement:
      'Communities need a place to share, discuss and follow each other, but the mechanics that make it work — feed ordering, notification pressure, moderation — are exactly the parts that are easy to get wrong.',
    targetUsers: ['Community members sharing content', 'Creators building audiences', 'Moderators keeping the space healthy'],
    goals: [
      'Serve a feed ordered by relevance, not raw chronology',
      'Make reacting and discussing effortless',
      'Give moderators the tools to act before problems spread',
    ],
    tables: [
      { name: 'profiles', description: 'Public identity per user.', fields: [PK, fk('userId', '__users__'), col('displayName', 'varchar', 'Public name'), col('handle', 'varchar', 'Unique @handle', { isUnique: true }), col('bio', 'text', 'Profile bio (nullable)'), col('avatarUrl', 'text', 'Avatar image'), col('coverUrl', 'text', 'Cover image (nullable)'), col('location', 'varchar', 'City or region (nullable)'), col('websiteUrl', 'text', 'External link (nullable)'), col('createdAt', 'timestamp', 'Joined time')] },
      { name: 'posts', description: 'The primary content unit.', fields: [PK, fk('authorId', '__users__'), col('body', 'text', 'Content text'), col('imageUrls', 'text', 'JSON array of images'), col('type', 'varchar', 'post | thread_root | reply', { defaultValue: "'post'" }), fk('inReplyTo', 'posts', 'Parent post for replies (nullable)'), col('status', 'varchar', 'published | hidden | removed', { defaultValue: "'published'" }), col('likeCount', 'integer', 'Denormalised like total'), col('replyCount', 'integer', 'Denormalised reply total'), col('createdAt', 'timestamp', 'Posted time')] },
      { name: 'comments', description: 'Replies attached to a post.', fields: [PK, fk('postId', 'posts'), fk('authorId', '__users__'), col('body', 'text', 'Comment text'), fk('parentId', 'comments', 'Nested parent (nullable)'), col('likeCount', 'integer', 'Denormalised likes'), col('status', 'varchar', 'visible | hidden | removed'), col('createdAt', 'timestamp', 'Commented time')] },
      { name: 'reactions', description: 'Likes — one per user per target.', fields: [PK, fk('userId', '__users__'), col('reactionKind', 'varchar', 'like | celebrate | support | love'), col('postId', 'uuid', 'Reacted post (nullable)', { isForeign: true }), col('commentId', 'uuid', 'Reacted comment (nullable)', { isForeign: true }), col('createdAt', 'timestamp', 'Reaction time')] },
      { name: 'follows', description: 'Directed follow edges.', fields: [PK, fk('followerId', '__users__'), fk('followeeId', '__users__'), col('createdAt', 'timestamp', 'Followed time')] },
      { name: 'conversations', description: 'DM threads between users.', fields: [PK, col('title', 'varchar', 'Group conversation title (nullable)'), col('lastMessageAt', 'timestamp', 'Activity ordering'), col('createdAt', 'timestamp', 'Started time')] },
      { name: 'conversation_members', description: 'Who is in a conversation; last-read tracking.', fields: [PK, fk('conversationId', 'conversations'), fk('userId', '__users__'), col('lastReadAt', 'timestamp', 'Read cursor'), col('joinedAt', 'timestamp', 'When added')] },
      { name: 'messages', description: 'Individual messages within a conversation.', fields: [PK, fk('conversationId', 'conversations'), fk('senderId', '__users__'), col('body', 'text', 'Message body'), col('readAt', 'timestamp', 'First read time (nullable)'), col('createdAt', 'timestamp', 'Sent time')] },
      { name: 'notifications', description: 'In-app notification rows for social events.', fields: [PK, fk('recipientId', '__users__'), col('kind', 'varchar', 'like | comment | follow | mention | reply'), col('actorId', 'uuid', 'User who triggered it (nullable)', { isForeign: true }), col('postId', 'uuid', 'Reference post (nullable)', { isForeign: true }), col('readAt', 'timestamp', 'Read time (nullable)'), col('createdAt', 'timestamp', 'Created time')] },
      { name: 'reports', description: 'Moderation reports on posts or users.', fields: [PK, fk('reporterId', '__users__'), col('targetType', 'varchar', 'post | comment | user'), col('targetId', 'uuid', 'Reported row id'), col('reason', 'varchar', 'Report reason'), col('details', 'text', 'Optional context'), col('status', 'varchar', 'open | resolved | dismissed'), col('createdAt', 'timestamp', 'Reported time')] },
    ],
    pages: [
      { name: 'Feed', route: '/', purpose: 'Personalised stream of followed and recommended posts.', components: ['PostCard', 'Composer', 'FeedFilter', 'InfiniteScroll'], userActions: ['Compose post', 'Like', 'Reply', 'Share'], apis: ['GET /api/feed', 'POST /api/posts', 'POST /api/reactions'], entities: ['posts', 'reactions', 'comments'], isProtected: true },
      { name: 'Post Detail', route: '/posts/:id', purpose: 'A post with its full comment thread.', components: ['PostView', 'CommentList', 'CommentComposer', 'LikeBar'], userActions: ['Comment', 'Reply nested', 'Like', 'Report'], apis: ['GET /api/posts/:id', 'POST /api/comments'], entities: ['posts', 'comments'], isProtected: true },
      { name: 'Profile', route: '/:handle', purpose: 'Public profile with posts and follow state.', components: ['ProfileHeader', 'FollowButton', 'PostGrid', 'FollowersModal'], userActions: ['Follow', 'Unfollow', 'Message'], apis: ['GET /api/users/:handle', 'POST /api/follows'], entities: ['profiles', 'posts', 'follows'], isProtected: true },
      { name: 'Messages', route: '/messages', purpose: 'Direct message threads.', components: ['ThreadList', 'ConversationView', 'MessageComposer'], userActions: ['Start conversation', 'Send message'], apis: ['GET /api/conversations', 'POST /api/messages'], entities: ['conversations', 'messages', 'conversation_members'], isProtected: true },
      { name: 'Notifications', route: '/notifications', purpose: 'Recent activity targeting the user.', components: ['NotificationList', 'MarkAllRead'], userActions: ['Open notification', 'Mark all read'], apis: ['GET /api/notifications'], entities: ['notifications'], isProtected: true },
      { name: 'Moderation Queue', route: '/admin/moderation', purpose: 'Reports triage and content removal.', components: ['ReportList', 'ContentPreview', 'TakeDownButton'], userActions: ['Resolve report', 'Remove content', 'Warn user'], apis: ['GET /api/admin/reports', 'PATCH /api/admin/reports/:id'], entities: ['reports', 'posts', 'comments'], isProtected: true, isAdmin: true },
    ],
    coreFeatures: [
      { title: 'Relevance feed', description: 'Recent-first base ordering with engagement-weighted boosts.' },
      { title: 'Compose & thread', description: 'Text and image posts, edited and deleted by authors.' },
      { title: 'Reactions & replies', description: 'Likes plus nested comment threads with denormalised counters.' },
      { title: 'Direct messages', description: 'Conversations with read cursors and unread counts.' },
      { title: 'Moderation toolkit', description: 'Reports, content removal and account warnings without deleting data.' },
    ],
    futureFeatures: [
      { title: 'Trending topics', description: 'Hourly top hashtags and phrases.' },
      { title: 'Stories', description: '24-hour ephemeral posts.' },
      { title: 'Verified badges', description: 'Applied verification marks with review flow.' },
      { title: 'Search', description: 'Full-text search with relevance ranking.' },
    ],
    apiGroups: [
      { name: 'Feed', description: 'Content timeline.', endpoints: [
        { method: 'GET', path: '/api/feed', description: 'Feed for the caller: follows, then recommendations.', requiresAuth: true, relatedTables: ['posts', 'follows'] },
        { method: 'POST', path: '/api/posts', description: 'Create a post.', requiresAuth: true, relatedTables: ['posts'] },
        { method: 'GET', path: '/api/posts/:id', description: 'Post with comment tree.', requiresAuth: true, relatedTables: ['posts', 'comments'] },
        { method: 'PATCH', path: '/api/posts/:id', description: 'Edit own post. Author-scoped.', requiresAuth: true, relatedTables: ['posts'] },
        { method: 'DELETE', path: '/api/posts/:id', description: 'Soft-delete own post.', requiresAuth: true, relatedTables: ['posts'] },
      ]},
      { name: 'Interactions', description: 'Likes, comments and follows.', endpoints: [
        { method: 'POST', path: '/api/reactions', description: 'React or unreact to a post/comment; idempotent toggle.', requiresAuth: true, relatedTables: ['reactions', 'posts'] },
        { method: 'POST', path: '/api/comments', description: 'Add a comment or nested reply.', requiresAuth: true, relatedTables: ['comments', 'posts'] },
        { method: 'GET', path: '/api/posts/:id/comments', description: 'Comment thread for a post.', requiresAuth: true, relatedTables: ['comments'] },
        { method: 'POST', path: '/api/follows', description: 'Follow or unfollow a user; idempotent.', requiresAuth: true, relatedTables: ['follows'] },
        { method: 'GET', path: '/api/users/:handle', description: 'Public profile with post count and follow state.', requiresAuth: true, relatedTables: ['profiles', 'posts', 'follows'] },
      ]},
      { name: 'Messaging', description: 'DMs.', endpoints: [
        { method: 'GET', path: '/api/conversations', description: 'Conversations with unread counts.', requiresAuth: true, relatedTables: ['conversations', 'conversation_members'] },
        { method: 'POST', path: '/api/conversations', description: 'Start a conversation with users.', requiresAuth: true, relatedTables: ['conversations', 'conversation_members'] },
        { method: 'POST', path: '/api/messages', description: 'Send a message in a conversation.', requiresAuth: true, relatedTables: ['messages', 'conversations'] },
        { method: 'GET', path: '/api/conversations/:id/messages', description: 'Messages after a cursor.', requiresAuth: true, relatedTables: ['messages'] },
      ]},
      { name: 'Notifications', description: 'In-app activity.', endpoints: [
        { method: 'GET', path: '/api/notifications', description: 'Recent notifications.', requiresAuth: true, relatedTables: ['notifications'] },
        { method: 'POST', path: '/api/notifications/read-all', description: 'Mark all read.', requiresAuth: true, relatedTables: ['notifications'] },
      ]},
      { name: 'Moderation', description: 'Admin queue.', endpoints: [
        { method: 'GET', path: '/api/admin/reports', description: 'Open reports.', requiresAuth: true, relatedTables: ['reports'] },
        { method: 'PATCH', path: '/api/admin/reports/:id', description: 'Resolve or dismiss a report.', requiresAuth: true, relatedTables: ['reports'] },
        { method: 'PATCH', path: '/api/admin/posts/:id/hide', description: 'Hide content without a report.', requiresAuth: true, relatedTables: ['posts'] },
      ]},
    ],
  },

  // ── LMS ───────────────────────────────────────────────────────────────────
  lms: {
    domain: 'lms',
    label: 'Learning platform',
    problemStatement:
      'Course buyers juggle materials across videos, PDFs and quizzes, instructors have no single view of who is actually learning, and nobody can tell whether anyone finished anything.',
    targetUsers: ['Students enrolling in courses', 'Instructors authoring and teaching', 'Admins operating the catalogue'],
    goals: [
      'Turn a course into a guided path of lessons and checkpoints',
      'Show real progress per learner',
      'Give instructors authorship without support tickets',
    ],
    tables: [
      { name: 'courses', description: 'Top-level sellable learning units.', fields: [PK, fk('instructorId', '__users__'), col('title', 'varchar', 'Course title'), col('slug', 'varchar', 'URL slug', { isUnique: true }), col('description', 'text', 'Marketing description'), col('level', 'varchar', 'beginner | intermediate | advanced'), col('price', 'decimal', 'Price'), col('category', 'varchar', 'Course category'), col('status', 'varchar', 'draft | published | archived', { defaultValue: "'draft'" }), col('ratingAvg', 'decimal', 'Average rating'), col('ratingCount', 'integer', 'Rating count'), col('publishedAt', 'timestamp', 'Publish time (nullable)'), col('createdAt', 'timestamp', 'Course creation')] },
      { name: 'modules', description: 'Course sections containing lessons.', fields: [PK, fk('courseId', 'courses'), col('title', 'varchar', 'Module title'), col('description', 'text', 'Module overview'), col('position', 'integer', 'Order within course')] },
      { name: 'lessons', description: 'Atomic learning content.', fields: [PK, fk('moduleId', 'modules'), col('title', 'varchar', 'Lesson title'), col('type', 'varchar', 'video | article | quiz'), col('content', 'text', 'Markdown or video URL'), col('durationMinutes', 'integer', 'Estimated time'), col('position', 'integer', 'Order within module'), col('isPreview', 'boolean', 'Free preview before enrollment', { defaultValue: 'false' })] },
      { name: 'enrollments', description: 'A learner\'s access to a course.', fields: [PK, fk('courseId', 'courses'), fk('studentId', '__users__'), col('status', 'varchar', 'active | completed | refunded', { defaultValue: "'active'" }), col('progressPercent', 'integer', 'Denormalised progress', { defaultValue: '0' }), col('enrolledAt', 'timestamp', 'Enrollment time'), col('completedAt', 'timestamp', 'Course completion (nullable)')] },
      { name: 'lesson_progress', description: 'Per-lesson completion records.', fields: [PK, fk('enrollmentId', 'enrollments'), fk('lessonId', 'lessons'), col('status', 'varchar', 'not_started | in_progress | completed'), col('lastPositionSeconds', 'integer', 'Video resume position (nullable)'), col('lastAccessedAt', 'timestamp', 'Last activity time')] },
      { name: 'assignments', description: 'Instructor-set work with submissions.', fields: [PK, fk('courseId', 'courses'), col('title', 'varchar', 'Assignment title'), col('instructions', 'text', 'Task brief'), col('dueAt', 'timestamp', 'Deadline (nullable)'), col('maxScore', 'integer', 'Grading scale'), col('createdAt', 'timestamp', 'Set time')] },
      { name: 'submissions', description: 'Student answers to assignments.', fields: [PK, fk('assignmentId', 'assignments'), fk('studentId', '__users__'), col('body', 'text', 'Submitted text'), col('attachmentUrl', 'text', 'Uploaded file (nullable)'), col('score', 'integer', 'Grade (nullable)'), col('feedback', 'text', 'Instructor comment (nullable)'), col('status', 'varchar', 'submitted | graded'), col('submittedAt', 'timestamp', 'Submission time')] },
      { name: 'quizzes', description: 'Graded assessments attached to lessons.', fields: [PK, fk('lessonId', 'lessons'), col('title', 'varchar', 'Quiz title'), col('passPercent', 'integer', 'Pass threshold', { defaultValue: '70' }), col('timeLimitMinutes', 'integer', 'Timer (nullable)')] },
      { name: 'quiz_questions', description: 'Questions and answer options per quiz.', fields: [PK, fk('quizId', 'quizzes'), col('prompt', 'text', 'Question text'), col('options', 'text', 'JSON array of option strings'), col('correctIndex', 'integer', 'Index of the right option'), col('explanation', 'text', 'Shown after answering'), col('points', 'integer', 'Weight', { defaultValue: '1' })] },
      { name: 'quiz_attempts', description: 'Student responses and outcomes.', fields: [PK, fk('quizId', 'quizzes'), fk('studentId', '__users__'), col('answers', 'text', 'JSON of chosen indices'), col('score', 'integer', 'Points scored'), col('passed', 'boolean', 'Whether above threshold'), col('submittedAt', 'timestamp', 'Finished time')] },
      { name: 'certificates', description: 'Completion certificates for finished courses.', fields: [PK, fk('enrollmentId', 'enrollments'), fk('courseId', 'courses'), fk('studentId', '__users__'), col('certificateNumber', 'varchar', 'Unique public identifier', { isUnique: true }), col('issuedAt', 'timestamp', 'Issued time'), col('verificationUrl', 'text', 'Public verify link')] },
      { name: 'reviews', description: 'Course reviews from enrolled students.', fields: [PK, fk('courseId', 'courses'), fk('enrollmentId', 'enrollments'), col('rating', 'integer', '1–5'), col('body', 'text', 'Review (nullable)'), col('createdAt', 'timestamp', 'Written time')] },
    ],
    pages: [
      { name: 'Course Catalog', route: '/', purpose: 'Browse published courses by category and level.', components: ['CourseCard', 'CategoryNav', 'SearchBar', 'LevelFilter'], userActions: ['Search', 'Filter', 'Enroll'], apis: ['GET /api/courses'], entities: ['courses'] },
      { name: 'Course Detail', route: '/courses/:slug', purpose: 'Syllabus, previews, price and enroll CTA.', components: ['CourseHeader', 'CurriculumAccordion', 'PreviewPlayer', 'InstructorCard', 'EnrollButton'], userActions: ['Watch preview', 'Enroll'], apis: ['GET /api/courses/:slug', 'POST /api/enrollments'], entities: ['courses', 'modules', 'lessons'] },
      { name: 'Lesson Player', route: '/learn/:courseSlug/:lessonId', purpose: 'Watch/read content, complete, take quiz.', components: ['VideoPlayer', 'MarkdownRenderer', 'LessonNav', 'QuizRunner', 'CompleteButton'], userActions: ['Mark complete', 'Answer quiz', 'Navigate lessons'], apis: ['GET /api/learn/:courseSlug/lessons/:id', 'POST /api/lesson-progress', 'POST /api/quiz-attempts'], entities: ['lessons', 'lesson_progress', 'quizzes'], isProtected: true },
      { name: 'My Learning', route: '/learn', purpose: 'Enrolled courses with progress bars.', components: ['EnrollmentCard', 'ProgressBar', 'ContinueButton', 'CertificateLink'], userActions: ['Continue course', 'View certificate'], apis: ['GET /api/enrollments'], entities: ['enrollments', 'certificates'], isProtected: true },
      { name: 'Assignments', route: '/learn/:courseSlug/assignments', purpose: 'Submit and review coursework.', components: ['AssignmentList', 'SubmissionForm', 'FeedbackView'], userActions: ['Submit work', 'View grade'], apis: ['GET /api/assignments', 'POST /api/submissions'], entities: ['assignments', 'submissions'], isProtected: true },
      { name: 'Instructor Studio', route: '/studio', purpose: 'Author courses, publish modules, grade work.', components: ['CourseEditor', 'ModuleBuilder', 'LessonForm', 'GradingQueue', 'StatsRow'], userActions: ['Edit syllabus', 'Publish course', 'Grade submission'], apis: ['POST /api/courses', 'PUT /api/lessons/:id', 'GET /api/studio/submissions'], entities: ['courses', 'modules', 'lessons', 'submissions'], isProtected: true },
      { name: 'Admin', route: '/admin', purpose: 'Catalogue oversight, refunds, revenue.', components: ['RevenueChart', 'EnrollmentTable', 'RefundButton'], userActions: ['Archive course', 'Process refund'], apis: ['GET /api/admin/stats'], entities: ['courses', 'enrollments'], isProtected: true, isAdmin: true },
    ],
    coreFeatures: [
      { title: 'Course authoring', description: 'Module/lesson tree with drafts, previews and publishing.' },
      { title: 'Progress tracking', description: 'Per-lesson completion rolls up to a course percentage.' },
      { title: 'Quizzes & grading', description: 'Auto-graded quizzes plus instructor-graded assignments.' },
      { title: 'Certificates', description: 'Verifiable completion certificates on finishing a course.' },
      { title: 'Enrollment & payments', description: 'Purchase, refund and access-control lifecycle.' },
    ],
    futureFeatures: [
      { title: 'Discussion forums', description: 'Per-lesson Q&A threads.' },
      { title: 'Cohorts', description: 'Scheduled course runs with fixed dates.' },
      { title: 'Mobile learning', description: 'Offline-downloadable lessons.' },
      { title: 'Bulk enrollment', description: 'Team seats with progress reporting.' },
    ],
    apiGroups: [
      { name: 'Catalogue', description: 'Public course discovery.', endpoints: [
        { method: 'GET', path: '/api/courses', description: 'Published courses with filters.', requiresAuth: false, relatedTables: ['courses'] },
        { method: 'GET', path: '/api/courses/:slug', description: 'Course with full syllabus and previews.', requiresAuth: false, relatedTables: ['courses', 'modules', 'lessons'] },
        { method: 'POST', path: '/api/courses', description: 'Instructor: create a course.', requiresAuth: true, relatedTables: ['courses'] },
        { method: 'PUT', path: '/api/courses/:id', description: 'Instructor: edit or publish. Owner-scoped.', requiresAuth: true, relatedTables: ['courses'] },
      ]},
      { name: 'Learning', description: 'Enrolled access.', endpoints: [
        { method: 'POST', path: '/api/enrollments', description: 'Enroll in a course (free or paid).', requiresAuth: true, relatedTables: ['enrollments', 'courses'] },
        { method: 'GET', path: '/api/enrollments', description: 'Current user\'s enrollments with progress.', requiresAuth: true, relatedTables: ['enrollments'] },
        { method: 'GET', path: '/api/learn/:courseSlug/lessons/:id', description: 'Lesson content for enrolled learners.', requiresAuth: true, relatedTables: ['lessons', 'enrollments'] },
        { method: 'POST', path: '/api/lesson-progress', description: 'Record lesson completion.', requiresAuth: true, relatedTables: ['lesson_progress', 'enrollments'] },
      ]},
      { name: 'Assessments', description: 'Quizzes and assignments.', endpoints: [
        { method: 'GET', path: '/api/courses/:slug/quizzes', description: 'Quizzes for a course.', requiresAuth: true, relatedTables: ['quizzes'] },
        { method: 'POST', path: '/api/quiz-attempts', description: 'Submit a quiz attempt; auto-scored.', requiresAuth: true, relatedTables: ['quiz_attempts', 'quiz_questions'] },
        { method: 'GET', path: '/api/assignments', description: 'Assignments for an enrolled course.', requiresAuth: true, relatedTables: ['assignments'] },
        { method: 'POST', path: '/api/submissions', description: 'Submit assignment work.', requiresAuth: true, relatedTables: ['submissions', 'assignments'] },
      ]},
      { name: 'Certificates', description: 'Completion verification.', endpoints: [
        { method: 'GET', path: '/api/certificates/:number', description: 'Public certificate verification.', requiresAuth: false, relatedTables: ['certificates'] },
      ]},
      { name: 'Studio', description: 'Instructor tooling.', endpoints: [
        { method: 'GET', path: '/api/studio/submissions', description: 'Pending grading queue for own courses.', requiresAuth: true, relatedTables: ['submissions', 'assignments'] },
        { method: 'PATCH', path: '/api/submissions/:id', description: 'Grade a submission.', requiresAuth: true, relatedTables: ['submissions'] },
        { method: 'PUT', path: '/api/lessons/:id', description: 'Edit lesson content and position. Instructor-scoped.', requiresAuth: true, relatedTables: ['lessons', 'modules'] },
        { method: 'GET', path: '/api/admin/stats', description: 'Enrollment, revenue and completion rates. Admin only.', requiresAuth: true, relatedTables: ['courses', 'enrollments'] },
      ]},
    ],
  },

  // ── Fintech ───────────────────────────────────────────────────────────────
  fintech: {
    domain: 'fintech',
    label: 'Personal finance / fintech',
    problemStatement:
      'People\'s money lives in several places and nothing answers the only question they care about — where did it go this month — without hours of spreadsheet work.',
    targetUsers: ['Individuals tracking spending', 'Households budgeting together', 'Advisors reviewing client finances'],
    goals: [
      'Bring every account\'s activity into one ledger',
      'Make budgeting a rule the app applies, not a habit the user maintains',
      'Report trends, not just balances',
    ],
    tables: [
      { name: 'accounts', description: 'Money containers the user tracks.', fields: [PK, fk('userId', '__users__'), col('name', 'varchar', 'Account name'), col('type', 'varchar', 'checking | savings | credit | cash | investment'), col('institution', 'varchar', 'Bank or provider name (nullable)'), col('balance', 'decimal', 'Current balance'), col('currency', 'varchar', 'ISO code', { defaultValue: "'USD'" }), col('isArchived', 'boolean', 'Hidden but retained', { defaultValue: 'false' }), col('createdAt', 'timestamp', 'Added time')] },
      { name: 'transactions', description: 'The core ledger row.', fields: [PK, fk('accountId', 'accounts'), fk('categoryId', 'categories'), col('amount', 'decimal', 'Negative = money out'), col('currency', 'varchar', 'ISO code'), col('description', 'text', 'Raw description'), col('merchant', 'varchar', 'Normalised merchant name (nullable)'), col('occurredAt', 'timestamp', 'Transaction date'), col('status', 'varchar', 'pending | cleared | void'), col('externalRef', 'varchar', 'Bank reference (nullable)', { isUnique: true }), col('createdAt', 'timestamp', 'Imported time')] },
      { name: 'categories', description: 'User-editable spending categories.', fields: [PK, fk('userId', '__users__'), col('name', 'varchar', 'Category name'), col('kind', 'varchar', 'income | expense | transfer'), col('icon', 'varchar', 'UI icon key'), col('color', 'varchar', 'Chart colour'), col('isSystem', 'boolean', 'Built-in vs user-created', { defaultValue: 'true' })] },
      { name: 'budgets', description: 'Monthly spending limits per category.', fields: [PK, fk('categoryId', 'categories'), fk('userId', '__users__'), col('monthKey', 'varchar', 'YYYY-MM target month'), col('limitAmount', 'decimal', 'Spending ceiling'), col('rollover', 'decimal', 'Unused carry-over (nullable)'), col('createdAt', 'timestamp', 'Set time')] },
      { name: 'goals', description: 'Savings targets with progress.', fields: [PK, fk('userId', '__users__'), col('name', 'varchar', 'Goal name'), col('targetAmount', 'decimal', 'Target'), col('currentAmount', 'decimal', 'Saved so far'), col('deadline', 'timestamp', 'Target date (nullable)'), col('isArchived', 'boolean', 'Closed goal', { defaultValue: 'false' }), col('createdAt', 'timestamp', 'Created time')] },
      { name: 'recurring_transactions', description: 'Predicted subscriptions and bills.', fields: [PK, fk('userId', '__users__'), fk('categoryId', 'categories'), col('merchant', 'varchar', 'Provider name'), col('amount', 'decimal', 'Typical amount'), col('frequency', 'varchar', 'weekly | monthly | yearly'), col('nextOccurrence', 'timestamp', 'Next expected date'), col('isActive', 'boolean', 'Still expected', { defaultValue: 'true' }), col('createdAt', 'timestamp', 'Detected time')] },
      { name: 'payees', description: 'Known counterparties for nicer reports.', fields: [PK, fk('userId', '__users__'), col('name', 'varchar', 'Payee name'), col('defaultCategoryId', 'uuid', 'Preferred category id (nullable)', { isForeign: true }), col('createdAt', 'timestamp', 'Learned time')] },
    ],
    pages: [
      { name: 'Dashboard', route: '/', purpose: 'Net worth, month spend, budget health.', components: ['BalanceCards', 'SpendingChart', 'BudgetList', 'RecentTransactions'], userActions: ['Drill into category', 'View budgets'], apis: ['GET /api/dashboard', 'GET /api/transactions'], entities: ['accounts', 'transactions', 'budgets'], isProtected: true },
      { name: 'Transactions', route: '/transactions', purpose: 'Searchable ledger with filters and paging.', components: ['TransactionTable', 'SearchBox', 'CategoryFilter', 'DateRangePicker', 'BulkCategorise'], userActions: ['Search', 'Categorise', 'Edit', 'Split'], apis: ['GET /api/transactions', 'PATCH /api/transactions/:id'], entities: ['transactions', 'categories'], isProtected: true },
      { name: 'Accounts', route: '/accounts', purpose: 'Manage tracked accounts and balances.', components: ['AccountCard', 'AccountFormModal', 'BalanceEdit'], userActions: ['Add account', 'Update balance', 'Archive'], apis: ['GET /api/accounts', 'POST /api/accounts'], entities: ['accounts'], isProtected: true },
      { name: 'Budgets', route: '/budgets', purpose: 'Set and monitor category limits.', components: ['BudgetTable', 'ProgressBars', 'BudgetEditor'], userActions: ['Set limit', 'Adjust for month'], apis: ['GET /api/budgets', 'PATCH /api/budgets/:id'], entities: ['budgets', 'categories'], isProtected: true },
      { name: 'Reports', route: '/reports', purpose: 'Trends by month, category and account.', components: ['LineChart', 'DonutChart', 'ExportButton'], userActions: ['Change period', 'Export CSV'], apis: ['GET /api/reports/summary'], entities: ['transactions', 'categories'], isProtected: true },
      { name: 'Goals', route: '/goals', purpose: 'Savings targets with progress and deposits.', components: ['GoalCard', 'ProgressRing', 'DepositForm'], userActions: ['Create goal', 'Add deposit'], apis: ['GET /api/goals', 'POST /api/goals'], entities: ['goals'], isProtected: true },
    ],
    coreFeatures: [
      { title: 'Multi-account ledger', description: 'Every account in one chronological, filterable view.' },
      { title: 'Categorisation', description: 'Rules that auto-categorise on import plus bulk assignment.' },
      { title: 'Budgets', description: 'Monthly limits with fatigue-free progress tracking.' },
      { title: 'Recurring detection', description: 'Spot subscriptions and alert before a charge surprises you.' },
      { title: 'Reports', description: 'Cash flow, category share and month-over-month trends.' },
    ],
    futureFeatures: [
      { title: 'Bank sync', description: 'Connect institutions via a data provider.' },
      { title: 'Shared household', description: 'Multiple users contribute to one ledger.' },
      { title: 'Round-up saving', description: 'Spare change moves into goals automatically.' },
      { title: 'Investments', description: 'Portfolio tracking alongside cash accounts.' },
    ],
    apiGroups: [
      { name: 'Ledger', description: 'Accounts and transactions.', endpoints: [
        { method: 'GET', path: '/api/accounts', description: 'Active accounts with balances.', requiresAuth: true, relatedTables: ['accounts'] },
        { method: 'POST', path: '/api/accounts', description: 'Add an account.', requiresAuth: true, relatedTables: ['accounts'] },
        { method: 'PATCH', path: '/api/accounts/:id', description: 'Update balance or archive. Owner-scoped.', requiresAuth: true, relatedTables: ['accounts'] },
        { method: 'GET', path: '/api/transactions', description: 'Filtered, paginated transactions.', requiresAuth: true, relatedTables: ['transactions'] },
        { method: 'PATCH', path: '/api/transactions/:id', description: 'Recategorise or edit a transaction. Owner-scoped.', requiresAuth: true, relatedTables: ['transactions', 'categories'] },
      ]},
      { name: 'Budgets', description: 'Limits and health.', endpoints: [
        { method: 'GET', path: '/api/budgets', description: 'Budgets with spent totals per month.', requiresAuth: true, relatedTables: ['budgets', 'transactions'] },
        { method: 'PATCH', path: '/api/budgets/:id', description: 'Set limit or rollover. Owner-scoped.', requiresAuth: true, relatedTables: ['budgets'] },
      ]},
      { name: 'Goals', description: 'Savings targets.', endpoints: [
        { method: 'GET', path: '/api/goals', description: 'Goals with progress.', requiresAuth: true, relatedTables: ['goals'] },
        { method: 'POST', path: '/api/goals', description: 'Create a goal.', requiresAuth: true, relatedTables: ['goals'] },
        { method: 'POST', path: '/api/goals/:id/deposit', description: 'Record a deposit.', requiresAuth: true, relatedTables: ['goals'] },
      ]},
      { name: 'Reports', description: 'Aggregations.', endpoints: [
        { method: 'GET', path: '/api/reports/summary', description: 'Period totals: income, spend, by-category breakdown.', requiresAuth: true, relatedTables: ['transactions', 'categories'] },
        { method: 'GET', path: '/api/reports/recurring', description: 'Detected recurring charges.', requiresAuth: true, relatedTables: ['recurring_transactions'] },
        { method: 'GET', path: '/api/dashboard', description: 'Snapshot: net worth, month spend, budget health.', requiresAuth: true, relatedTables: ['accounts', 'transactions', 'budgets'] },
      ]},
      { name: 'Categories', description: 'Taxonomy.', endpoints: [
        { method: 'GET', path: '/api/categories', description: 'Categories with spending totals.', requiresAuth: true, relatedTables: ['categories', 'transactions'] },
        { method: 'POST', path: '/api/categories', description: 'Create a custom category.', requiresAuth: true, relatedTables: ['categories'] },
      ]},
    ],
  },

  // ── Logistics ─────────────────────────────────────────────────────────────
  logistics: {
    domain: 'logistics',
    label: 'Logistics & fleet',
    problemStatement:
      'Shipments move through warehouses, carriers and drivers, and each handoff is a blind spot until someone calls to ask where the parcel is. Operators need one view from pickup to dropoff.',
    targetUsers: ['Shippers wanting visibility', 'Drivers and dispatchers coordinating loads', 'Warehouse staff handling stock'],
    goals: [
      'Track every shipment through each leg automatically',
      'Route and dispatch vehicles against real capacity',
      'Make the current state of a shipment answerable in one query',
    ],
    tables: [
      { name: 'warehouses', description: 'Facilities that receive and dispatch freight.', fields: [PK, col('name', 'varchar', 'Facility name'), col('address', 'text', 'Street address'), col('latitude', 'decimal', 'Position'), col('longitude', 'decimal', 'Position'), col('capacityKg', 'integer', 'Throughput limit'), col('status', 'varchar', 'active | maintenance')] },
      { name: 'vehicles', description: 'Trucks and vans in the fleet.', fields: [PK, col('regNumber', 'varchar', 'Registration plate', { isUnique: true }), col('type', 'varchar', 'van | truck | trailer | bike'), col('capacityKg', 'integer', 'Payload limit'), col('status', 'varchar', 'active | in_service | retired'), col('currentLat', 'decimal', 'Reported position (nullable)'), col('currentLng', 'decimal', 'Reported position (nullable)'), col('lastReportAt', 'timestamp', 'Position timestamp (nullable)')] },
      { name: 'drivers', description: 'People who drive the vehicles.', fields: [PK, fk('userId', '__users__', 'Linked user (nullable)'), col('name', 'varchar', 'Driver name'), col('phone', 'varchar', 'Contact number'), col('licenseNumber', 'varchar', 'License id (nullable)'), col('status', 'varchar', 'available | on_shift | off_duty'), col('currentVehicleId', 'uuid', 'Assigned vehicle (nullable)', { isForeign: true })] },
      { name: 'shipments', description: 'The movement unit between two points.', fields: [PK, col('trackingNumber', 'varchar', 'Public tracking id', { isUnique: true }), fk('originWarehouseId', 'warehouses'), fk('destinationWarehouseId', 'warehouses'), col('status', 'varchar', 'created | picked_up | in_transit | out_for_delivery | delivered | failed | returned'), col('weightKg', 'decimal', 'Freight weight'), col('itemCount', 'integer', 'Parcel count'), col('contents', 'text', 'Description'), col('estimatedDelivery', 'timestamp', 'Promised date'), col('deliveredAt', 'timestamp', 'Actual completion (nullable)'), col('createdAt', 'timestamp', 'Created time')] },
      { name: 'routes', description: 'Planned or active vehicle runs.', fields: [PK, fk('vehicleId', 'vehicles'), fk('driverId', 'drivers'), col('status', 'varchar', 'planned | active | completed | cancelled'), col('startTime', 'timestamp', 'Departure window'), col('endTime', 'timestamp', 'ETA (nullable)'), col('distanceKm', 'decimal', 'Estimated distance'), col('createdAt', 'timestamp', 'Assigned time')] },
      { name: 'route_stops', description: 'Ordered stops on a route.', fields: [PK, fk('routeId', 'routes'), fk('shipmentId', 'shipments'), col('sequence', 'integer', 'Stop order'), col('latitude', 'decimal', 'Stop position'), col('longitude', 'decimal', 'Stop position'), col('arrivedAt', 'timestamp', 'Arrival scan (nullable)'), col('departedAt', 'timestamp', 'Departure scan (nullable)')] },
      { name: 'tracking_events', description: 'Immutable audit of shipment movement.', fields: [PK, fk('shipmentId', 'shipments'), col('event', 'varchar', 'label_created | picked_up | in_transit | out_for_delivery | delivered | exception'), col('eventDetails', 'text', 'Human-readable description'), col('latitude', 'decimal', 'Event position (nullable)'), col('longitude', 'decimal', 'Event position (nullable)'), col('occurredAt', 'timestamp', 'Scan time')] },
      { name: 'waybills', description: 'Paperwork per shipment with consignee.', fields: [PK, fk('shipmentId', 'shipments'), col('consignorName', 'varchar', 'Sender'), col('consigneeName', 'varchar', 'Receiver'), col('consigneeAddress', 'text', 'Delivery address'), col('reference', 'varchar', 'Shipper reference (nullable)'), col('declaredValue', 'decimal', 'Insurance value (nullable)')] },
    ],
    pages: [
      { name: 'Operations Board', route: '/', purpose: 'Shipments in motion, alerts, capacity.', components: ['KpiRow', 'ShipmentTable', 'ExceptionPanel', 'MapPreview'], userActions: ['Search tracking number', 'Escalate exception'], apis: ['GET /api/shipments', 'GET /api/shipments/:number'], entities: ['shipments', 'tracking_events'], isProtected: true },
      { name: 'Shipment Detail', route: '/shipments/:number', purpose: 'Full event timeline and waybill.', components: ['Timeline', 'WaybillCard', 'RouteMap', 'EventTable'], userActions: ['View timeline', 'Print waybill'], apis: ['GET /api/shipments/:number', 'GET /api/shipments/:number/events'], entities: ['shipments', 'tracking_events', 'waybills'], isProtected: true },
      { name: 'Live Tracking', route: '/track/:number', purpose: 'Customer-facing parcel progress page.', components: ['ProgressSteps', 'MiniMap', 'EtaEstimate'], userActions: ['Refresh status'], apis: ['GET /api/track/:number'], entities: ['shipments', 'tracking_events'] },
      { name: 'Roster', route: '/fleet', purpose: 'Vehicles, drivers and route assignment.', components: ['VehicleList', 'DriverList', 'RouteAssignModal'], userActions: ['Assign route', 'Set driver status'], apis: ['GET /api/fleet', 'POST /api/routes'], entities: ['vehicles', 'drivers', 'routes'], isProtected: true },
      { name: 'Warehouses', route: '/warehouses', purpose: 'Facility inventory and inbound queue.', components: ['WarehouseCard', 'StagingTable', 'ScanAction'], userActions: ['Scan inbound', 'Allocate dock'], apis: ['GET /api/warehouses', 'PATCH /api/shipments/:id/scan'], entities: ['warehouses', 'shipments'], isProtected: true },
      { name: 'Admin', route: '/admin', purpose: 'Rate cards, contracts, system health.', components: ['RateTable', 'ContractList'], userActions: ['Update rates'], apis: ['GET /api/admin/rates'], entities: ['waybills', 'shipments'], isProtected: true, isAdmin: true },
    ],
    coreFeatures: [
      { title: 'Shipment lifecycle', description: 'Created → picked up → in transit → delivered with immutable event timeline.' },
      { title: 'Live tracking', description: 'Customer-facing page with position from driver or carrier feeds.' },
      { title: 'Route building', description: 'Ordered stops generated from pickup and dropoff batches.' },
      { title: 'Exception handling', description: 'Failed, delayed or mismatched shipments surface to the ops board.' },
      { title: 'Fleet roster', description: 'Vehicle/driver status plus assignment history.' },
    ],
    futureFeatures: [
      { title: 'Carrier integrations', description: 'Import tracking from partner carriers.' },
      { title: 'Proof of delivery', description: 'Photo, signature and geofenced POD capture.' },
      { title: 'Optimiser', description: 'Least-cost route suggestions with live traffic.' },
      { title: 'Customer portal', description: 'Shipment history and repeat booking for shippers.' },
    ],
    apiGroups: [
      { name: 'Shipments', description: 'Movement visibility and control.', endpoints: [
        { method: 'GET', path: '/api/shipments', description: 'Filtered shipment list for operations.', requiresAuth: true, relatedTables: ['shipments'] },
        { method: 'GET', path: '/api/shipments/:number', description: 'Shipment with current state and waybill.', requiresAuth: true, relatedTables: ['shipments', 'waybills'] },
        { method: 'GET', path: '/api/shipments/:number/events', description: 'Full tracking timeline.', requiresAuth: true, relatedTables: ['tracking_events'] },
        { method: 'POST', path: '/api/shipments', description: 'Create a shipment (label + waybill).', requiresAuth: true, relatedTables: ['shipments', 'waybills'] },
        { method: 'PATCH', path: '/api/shipments/:id/scan', description: 'Scan-based status transition at a warehouse.', requiresAuth: true, relatedTables: ['shipments', 'tracking_events'] },
      ]},
      { name: 'Tracking', description: 'Public parcel lookup.', endpoints: [
        { method: 'GET', path: '/api/track/:number', description: 'Latest state plus simplified timeline (no auth).', requiresAuth: false, relatedTables: ['shipments', 'tracking_events'] },
      ]},
      { name: 'Fleet', description: 'Vehicles, drivers and routes.', endpoints: [
        { method: 'GET', path: '/api/fleet', description: 'Vehicles with assigned drivers and status.', requiresAuth: true, relatedTables: ['vehicles', 'drivers'] },
        { method: 'POST', path: '/api/routes', description: 'Create and assign a route.', requiresAuth: true, relatedTables: ['routes', 'route_stops'] },
        { method: 'GET', path: '/api/routes/:id/stops', description: 'Ordered stops with scan state.', requiresAuth: true, relatedTables: ['route_stops', 'shipments'] },
      ]},
      { name: 'Warehouses', description: 'Facilities and staging.', endpoints: [
        { method: 'GET', path: '/api/warehouses', description: 'Facilities with inbound/outbound counts.', requiresAuth: true, relatedTables: ['warehouses'] },
        { method: 'PATCH', path: '/api/warehouses/:id', description: 'Update capacity or status.', requiresAuth: true, relatedTables: ['warehouses'] },
        { method: 'GET', path: '/api/admin/rates', description: 'Rate cards and contracts. Admin only.', requiresAuth: true, relatedTables: ['waybills', 'shipments'] },
      ]},
    ],
  },

  // ── CMS ───────────────────────────────────────────────────────────────────
  cms: {
    domain: 'cms',
    label: 'Content platform',
    problemStatement:
      'Publishing content is easy; keeping it organised, discoverable and consistently rendered is not. Editors need a fast write path, readers need a fast read path, and the two should never fight.',
    targetUsers: ['Editors and writers producing content', 'Readers consuming articles', 'Site admins managing authors and media'],
    goals: [
      'Give editors draft → review → publish without code changes',
      'Keep articles fast and indexable with clean URLs',
      'Organise content through taxonomy that scales',
    ],
    tables: [
      { name: 'authors', description: 'Writers and contributors with public bios.', fields: [PK, fk('userId', '__users__', 'Linked account (nullable)'), col('name', 'varchar', 'Display name'), col('slug', 'varchar', 'URL slug', { isUnique: true }), col('bio', 'text', 'Author bio'), col('avatarUrl', 'text', 'Avatar image'), col('role', 'varchar', 'editor | contributor | admin', { defaultValue: "'contributor'" }), col('createdAt', 'timestamp', 'Added time')] },
      { name: 'categories', description: 'Top-level content sections.', fields: [PK, col('name', 'varchar', 'Category name', { isUnique: true }), col('slug', 'varchar', 'URL slug', { isUnique: true }), col('description', 'text', 'Section description'), col('sortOrder', 'integer', 'Navigation order')] },
      { name: 'tags', description: 'Cross-cutting labels.', fields: [PK, col('name', 'varchar', 'Tag name', { isUnique: true }), col('slug', 'varchar', 'URL slug', { isUnique: true })] },
      { name: 'posts', description: 'Articles and pages; the central content row.', fields: [PK, fk('authorId', 'authors'), fk('categoryId', 'categories'), col('title', 'varchar', 'Post title'), col('slug', 'varchar', 'URL slug', { isUnique: true }), col('excerpt', 'text', 'Teaser summary'), col('body', 'text', 'Content, markdown'), col('coverImageUrl', 'text', 'Hero image (nullable)'), col('status', 'varchar', 'draft | in_review | scheduled | published | archived', { defaultValue: "'draft'" }), col('publishedAt', 'timestamp', 'Publish time (nullable)'), col('isFeatured', 'boolean', 'Editorial pick', { defaultValue: 'false' }), col('readingMinutes', 'integer', 'Estimated read time'), col('viewCount', 'integer', 'Traffic counter'), col('createdAt', 'timestamp', 'Written time')] },
      { name: 'post_tags', description: 'Many-to-many posts ↔ tags.', fields: [PK, fk('postId', 'posts'), fk('tagId', 'tags')] },
      { name: 'media', description: 'Uploaded images and documents.', fields: [PK, fk('uploaderId', '__users__'), col('filename', 'varchar', 'Original file name'), col('url', 'text', 'Storage URL'), col('mimeType', 'varchar', 'Content type'), col('sizeBytes', 'integer', 'File size'), col('altText', 'varchar', 'Accessibility text (nullable)'), col('createdAt', 'timestamp', 'Uploaded time')] },
      { name: 'pages', description: 'Static pages: about, contact, legal.', fields: [PK, col('title', 'varchar', 'Page title'), col('slug', 'varchar', 'URL slug', { isUnique: true }), col('body', 'text', 'Page content, markdown'), col('seoTitle', 'varchar', 'Meta title (nullable)'), col('seoDescription', 'text', 'Meta description (nullable)'), col('isPublished', 'boolean', 'Live on site', { defaultValue: 'false' }), col('updatedAt', 'timestamp', 'Last edited time')] },
      { name: 'comments', description: 'Reader discussion under posts.', fields: [PK, fk('postId', 'posts'), fk('authorId', '__users__', 'Guest author id (nullable)'), col('authorName', 'varchar', 'Display name'), col('body', 'text', 'Comment text'), col('status', 'varchar', 'pending | approved | spam', { defaultValue: "'pending'" }), col('createdAt', 'timestamp', 'Posted time')] },
      { name: 'newsletter_subscribers', description: 'Email subscribers with double-opt-in state.', fields: [PK, col('email', 'varchar', 'Subscriber email', { isUnique: true }), col('token', 'varchar', 'Confirm token (hashed)'), col('confirmedAt', 'timestamp', 'Opt-in time (nullable)'), col('unsubscribedAt', 'timestamp', 'Opt-out time (nullable)'), col('createdAt', 'timestamp', 'Signup time')] },
    ],
    pages: [
      { name: 'Home', route: '/', purpose: 'Latest and featured articles.', components: ['HeroPost', 'FeaturedGrid', 'LatestList', 'NewsletterForm'], userActions: ['Read article', 'Subscribe'], apis: ['GET /api/posts?featured=true', 'GET /api/posts'], entities: ['posts', 'categories'] },
      { name: 'Article', route: '/:category/:slug', purpose: 'Full article with meta and comments.', components: ['ArticleBody', 'MarkdownRenderer', 'AuthorCard', 'RelatedPosts', 'CommentSection'], userActions: ['Comment', 'Share', 'Read related'], apis: ['GET /api/posts/:slug', 'POST /api/comments'], entities: ['posts', 'authors', 'comments', 'tags'] },
      { name: 'Category Archive', route: '/category/:slug', purpose: 'All posts in one section.', components: ['PostList', 'Pagination', 'TagCloud'], userActions: ['Filter by tag', 'Paginate'], apis: ['GET /api/posts?category=:slug'], entities: ['posts', 'categories', 'tags'] },
      { name: 'Editor', route: '/editor', purpose: 'Write, preview and publish content.', components: ['MarkdownEditor', 'LivePreview', 'MetaSidebar', 'PublishFlow', 'MediaPicker'], userActions: ['Write', 'Schedule', 'Publish', 'Manage media'], apis: ['POST /api/posts', 'PUT /api/posts/:id', 'POST /api/media'], entities: ['posts', 'media', 'categories'], isProtected: true },
      { name: 'Content List', route: '/editor/posts', purpose: 'All content with status and quick actions.', components: ['PostTable', 'StatusFilter', 'BulkActions'], userActions: ['Edit', 'Archive', 'Review'], apis: ['GET /api/posts?all=true'], entities: ['posts'], isProtected: true },
      { name: 'Comments Moderation', route: '/editor/comments', purpose: 'Approve or remove reader comments.', components: ['CommentQueue', 'ApproveButton', 'SpamAction'], userActions: ['Approve', 'Mark spam'], apis: ['GET /api/comments?status=pending', 'PATCH /api/comments/:id'], entities: ['comments'], isProtected: true },
      { name: 'Settings', route: '/editor/settings', purpose: 'Authors, taxonomy and site metadata.', components: ['AuthorManager', 'TaxonomyManager', 'SiteSettings'], userActions: ['Manage authors', 'Manage tags'], apis: ['GET /api/authors', 'POST /api/authors'], entities: ['authors', 'tags'], isProtected: true },
    ],
    coreFeatures: [
      { title: 'Markdown editor', description: 'Split write/preview with draft autosave and a distraction-free mode.' },
      { title: 'Workflow states', description: 'Draft → review → scheduled → published, with audit of the last editor.' },
      { title: 'Taxonomy', description: 'Categories for structure, tags for cross-linking.' },
      { title: 'Media library', description: 'Uploads stored centrally with alt text and asset reuse.' },
      { title: 'Reader engagement', description: 'Comments with moderation, newsletter capture, reading metrics.' },
    ],
    futureFeatures: [
      { title: 'SEO analysis', description: 'Readability and keyword checks before publish.' },
      { title: 'Headless API', description: 'Content served as JSON for external frontends.' },
      { title: 'Multi-language', description: 'Translations per post with locale-aware slugs.' },
      { title: 'Analytics dashboard', description: 'Traffic and engagement by post and section.' },
    ],
    apiGroups: [
      { name: 'Content', description: 'Public and editorial post access.', endpoints: [
        { method: 'GET', path: '/api/posts', description: 'Published posts, filterable by category, tag, featured.', requiresAuth: false, relatedTables: ['posts', 'categories'] },
        { method: 'GET', path: '/api/posts/:slug', description: 'Published post with author and metadata.', requiresAuth: false, relatedTables: ['posts', 'authors'] },
        { method: 'POST', path: '/api/posts', description: 'Editor: create a post.', requiresAuth: true, relatedTables: ['posts'] },
        { method: 'PUT', path: '/api/posts/:id', description: 'Editor: edit, schedule or publish. Author/editor scoped.', requiresAuth: true, relatedTables: ['posts'] },
        { method: 'GET', path: '/api/categories', description: 'Category tree for navigation.', requiresAuth: false, relatedTables: ['categories'] },
        { method: 'GET', path: '/api/tags', description: 'Tags with post counts.', requiresAuth: false, relatedTables: ['tags'] },
      ]},
      { name: 'Comments', description: 'Reader discussion.', endpoints: [
        { method: 'POST', path: '/api/comments', description: 'Submit a comment (enters moderation queue).', requiresAuth: false, relatedTables: ['comments', 'posts'] },
        { method: 'GET', path: '/api/comments?status=pending', description: 'Moderation queue.', requiresAuth: true, relatedTables: ['comments'] },
        { method: 'PATCH', path: '/api/comments/:id', description: 'Moderate: approve or spam.', requiresAuth: true, relatedTables: ['comments'] },
      ]},
      { name: 'Media', description: 'Asset upload and lookup.', endpoints: [
        { method: 'POST', path: '/api/media', description: 'Upload a media asset.', requiresAuth: true, relatedTables: ['media'] },
        { method: 'GET', path: '/api/media', description: 'List assets with search.', requiresAuth: true, relatedTables: ['media'] },
      ]},
      { name: 'Editorial', description: 'Authors and taxonomy management.', endpoints: [
        { method: 'GET', path: '/api/authors', description: 'Authors with roles.', requiresAuth: false, relatedTables: ['authors'] },
        { method: 'POST', path: '/api/authors', description: 'Admin: add an author.', requiresAuth: true, relatedTables: ['authors'] },
      ]},
    ],
  },

  // ── Healthcare ────────────────────────────────────────────────────────────
  healthcare: {
    domain: 'healthcare',
    label: 'Healthcare platform',
    problemStatement:
      'Patient information is scattered across paper notes, spreadsheets and portals, so every visit restarts the conversation. Clinics need records and appointments in one system that respects privacy by design.',
    targetUsers: ['Patients managing appointments and records', 'Clinicians seeing patients efficiently', 'Clinic administrators handling billing and compliance'],
    goals: [
      'Put appointment and record history in one patient timeline',
      'Reduce no-shows and keep clinic schedules full',
      'Keep sensitive data access-scoped and auditable',
    ],
    tables: [
      { name: 'patients', description: 'People receiving care, linked to a user account.', fields: [PK, fk('userId', '__users__'), col('firstName', 'varchar', 'Given name'), col('lastName', 'varchar', 'Family name'), col('dateOfBirth', 'timestamp', 'Birth date'), col('sex', 'varchar', 'assigned sex (nullable)'), col('phone', 'varchar', 'Contact phone'), col('bloodType', 'varchar', 'Blood group (nullable)'), col('allergies', 'text', 'Comma-separated known allergies'), col('createdAt', 'timestamp', 'First registered time')] },
      { name: 'practitioners', description: 'Clinicians and specialists.', fields: [PK, fk('userId', '__users__'), col('title', 'varchar', 'Dr., Prof., etc.'), col('specialty', 'varchar', 'Field of practice'), col('bio', 'text', 'Profile blurb'), col('status', 'varchar', 'active | on_leave | inactive', { defaultValue: "'active'" }) ] },
      { name: 'appointments', description: 'Booked patient-clinician encounters.', fields: [PK, fk('patientId', 'patients'), fk('practitionerId', 'practitioners'), col('startAt', 'timestamp', 'Scheduled start'), col('endAt', 'timestamp', 'Scheduled end'), col('type', 'varchar', 'consultation | follow_up | procedure | telehealth'), col('status', 'varchar', 'scheduled | confirmed | checked_in | completed | cancelled | no_show'), col('reason', 'text', 'Presenting complaint'), col('notes', 'text', 'Booking notes (nullable)'), col('reminderSentAt', 'timestamp', 'Reminder dispatch (nullable)'), col('createdAt', 'timestamp', 'Booked time')] },
      { name: 'medical_records', description: 'Clinical notes and observations per visit.', fields: [PK, fk('patientId', 'patients'), fk('appointmentId', 'appointments'), fk('authorId', 'practitioners'), col('type', 'varchar', 'progress_note | consultation | procedure | follow_up'), col('subjective', 'text', 'Patient-reported symptoms'), col('objective', 'text', 'Examination findings'), col('assessment', 'text', 'Clinical judgement'), col('plan', 'text', 'Next steps'), col('createdAt', 'timestamp', 'Written time')] },
      { name: 'prescriptions', description: 'Medication orders with dispensing state.', fields: [PK, fk('patientId', 'patients'), fk('recordId', 'medical_records'), fk('practitionerId', 'practitioners'), col('medication', 'varchar', 'Drug name'), col('dosage', 'varchar', 'Strength and unit'), col('frequency', 'varchar', 'e.g. twice daily'), col('instructions', 'text', 'Directions to patient'), col('status', 'varchar', 'active | dispensed | completed | stopped'), col('prescribedAt', 'timestamp', 'Prescribed time'), col('endsAt', 'timestamp', 'Course end (nullable)')] },
      { name: 'medications', description: 'Reference table of prescribe-able drugs.', fields: [PK, col('name', 'varchar', 'Drug name', { isUnique: true }), col('defaultDosage', 'varchar', 'Typical strength'), col('defaultFrequency', 'varchar', 'Typical schedule'), col('warnings', 'text', 'Interaction warnings'), col('genericAvailable', 'boolean', 'Generic form exists')] },
      { name: 'lab_results', description: 'Ordered and resulted laboratory tests.', fields: [PK, fk('patientId', 'patients'), fk('practitionerId', 'practitioners'), col('testName', 'varchar', 'e.g. CBC, HbA1c'), col('value', 'varchar', 'Result value'), col('unit', 'varchar', 'Measurement unit'), col('referenceRange', 'varchar', 'Normal range text'), col('status', 'varchar', 'ordered | resulted | abnormal | reviewed'), col('resultedAt', 'timestamp', 'Completion time (nullable)'), col('createdAt', 'timestamp', 'Ordered time')] },
      { name: 'invoices', description: 'Billing for visits and procedures.', fields: [PK, fk('patientId', 'patients'), fk('appointmentId', 'appointments'), col('amount', 'decimal', 'Total billed'), col('status', 'varchar', 'draft | issued | paid | void'), col('insuranceClaimRef', 'varchar', 'Claim number (nullable)'), col('issuedAt', 'timestamp', 'Issue time'), col('paidAt', 'timestamp', 'Payment time (nullable)')] },
      { name: 'audit_log', description: 'Who accessed which record and when.', fields: [PK, fk('patientId', 'patients'), fk('actorId', '__users__'), col('action', 'varchar', 'view | edit | export | share'), col('resourceType', 'varchar', 'record | prescription | result'), col('resourceId', 'uuid', 'Target row id'), col('occurredAt', 'timestamp', 'Access time')] },
    ],
    pages: [
      { name: 'Dashboard', route: '/', purpose: 'Today\'s schedule, overdue tasks, alerts.', components: ['ScheduleSummary', 'AlertList', 'QuickActions'], userActions: ['Open schedule', 'Review alerts'], apis: ['GET /api/clinic/dashboard'], entities: ['appointments', 'lab_results'], isProtected: true },
      { name: 'Appointments', route: '/appointments', purpose: 'Book, confirm and run the day\'s calendar.', components: ['DayCalendar', 'BookingModal', 'CheckInButton', 'NoShowButton'], userActions: ['Book', 'Reschedule', 'Check in', 'No-show'], apis: ['POST /api/appointments', 'PATCH /api/appointments/:id/status'], entities: ['appointments', 'patients'], isProtected: true },
      { name: 'Patient Record', route: '/patients/:id', purpose: 'One timeline of records, results and prescriptions.', components: ['RecordTimeline', 'VitalsPanel', 'ResultTable', 'PrescriptionList'], userActions: ['Add note', 'View result', 'Prescribe'], apis: ['GET /api/patients/:id', 'POST /api/records'], entities: ['patients', 'medical_records', 'lab_results', 'prescriptions'], isProtected: true },
      { name: 'Lab Results', route: '/lab', purpose: 'Order tests and review results.', components: ['OrderForm', 'ResultTable', 'AbnormalFlag'], userActions: ['Order test', 'Review result'], apis: ['POST /api/lab-results', 'GET /api/lab-results'], entities: ['lab_results'], isProtected: true },
      { name: 'Billing', route: '/billing', purpose: 'Invoice and insurance claim status.', components: ['InvoiceTable', 'ClaimStatus'], userActions: ['Issue invoice', 'Record payment'], apis: ['GET /api/billing', 'POST /api/invoices'], entities: ['invoices'], isProtected: true },
      { name: 'Patient Portal', route: '/portal', purpose: 'Patient-facing appointments and records access.' , components: ['PortalAppointments', 'PortalRecords', 'MessageClinic'], userActions: ['Book', 'View results', 'Request prescription refill'], apis: ['GET /api/me/appointments', 'GET /api/me/results'], entities: ['appointments', 'lab_results'], isProtected: true },
      { name: 'Admin & Audit', route: '/admin', purpose: 'Practitioner roster and access audit.', components: ['PractitionerTable', 'AuditLogTable'], userActions: ['Review access log', 'Change practitioner status'], apis: ['GET /api/audit'], entities: ['practitioners', 'audit_log'], isProtected: true, isAdmin: true },
    ],
    coreFeatures: [
      { title: 'Appointment scheduling', description: 'Practitioner calendars with buffer handling and check-in flow.' },
      { title: 'Clinical timeline', description: 'Chronological chart of records, results and prescriptions per patient.' },
      { title: 'Prescribing', description: 'Reference-driven prescriptions with statuses and warnings.' },
      { title: 'Lab ordering', description: 'Order tests and surface abnormal results immediately.' },
      { title: 'Access audit', description: 'Immutable log of every record access, for compliance.' },
    ],
    futureFeatures: [
      { title: 'Telehealth visits', description: 'Video consultations with waiting-room flow.' },
      { title: 'e-Prescribing', description: 'Send prescriptions directly to pharmacies.' },
      { title: 'Patient messaging', description: 'Secure asynchronous chat with a clinic.' },
      { title: 'Reminders & Nudges', description: 'Recall scheduling for chronic condition follow-ups.' },
    ],
    apiGroups: [
      { name: 'Appointments', description: 'Scheduling workflow.', endpoints: [
        { method: 'POST', path: '/api/appointments', description: 'Book an appointment (slot-checked transaction).', requiresAuth: true, relatedTables: ['appointments', 'practitioners'] },
        { method: 'GET', path: '/api/appointments', description: 'Calendar for a range, by practitioner.', requiresAuth: true, relatedTables: ['appointments'] },
        { method: 'PATCH', path: '/api/appointments/:id/status', description: 'Check in, complete, cancel or no-show.', requiresAuth: true, relatedTables: ['appointments'] },
      ]},
      { name: 'Patients & Records', description: 'Chart access and clinical notes.', endpoints: [
        { method: 'GET', path: '/api/patients/:id', description: 'Patient summary with record timeline. Provider-scoped, audited.', requiresAuth: true, relatedTables: ['patients', 'medical_records'] },
        { method: 'POST', path: '/api/patients', description: 'Register a patient.', requiresAuth: true, relatedTables: ['patients'] },
        { method: 'POST', path: '/api/records', description: 'Write a clinical note.', requiresAuth: true, relatedTables: ['medical_records', 'patients'] },
        { method: 'GET', path: '/api/me/appointments', description: 'Patient-portal appointments.', requiresAuth: true, relatedTables: ['appointments'] },
      ]},
      { name: 'Prescriptions', description: 'Medication orders.', endpoints: [
        { method: 'POST', path: '/api/prescriptions', description: 'Prescribe a medication.', requiresAuth: true, relatedTables: ['prescriptions', 'medications'] },
        { method: 'GET', path: '/api/medications', description: 'Reference search.', requiresAuth: true, relatedTables: ['medications'] },
      ]},
      { name: 'Lab', description: 'Tests and results.', endpoints: [
        { method: 'POST', path: '/api/lab-results', description: 'Order a test.', requiresAuth: true, relatedTables: ['lab_results'] },
        { method: 'GET', path: '/api/lab-results', description: 'Results with abnormal filter.', requiresAuth: true, relatedTables: ['lab_results'] },
        { method: 'PATCH', path: '/api/lab-results/:id', description: 'Result entry (laboratory).', requiresAuth: true, relatedTables: ['lab_results'] },
      ]},
      { name: 'Billing', description: 'Invoices and claims.', endpoints: [
        { method: 'GET', path: '/api/billing', description: 'Invoice list by status.', requiresAuth: true, relatedTables: ['invoices'] },
        { method: 'POST', path: '/api/invoices', description: 'Issue an invoice for a visit.', requiresAuth: true, relatedTables: ['invoices', 'appointments'] },
      ]},
      { name: 'Audit', description: 'Compliance access log.', endpoints: [
        { method: 'GET', path: '/api/audit', description: 'Recent access events. Admin only.', requiresAuth: true, relatedTables: ['audit_log'] },
        { method: 'GET', path: '/api/clinic/dashboard', description: 'Today\'s schedule, pending results and alerts.', requiresAuth: true, relatedTables: ['appointments', 'lab_results'] },
        { method: 'GET', path: '/api/me/results', description: 'Patient-portal results and prescriptions.', requiresAuth: true, relatedTables: ['lab_results', 'prescriptions'] },
      ]},
    ],
  },

  // ── Real estate ───────────────────────────────────────────────────────────
  realestate: {
    domain: 'realestate',
    label: 'Real estate platform',
    problemStatement:
      'Property listings go stale, viewings get double-booked and lease paperwork lives in emails. Buyers and renters can\'t trust what they see; landlords can\'t see what they own.',
    targetUsers: ['Buyers and renters searching for homes', 'Landlords managing properties and tenancies', 'Agents coordinating viewings and listings'],
    goals: [
      'Keep listings fresh and searchable with real availability',
      'Run viewings that cannot double-book',
      'Give owners one place for leases, rent and maintenance',
    ],
    tables: [
      { name: 'properties', description: 'The listing unit — a home or space for sale or rent.', fields: [PK, fk('ownerId', '__users__'), col('name', 'varchar', 'Listing headline'), col('description', 'text', 'Full description'), col('listingType', 'varchar', 'sale | rent | short_stay'), col('price', 'decimal', 'Asking price or monthly rent'), col('currency', 'varchar', 'ISO code'), col('address', 'text', 'Street address'), col('city', 'varchar', 'City'), col('latitude', 'decimal', 'Map position'), col('longitude', 'decimal', 'Map position'), col('propertyType', 'varchar', 'apartment | house | office | studio | land'), col('bedrooms', 'integer', 'Bedroom count'), col('bathrooms', 'integer', 'Bathroom count'), col('areaSqm', 'decimal', 'Floor area'), col('yearBuilt', 'integer', 'Construction year (nullable)'), col('status', 'varchar', 'draft | active | under_offer | rented | sold | archived', { defaultValue: "'draft'" }), col('isFeatured', 'boolean', 'Highlights in search', { defaultValue: 'false' }), col('createdAt', 'timestamp', 'Listed time')] },
      { name: 'property_images', description: 'Gallery images per property.', fields: [PK, fk('propertyId', 'properties'), col('url', 'text', 'Image URL'), col('caption', 'varchar', 'Short caption (nullable)'), col('sortOrder', 'integer', 'Gallery order')] },
      { name: 'property_features', description: 'Amenities and characteristics flags.', fields: [PK, fk('propertyId', 'properties'), col('label', 'varchar', 'Feature name'), col('value', 'varchar', 'Value, e.g. "2" for parking spots')] },
      { name: 'agents', description: 'People who represent listings.', fields: [PK, fk('userId', '__users__'), col('name', 'varchar', 'Display name'), col('agency', 'varchar', 'Agency name'), col('phone', 'varchar', 'Contact number'), col('bio', 'text', 'Profile blurb'), col('isVerified', 'boolean', 'Agency check passed', { defaultValue: 'false' })] },
      { name: 'viewings', description: 'Booked property visits.', fields: [PK, fk('propertyId', 'properties'), fk('viewerId', '__users__'), fk('agentId', 'agents'), col('startAt', 'timestamp', 'Scheduled start'), col('status', 'varchar', 'requested | confirmed | completed | cancelled | no_show'), col('notes', 'text', 'Viewer note (nullable)'), col('createdAt', 'timestamp', 'Requested time')] },
      { name: 'tenants', description: 'Current occupancy of rental properties.', fields: [PK, fk('propertyId', 'properties'), fk('userId', '__users__'), col('leaseStart', 'timestamp', 'Move-in date'), col('leaseEnd', 'timestamp', 'Move-out date'), col('rentAmount', 'decimal', 'Monthly rent'), col('depositAmount', 'decimal', 'Security deposit'), col('status', 'varchar', 'active | ended')] },
      { name: 'leases', description: 'Documents and terms per tenancy.', fields: [PK, fk('tenantId', 'tenants'), col('title', 'varchar', 'Document title'), col('documentUrl', 'text', 'Signed file (nullable)'), col('terms', 'text', 'Key terms summary'), col('startDate', 'timestamp', 'Term start'), col('endDate', 'timestamp', 'Term end'), col('signedAt', 'timestamp', 'Signature time (nullable)')] },
      { name: 'rent_payments', description: 'Rent transactions against a tenancy.', fields: [PK, fk('tenantId', 'tenants'), col('dueDate', 'timestamp', 'Period due'), col('amount', 'decimal', 'Amount due'), col('paidAt', 'timestamp', 'Payment time (nullable)'), col('status', 'varchar', 'paid | overdue | partial | waived'), col('method', 'varchar', 'bank | card | cash (nullable)')] },
      { name: 'maintenance_requests', description: 'Tenant-reported issues with owner resolution.', fields: [PK, fk('tenantId', 'tenants'), fk('propertyId', 'properties'), col('title', 'varchar', 'Issue title'), col('description', 'text', 'What is wrong'), col('priority', 'varchar', 'low | medium | high | emergency'), col('status', 'varchar', 'open | assigned | in_progress | resolved | closed'), col('assignedTo', 'varchar', 'Contractor name (nullable)'), col('resolvedAt', 'timestamp', 'Resolution time (nullable)'), col('createdAt', 'timestamp', 'Reported time')] },
    ],
    pages: [
      { name: 'Search', route: '/', purpose: 'Map and list search over active listings.', components: ['SearchBar', 'FilterPanel', 'PropertyCard', 'MapView'], userActions: ['Filter by type/price', 'Draw area', 'Save search'], apis: ['GET /api/properties'], entities: ['properties'] },
      { name: 'Property Detail', route: '/properties/:id', purpose: 'Gallery, features, price terms and viewing booking.', components: ['Gallery', 'FeatureGrid', 'AgentCard', 'ViewingModal'], userActions: ['Book viewing', 'Contact agent', 'Save'], apis: ['GET /api/properties/:id', 'POST /api/viewings'], entities: ['properties', 'property_features', 'agents', 'viewings'] },
      { name: 'Owner Dashboard', route: '/owner', purpose: 'Portfolio: properties, tenancies, rent, maintenance.', components: ['PortfolioGrid', 'TenancyList', 'RentTable', 'MaintenanceBoard'], userActions: ['List property', 'Track rent', 'Assign maintenance'], apis: ['GET /api/owner/properties', 'POST /api/properties'], entities: ['properties', 'tenants', 'rent_payments', 'maintenance_requests'], isProtected: true },
      { name: 'Tenant Portal', route: '/tenant', purpose: 'Pay rent, request maintenance, view lease.', components: ['LeaseCard', 'PayRentButton', 'RequestForm', 'RequestList'], userActions: ['Pay rent', 'File request', 'View lease'], apis: ['GET /api/tenant/lease', 'POST /api/maintenance-requests'], entities: ['leases', 'rent_payments', 'maintenance_requests'], isProtected: true },
      { name: 'Viewings Calendar', route: '/agent', purpose: 'Agent schedule of confirmations.', components: ['DayCalendar', 'ViewingCard', 'ConfirmButton'], userActions: ['Confirm', 'Reschedule', 'Record outcome'], apis: ['GET /api/agent/viewings', 'PATCH /api/viewings/:id'], entities: ['viewings', 'properties'], isProtected: true },
      { name: 'Admin', route: '/admin', purpose: 'Listing quality, agents, platform metrics.', components: ['ListingQualityTable', 'AgentVerification', 'KpiRow'], userActions: ['Verify agent', 'Flag listing'], apis: ['GET /api/admin/agents'], entities: ['agents', 'properties'], isProtected: true, isAdmin: true },
    ],
    coreFeatures: [
      { title: 'Listing lifecycle', description: 'Draft → active → under offer → sold/rented, with freshness flags.' },
      { title: 'Faceted search', description: 'Type, price band, bedrooms, area and map bounds.' },
      { title: 'Viewing booking', description: 'Slot-based requests with confirmation and no-show handling.' },
      { title: 'Tenancy management', description: 'Leases, rent schedule and payment status per unit.' },
      { title: 'Maintenance workflow', description: 'Tenant → owner → contractor with priorities and timestamps.' },
    ],
    futureFeatures: [
      { title: 'Virtual tours', description: 'Embedded 360° and video walkthroughs per property.' },
      { title: 'Offers', description: 'Buyer offer submissions with seller response.' },
      { title: 'Rent collection automation', description: 'Scheduled charges with provider integration.' },
      { title: 'Valuation estimates', description: 'Comparative market estimate per property.' },
    ],
    apiGroups: [
      { name: 'Listings', description: 'Public property search and detail.', endpoints: [
        { method: 'GET', path: '/api/properties', description: 'Active listings with filters, sort and pagination.', requiresAuth: false, relatedTables: ['properties'] },
        { method: 'GET', path: '/api/properties/:id', description: 'Property detail with images and features.', requiresAuth: false, relatedTables: ['properties', 'property_images', 'property_features'] },
        { method: 'POST', path: '/api/properties', description: 'Owner: create a listing.', requiresAuth: true, relatedTables: ['properties'] },
        { method: 'PATCH', path: '/api/properties/:id', description: 'Owner: edit own listing. Owner-scoped.', requiresAuth: true, relatedTables: ['properties'] },
      ]},
      { name: 'Viewings', description: 'Booking and agent flow.', endpoints: [
        { method: 'POST', path: '/api/viewings', description: 'Request a viewing slot. Property-scoped, no double-booking.', requiresAuth: true, relatedTables: ['viewings'] },
        { method: 'GET', path: '/api/agent/viewings', description: 'Agent\'s calendar. Agent-scoped.', requiresAuth: true, relatedTables: ['viewings'] },
        { method: 'PATCH', path: '/api/viewings/:id', description: 'Confirm, reschedule or record outcome. Agent-scoped.', requiresAuth: true, relatedTables: ['viewings'] },
      ]},
      { name: 'Tenancy', description: 'Owner and tenant operations.', endpoints: [
        { method: 'GET', path: '/api/owner/properties', description: 'Portfolio with tenancy and rent summaries.', requiresAuth: true, relatedTables: ['properties', 'tenants', 'rent_payments'] },
        { method: 'GET', path: '/api/tenant/lease', description: 'Current lease with terms.', requiresAuth: true, relatedTables: ['leases', 'tenants'] },
        { method: 'POST', path: '/api/maintenance-requests', description: 'File a maintenance request. Tenant-scoped.', requiresAuth: true, relatedTables: ['maintenance_requests'] },
        { method: 'PATCH', path: '/api/maintenance-requests/:id', description: 'Owner: assign or resolve. Owner-scoped.', requiresAuth: true, relatedTables: ['maintenance_requests'] },
      ]},
      { name: 'Admin', description: 'Platform operations.', endpoints: [
        { method: 'GET', path: '/api/admin/agents', description: 'Agents with verification status. Admin only.', requiresAuth: true, relatedTables: ['agents'] },
        { method: 'PATCH', path: '/api/admin/agents/:id/verify', description: 'Verify or revoke an agent. Admin only.', requiresAuth: true, relatedTables: ['agents'] },
      ]},
    ],
  },

  // ── Fitness ───────────────────────────────────────────────────────────────
  fitness: {
    domain: 'fitness',
    label: 'Health & fitness',
    problemStatement:
      'Most fitness plans die of opacity: no clear program, no visible progress, no feedback loop. Users need a plan they can follow today and evidence that it is working next month.',
    targetUsers: ['Beginners who need structure', 'Athletes tracking measurable progress', 'Coaches programming for clients'],
    goals: [
      'Turn a training goal into a schedule the user can follow',
      'Make progress visible at a glance',
      'Keep nutrition connected to training goals',
    ],
    tables: [
      { name: 'profiles', description: 'Fitness-specific user data.', fields: [PK, fk('userId', '__users__'), col('heightCm', 'decimal', 'Height (nullable)'), col('weightKg', 'decimal', 'Current weight (nullable)'), col('experienceLevel', 'varchar', 'beginner | intermediate | advanced'), col('goal', 'varchar', 'lose_weight | build_muscle | endurance | general'), col('activityLevel', 'varchar', 'sedentary | light | moderate | active'), col('weeklyGoalDays', 'integer', 'Target sessions per week', { defaultValue: '3' }), col('createdAt', 'timestamp', 'Profile created')] },
      { name: 'workouts', description: 'A scheduled session or completed activity.', fields: [PK, fk('userId', '__users__'), col('title', 'varchar', 'Workout name'), col('type', 'varchar', 'strength | cardio | hiit | mobility | yoga'), col('scheduledAt', 'timestamp', 'Planned time (nullable)'), col('completedAt', 'timestamp', 'Finished time (nullable)'), col('durationMinutes', 'integer', 'Actual length'), col('caloriesBurned', 'integer', 'Estimated burn (nullable)'), col('notes', 'text', 'Session notes (nullable)'), col('createdAt', 'timestamp', 'Planned time')] },
      { name: 'exercises', description: 'Reference library of movements.', fields: [PK, col('name', 'varchar', 'Exercise name', { isUnique: true }), col('muscleGroup', 'varchar', 'primary: chest | back | legs | shoulders | arms | core | full_body'), col('equipment', 'varchar', 'barbell | dumbbell | bodyweight | machine | bands | cardio'), col('instructions', 'text', 'Form cues'), col('thumbnailUrl', 'text', 'Diagram or video (nullable)')] },
      { name: 'workout_exercises', description: 'Exercise + sets within a workout.', fields: [PK, fk('workoutId', 'workouts'), fk('exerciseId', 'exercises'), col('sets', 'integer', 'Work sets'), col('reps', 'integer', 'Reps per set'), col('weightKg', 'decimal', 'Load per set (nullable)'), col('durationSeconds', 'integer', 'Timed sets (nullable)'), col('restSeconds', 'integer', 'Rest between sets'), col('completed', 'boolean', 'Marked done in session', { defaultValue: 'false' }), col('sortOrder', 'integer', 'Order in workout')] },
      { name: 'training_plans', description: 'Goal-based program templates.', fields: [PK, col('name', 'varchar', 'Plan name'), col('description', 'text', 'Plan summary'), col('goal', 'varchar', 'Matching profile goal'), col('level', 'varchar', 'beginner | intermediate | advanced'), col('weeks', 'integer', 'Program length'), col('daysPerWeek', 'integer', 'Sessions per week'), col('isFeatured', 'boolean', 'Shown to new users', { defaultValue: 'false' })] },
      { name: 'progress_logs', description: 'Weight and measurement check-ins.', fields: [PK, fk('userId', '__users__'), col('weightKg', 'decimal', 'Scale weight'), col('bodyFatPercent', 'decimal', 'Estimate (nullable)'), col('waistCm', 'decimal', 'Measurement (nullable)'), col('notes', 'text', 'Check-in note (nullable)'), col('loggedAt', 'timestamp', 'Check-in time')] },
      { name: 'goals', description: 'User-set targets with deadlines.', fields: [PK, fk('userId', '__users__'), col('kind', 'varchar', 'weight | workout_count | personal_record | habit'), col('target', 'decimal', 'Target value'), col('current', 'decimal', 'Progress value'), col('deadline', 'timestamp', 'Target date (nullable)'), col('status', 'varchar', 'active | achieved | abandoned'), col('createdAt', 'timestamp', 'Set time')] },
      { name: 'meals', description: 'Logged nutrition entries.', fields: [PK, fk('userId', '__users__'), col('name', 'varchar', 'Meal name'), col('mealType', 'varchar', 'breakfast | lunch | dinner | snack'), col('calories', 'integer', 'Energy'), col('proteinG', 'integer', 'Protein'), col('carbsG', 'integer', 'Carbohydrate'), col('fatG', 'integer', 'Fat'), col('eatenAt', 'timestamp', 'When logged')] },
    ],
    pages: [
      { name: 'Dashboard', route: '/', purpose: 'Today\'s session, week streak, progress snapshot.', components: ['TodayCard', 'StreakPill', 'WeightSparkline', 'GoalProgress'], userActions: ['Start today\'s workout', 'Log weight'], apis: ['GET /api/dashboard', 'GET /api/progress-logs'], entities: ['workouts', 'progress_logs', 'goals'], isProtected: true },
      { name: 'Workout Library', route: '/workouts', purpose: 'Browse sessions and start one.', components: ['WorkoutCard', 'TypeFilter', 'SearchBar'], userActions: ['Start workout', 'Schedule'], apis: ['GET /api/workouts'], entities: ['workouts', 'workout_exercises'], isProtected: true },
      { name: 'Active Session', route: '/workouts/:id/active', purpose: 'Live set tracking with timers.', components: ['ExerciseCarousel', 'SetCounter', 'RestTimer', 'CompleteButton'], userActions: ['Log set', 'Mark rest', 'Complete'], apis: ['GET /api/workouts/:id', 'PATCH /api/workout-exercises/:id'], entities: ['workouts', 'workout_exercises'], isProtected: true },
      { name: 'Exercise Library', route: '/exercises', purpose: 'Searchable movement database.', components: ['ExerciseGrid', 'MuscleFilter', 'EquipmentFilter', 'ExerciseDetail'], userActions: ['View form cues', 'Add to workout'], apis: ['GET /api/exercises'], entities: ['exercises'] },
      { name: 'Progress', route: '/progress', purpose: 'Weight, volume and personal records.', components: ['WeightChart', 'VolumeChart', 'PrList'], userActions: ['Log check-in', 'Record PR'], apis: ['GET /api/progress-logs', 'POST /api/progress-logs'], entities: ['progress_logs', 'goals'], isProtected: true },
      { name: 'Nutrition', route: '/nutrition', purpose: 'Log meals against macro targets.', components: ['MacroRing', 'MealList', 'MealForm'], userActions: ['Log meal', 'See daily totals'], apis: ['GET /api/meals', 'POST /api/meals'], entities: ['meals'], isProtected: true },
      { name: 'Plans', route: '/plans', purpose: 'Adopt a program and generate a schedule.', components: ['PlanCard', 'SchedulePreview', 'AdoptButton'], userActions: ['Adopt plan', 'Regenerate schedule'], apis: ['GET /api/plans', 'POST /api/workouts/generate'], entities: ['training_plans', 'workouts'], isProtected: true },
    ],
    coreFeatures: [
      { title: 'Workout sessions', description: 'Structured sets/reps tracking with rest timers.' },
      { title: 'Exercise library', description: 'Curated movements with cues per muscle group and equipment.' },
      { title: 'Progress tracking', description: 'Weight check-ins, training volume and PRs.' },
      { title: 'Program generation', description: 'Goal + level + days per week → a weekly schedule.' },
      { title: 'Nutrition log', description: 'Quick meal logging with macro totals for the day.' },
    ],
    futureFeatures: [
      { title: 'Gym equipment integration', description: 'Sync with wearables and smart scales.' },
      { title: 'Coach mode', description: 'Assign programs to clients and review adherence.' },
      { title: 'Routines', description: 'Reusable exercise sequences across sessions.' },
      { title: 'Social challenges', description: 'Streaks and leaderboards among friends.' },
    ],
    apiGroups: [
      { name: 'Workouts', description: 'Sessions and live tracking.', endpoints: [
        { method: 'GET', path: '/api/workouts', description: 'Scheduled and completed sessions.', requiresAuth: true, relatedTables: ['workouts'] },
        { method: 'GET', path: '/api/workouts/:id', description: 'Session with exercise details.', requiresAuth: true, relatedTables: ['workouts', 'workout_exercises'] },
        { method: 'POST', path: '/api/workouts', description: 'Create or schedule a session.', requiresAuth: true, relatedTables: ['workouts'] },
        { method: 'POST', path: '/api/workouts/generate', description: 'Generate a week from goal and level.', requiresAuth: true, relatedTables: ['workouts', 'training_plans'] },
        { method: 'PATCH', path: '/api/workout-exercises/:id', description: 'Log completed sets or edits during a session.', requiresAuth: true, relatedTables: ['workout_exercises'] },
        { method: 'POST', path: '/api/workouts/:id/complete', description: 'Mark a session complete with duration.', requiresAuth: true, relatedTables: ['workouts'] },
      ]},
      { name: 'Exercises', description: 'Reference library.', endpoints: [
        { method: 'GET', path: '/api/exercises', description: 'Filterable exercise list.', requiresAuth: false, relatedTables: ['exercises'] },
      ]},
      { name: 'Progress', description: 'Metrics and goals.', endpoints: [
        { method: 'GET', path: '/api/progress-logs', description: 'Check-in history.', requiresAuth: true, relatedTables: ['progress_logs'] },
        { method: 'POST', path: '/api/progress-logs', description: 'Log a check-in.', requiresAuth: true, relatedTables: ['progress_logs'] },
        { method: 'GET', path: '/api/goals', description: 'Active goals.', requiresAuth: true, relatedTables: ['goals'] },
      ]},
      { name: 'Nutrition', description: 'Meal log.', endpoints: [
        { method: 'GET', path: '/api/meals', description: 'Meals for a day with totals.', requiresAuth: true, relatedTables: ['meals'] },
        { method: 'POST', path: '/api/meals', description: 'Log a meal.', requiresAuth: true, relatedTables: ['meals'] },
        { method: 'DELETE', path: '/api/meals/:id', description: 'Remove a logged meal.', requiresAuth: true, relatedTables: ['meals'] },
      ]},
      { name: 'Plans', description: 'Programs.', endpoints: [
        { method: 'GET', path: '/api/plans', description: 'Featured training plans.', requiresAuth: false, relatedTables: ['training_plans'] },
      ]},
      { name: 'Dashboard', description: 'Aggregated home view.', endpoints: [
        { method: 'GET', path: '/api/dashboard', description: 'Today\'s session, streak and progress snapshot.', requiresAuth: true, relatedTables: ['workouts', 'progress_logs', 'goals'] },
      ]},
    ],
  },

  // ── IoT ───────────────────────────────────────────────────────────────────
  iot: {
    domain: 'iot',
    label: 'IoT & telemetry',
    problemStatement:
      'Devices emit readings far faster than humans can watch them, and a slow pipeline hides the one alert that mattered. Operators need continuous ingestion, live dashboards and thresholds that decide for them.',
    targetUsers: ['Device operators monitoring fleets', 'Facility managers watching environments', 'Integrators building on the telemetry API'],
    goals: [
      'Ingest high-frequency device readings reliably',
      'Convert streams into live dashboards and alerts',
      'Keep device identity and rule configuration auditable',
    ],
    tables: [
      { name: 'device_types', description: 'Model families that define capabilities.', fields: [PK, col('name', 'varchar', 'Model name', { isUnique: true }), col('manufacturer', 'varchar', 'Vendor'), col('description', 'text', 'Model capabilities'), col('metricDefinitions', 'text', 'JSON: metric keys, units, ranges'), col('protocol', 'varchar', 'mqtt | http | lorawan | zigbee', { defaultValue: "'mqtt'" })] },
      { name: 'devices', description: 'Physical things sending data.', fields: [PK, fk('typeId', 'device_types'), fk('siteId', 'sites'), col('serialNumber', 'varchar', 'Factory serial', { isUnique: true }), col('name', 'varchar', 'Human name'), col('status', 'varchar', 'online | offline | maintenance | retired'), col('lastSeenAt', 'timestamp', 'Last heartbeat (nullable)'), col('firmwareVersion', 'varchar', 'Current firmware'), col('enrolledAt', 'timestamp', 'First contact time')] },
      { name: 'sites', description: 'Locations where devices are installed.', fields: [PK, col('name', 'varchar', 'Site name'), col('address', 'text', 'Site address'), col('latitude', 'decimal', 'Position'), col('longitude', 'decimal', 'Position'), col('timezone', 'varchar', 'Local timezone')] },
      { name: 'readings', description: 'The telemetry stream; append-only and time-partitioned.', fields: [PK, fk('deviceId', 'devices'), col('metric', 'varchar', 'Metric key: temperature, humidity, power…'), col('value', 'decimal', 'Observed value'), col('unit', 'varchar', 'Unit of measure'), col('recordedAt', 'timestamp', 'Device timestamp'), col('receivedAt', 'timestamp', 'Ingest time'), col('quality', 'varchar', 'good | interpolated | suspect', { defaultValue: "'good'" })] },
      { name: 'alerts', description: 'Threshold violations and lifecycle.', fields: [PK, fk('deviceId', 'devices'), col('metric', 'varchar', 'Triggered metric'), col('severity', 'varchar', 'info | warning | critical'), col('message', 'text', 'Human-readable alert'), col('value', 'decimal', 'Value at trigger'), col('threshold', 'decimal', 'Rule threshold'), col('status', 'varchar', 'triggered | acknowledged | resolved'), col('triggeredAt', 'timestamp', 'Fire time'), col('resolvedAt', 'timestamp', 'Clear time (nullable)')] },
      { name: 'alert_rules', description: 'Conditions evaluated against the stream.', fields: [PK, fk('deviceTypeId', 'device_types'), fk('deviceId', 'devices', 'Optional per-device override (nullable)'), col('metric', 'varchar', 'Metric to evaluate'), col('operator', 'varchar', 'gt | lt | gte | lte | eq'), col('threshold', 'decimal', 'Boundary value'), col('durationMinutes', 'integer', 'Must persist this long'), col('severity', 'varchar', 'info | warning | critical', { defaultValue: "'warning'" }), col('isActive', 'boolean', 'Rule enabled', { defaultValue: 'true' }), col('createdAt', 'timestamp', 'Rule created')] },
      { name: 'dashboards', description: 'Saved live views of metrics.', fields: [PK, fk('userId', '__users__'), col('name', 'varchar', 'Dashboard name'), col('widgets', 'text', 'JSON widget definitions'), col('isDefault', 'boolean', 'Landing view', { defaultValue: 'false' }), col('createdAt', 'timestamp', 'Created time')] },
      { name: 'firmware_versions', description: 'OTA candidates per device type.', fields: [PK, fk('typeId', 'device_types'), col('version', 'varchar', 'Semver'), col('changelog', 'text', 'Release notes'), col('fileUrl', 'text', 'Package location'), col('status', 'varchar', 'draft | rolling | stable'), col('releasedAt', 'timestamp', 'Release time (nullable)')] },
      { name: 'audit_events', description: 'Device configuration changes.', fields: [PK, fk('deviceId', 'devices'), fk('actorId', '__users__'), col('action', 'varchar', 'update | reboot | firmware_update | rule_change'), col('detail', 'text', 'Change description'), col('occurredAt', 'timestamp', 'Action time')] },
    ],
    pages: [
      { name: 'Fleet Overview', route: '/', purpose: 'Device counts, status and active alerts.', components: ['KpiRow', 'DeviceStatusGrid', 'AlertTicker'], userActions: ['Drill to device', 'Acknowledge alert'], apis: ['GET /api/devices', 'GET /api/alerts'], entities: ['devices', 'alerts'], isProtected: true },
      { name: 'Live Dashboard', route: '/dashboards/:id', purpose: 'Realtime metric charts from the stream.', components: ['LineChart', 'GaugeRow', 'RealtimeLegend'], userActions: ['Add widget', 'Change range'], apis: ['GET /api/dashboards/:id', 'GET /api/readings'], entities: ['readings', 'dashboards'], isProtected: true },
      { name: 'Device Detail', route: '/devices/:id', purpose: 'Readings, health, rules and audit history.', components: ['MetricPanels', 'ReadingChart', 'RuleList', 'AuditTable'], userActions: ['Reboot', 'Update firmware', 'Edit rules'], apis: ['GET /api/devices/:id', 'POST /api/devices/:id/actions'], entities: ['devices', 'readings', 'alert_rules', 'audit_events'], isProtected: true },
      { name: 'Alerts', route: '/alerts', purpose: 'Triage and resolve threshold events.', components: ['AlertTable', 'SeverityFilter', 'AcknowledgeButton'], userActions: ['Acknowledge', 'Resolve', 'Snooze'], apis: ['GET /api/alerts', 'PATCH /api/alerts/:id'], entities: ['alerts'], isProtected: true },
      { name: 'Rules Builder', route: '/rules', purpose: 'Compose threshold rules per device or type.', components: ['RuleForm', 'MetricPicker', 'OperatorSelect', 'TestRun'], userActions: ['Create rule', 'Test against history'], apis: ['POST /api/alert-rules', 'POST /api/alert-rules/test'], entities: ['alert_rules'], isProtected: true },
      { name: 'Firmware', route: '/firmware', purpose: 'OTA version management and rollouts.', components: ['VersionTable', 'RolloutProgress', 'UploadForm'], userActions: ['Upload', 'Start rollout'], apis: ['GET /api/firmware', 'POST /api/firmware'], entities: ['firmware_versions', 'devices'], isProtected: true },
      { name: 'Admin', route: '/admin', purpose: 'Sites and device types.', components: ['SiteList', 'TypeManager'], userActions: ['Register site', 'Add device type'], apis: ['GET /api/sites', 'POST /api/sites'], entities: ['sites', 'device_types'], isProtected: true },
    ],
    coreFeatures: [
      { title: 'Device registry', description: 'Enrollment, identity, status and heartbeat tracking.' },
      { title: 'Telemetry ingest', description: 'Append-only readings with batching and backfill handling.' },
      { title: 'Live dashboards', description: 'Per-user views with metric widgets and variable ranges.' },
      { title: 'Threshold rules', description: 'Duration-aware alerts with acknowledge/resolve workflow.' },
      { title: 'OTA firmware', description: 'Version catalogue with staged rollouts and audit.' },
    ],
    futureFeatures: [
      { title: 'Device shadow', description: 'Desired/reported state reconciliation for control.' },
      { title: 'Predictive maintenance', description: 'Anomaly detection over rolling windows.' },
      { title: 'Export API', description: 'Signed time-series export for external analytics.' },
      { title: 'Geofencing', description: 'Location rules for mobile assets.' },
    ],
    apiGroups: [
      { name: 'Devices', description: 'Registry and control.', endpoints: [
        { method: 'GET', path: '/api/devices', description: 'Device list with status filters.', requiresAuth: true, relatedTables: ['devices'] },
        { method: 'GET', path: '/api/devices/:id', description: 'Device detail with metrics and health.', requiresAuth: true, relatedTables: ['devices', 'readings'] },
        { method: 'POST', path: '/api/devices', description: 'Enroll a device.', requiresAuth: true, relatedTables: ['devices'] },
        { method: 'POST', path: '/api/devices/:id/actions', description: 'Queue a device action (reboot, firmware).', requiresAuth: true, relatedTables: ['devices', 'audit_events'] },
      ]},
      { name: 'Ingest', description: 'Telemetry pipeline.', endpoints: [
        { method: 'POST', path: '/api/ingest', description: 'Device push endpoint (MQTT bridge or HTTP batch).', requiresAuth: false, relatedTables: ['readings', 'devices'] },
        { method: 'GET', path: '/api/readings', description: 'Queried readings for charts.', requiresAuth: true, relatedTables: ['readings'] },
      ]},
      { name: 'Alerts', description: 'Threshold detection and triage.', endpoints: [
        { method: 'GET', path: '/api/alerts', description: 'Alerts by status and severity.', requiresAuth: true, relatedTables: ['alerts'] },
        { method: 'PATCH', path: '/api/alerts/:id', description: 'Acknowledge or resolve.', requiresAuth: true, relatedTables: ['alerts'] },
        { method: 'POST', path: '/api/alert-rules', description: 'Create a rule.', requiresAuth: true, relatedTables: ['alert_rules'] },
        { method: 'POST', path: '/api/alert-rules/test', description: 'Dry-run a rule against historical readings.', requiresAuth: true, relatedTables: ['alert_rules', 'readings'] },
      ]},
      { name: 'Dashboards', description: 'User views.', endpoints: [
        { method: 'GET', path: '/api/dashboards', description: 'Dashboards owned by the caller.', requiresAuth: true, relatedTables: ['dashboards'] },
        { method: 'GET', path: '/api/dashboards/:id', description: 'Dashboard definition with widgets. Owner-scoped.', requiresAuth: true, relatedTables: ['dashboards'] },
        { method: 'PUT', path: '/api/dashboards/:id', description: 'Save widget layout. Owner-scoped.', requiresAuth: true, relatedTables: ['dashboards'] },
      ]},
      { name: 'Firmware', description: 'OTA lifecycle.', endpoints: [
        { method: 'GET', path: '/api/firmware', description: 'Versions per device type.', requiresAuth: true, relatedTables: ['firmware_versions'] },
        { method: 'POST', path: '/api/firmware', description: 'Upload a candidate version.', requiresAuth: true, relatedTables: ['firmware_versions'] },
      ]},
      { name: 'Sites', description: 'Location and type management. Admin.', endpoints: [
        { method: 'GET', path: '/api/sites', description: 'Sites with device counts. Admin only.', requiresAuth: true, relatedTables: ['sites', 'devices'] },
        { method: 'POST', path: '/api/sites', description: 'Register a site. Admin only.', requiresAuth: true, relatedTables: ['sites'] },
        { method: 'POST', path: '/api/device-types', description: 'Add a device type. Admin only.', requiresAuth: true, relatedTables: ['device_types'] },
      ]},
    ],
  },

  // ── AI tool ───────────────────────────────────────────────────────────────
  'ai-tool': {
    domain: 'ai-tool',
    label: 'AI product',
    problemStatement:
      'An AI product is only as good as its guardrails: prompts drift, costs compound, and outputs are non-deterministic. The platform needs to wrap the model in structure — prompts, history, evaluation and rate limits.',
    targetUsers: ['End users of the AI feature', 'Developers building on the platform', 'Operators monitoring quality and cost'],
    goals: [
      'Make the model produce predictable, reusable outputs',
      'Track every run for cost, quality and debugging',
      'Gate access and usage so spend stays controlled',
    ],
    tables: [
      { name: 'prompts', description: 'Versioned prompt templates.', fields: [PK, fk('userId', '__users__', 'Owner (nullable: system prompts)'), col('name', 'varchar', 'Prompt name'), col('description', 'text', 'What it powers'), col('template', 'text', 'Prompt with {{placeholders}}'), col('model', 'varchar', 'Default model id'), col('version', 'integer', 'Incrementing version', { defaultValue: '1' }), col('isActive', 'boolean', 'Current production version', { defaultValue: 'true' }), col('createdAt', 'timestamp', 'Created time')] },
      { name: 'generations', description: 'One row per model call.', fields: [PK, fk('userId', '__users__'), fk('promptId', 'prompts', 'Prompt version used (nullable)'), col('input', 'text', 'User input or payload'), col('output', 'text', 'Model response'), col('model', 'varchar', 'Model id used'), col('inputTokens', 'integer', 'Billable input tokens'), col('outputTokens', 'integer', 'Billable output tokens'), col('costUsd', 'decimal', 'Computed cost'), col('latencyMs', 'integer', 'Wall time'), col('status', 'varchar', 'succeeded | failed | flagged'), col('createdAt', 'timestamp', 'Call time')] },
      { name: 'documents', description: 'Knowledge source for retrieval.', fields: [PK, fk('userId', '__users__'), col('title', 'varchar', 'Document title'), col('content', 'text', 'Text content'), col('sourceUrl', 'text', 'Origin link (nullable)'), col('chunkCount', 'integer', 'Indexed chunk total'), col('indexStatus', 'varchar', 'queued | indexed | failed'), col('createdAt', 'timestamp', 'Uploaded time')] },
      { name: 'datasets', description: 'Evaluation and fine-tune corpora.', fields: [PK, fk('userId', '__users__'), col('name', 'varchar', 'Dataset name'), col('description', 'text', 'What it measures'), col('rows', 'text', 'JSON array of examples'), col('createdAt', 'timestamp', 'Created time')] },
      { name: 'api_keys', description: 'Platform access keys for external developers.', fields: [PK, fk('userId', '__users__'), col('name', 'varchar', 'Key label'), col('keyHash', 'varchar', 'SHA-256 of the key, never the key itself'), col('prefix', 'varchar', 'Visible prefix for identification'), col('quotaPerMonth', 'integer', 'Request allowance (nullable)'), col('usedThisMonth', 'integer', 'Request counter'), col('lastUsedAt', 'timestamp', 'Last auth (nullable)'), col('revokedAt', 'timestamp', 'Revocation time (nullable)'), col('createdAt', 'timestamp', 'Issued time')] },
      { name: 'usage_records', description: 'Per-key or per-user billing rows.', fields: [PK, fk('userId', '__users__'), fk('apiKeyId', 'api_keys', 'Key attribution (nullable)'), col('endpoint', 'varchar', 'Which AI endpoint'), col('tokens', 'integer', 'Token total'), col('costUsd', 'decimal', 'Cost total'), col('occurredAt', 'timestamp', 'Usage time')] },
      { name: 'evaluations', description: 'Scheduled quality checks of a prompt.', fields: [PK, fk('promptId', 'prompts'), fk('datasetId', 'datasets'), col('score', 'decimal', 'Average score 0–1'), col('passRate', 'decimal', 'Fraction passing threshold'), col('latencyP95', 'integer', 'p95 latency (ms)'), col('status', 'varchar', 'running | completed | failed'), col('startedAt', 'timestamp', 'Run start'), col('completedAt', 'timestamp', 'Run end (nullable)'), col('createdAt', 'timestamp', 'Scheduled time')] },
      { name: 'flagged_outputs', description: 'Outputs held for human review.', fields: [PK, fk('generationId', 'generations'), col('reason', 'varchar', 'policy | low_confidence | toxicity | user_flag'), col('reviewerId', 'uuid', 'Who decided (nullable)', { isForeign: true }), col('decision', 'varchar', 'released | blocked | edited'), col('note', 'text', 'Reviewer note (nullable)'), col('createdAt', 'timestamp', 'Flagged time')] },
    ],
    pages: [
      { name: 'Playground', route: '/playground', purpose: 'Compose a prompt, run it, compare outputs.', components: ['PromptEditor', 'ParameterPanel', 'OutputPane', 'RunButton', 'HistorySidebar'], userActions: ['Run generation', 'Try parameters', 'Save as prompt'], apis: ['POST /api/generate', 'GET /api/generations'], entities: ['prompts', 'generations'], isProtected: true },
      { name: 'Prompts', route: '/prompts', purpose: 'Manage versioned prompt templates.', components: ['PromptTable', 'VersionHistory', 'EditorModal'], userActions: ['Create', 'Version', 'Activate'], apis: ['POST /api/prompts', 'PUT /api/prompts/:id'], entities: ['prompts'], isProtected: true },
      { name: 'Docs & Retrieval', route: '/documents', purpose: 'Upload and index knowledge sources.', components: ['UploadDropzone', 'DocumentTable', 'ChunkStatus'], userActions: ['Upload', 'Reindex', 'Remove'], apis: ['POST /api/documents', 'GET /api/documents'], entities: ['documents'], isProtected: true },
      { name: 'Evaluations', route: '/evaluations', purpose: 'Run dataset-based quality checks.', components: ['EvalCard', 'ScoreChart', 'RunModal', 'FailureList'], userActions: ['Run evaluation', 'Compare scores'], apis: ['POST /api/evaluations', 'GET /api/evaluations'], entities: ['evaluations', 'datasets'], isProtected: true },
      { name: 'Usage & Billing', route: '/usage', purpose: 'Token spend, latency and key quotas.', components: ['CostChart', 'TokenTable', 'ApiKeyManager'], userActions: ['Create key', 'Revoke key'], apis: ['GET /api/usage', 'POST /api/api-keys'], entities: ['usage_records', 'api_keys'], isProtected: true },
      { name: 'Moderation Queue', route: '/admin/moderation', purpose: 'Human review of flagged outputs.', components: ['FlaggedList', 'InputOutputPair', 'DecisionButtons'], userActions: ['Release', 'Block', 'Edit'], apis: ['GET /api/admin/flagged', 'PATCH /api/admin/flagged/:id'], entities: ['flagged_outputs', 'generations'], isProtected: true },
    ],
    coreFeatures: [
      { title: 'Prompt management', description: 'Versioned templates with activation history and placeholders.' },
      { title: 'Generation tracking', description: 'Every call logged with tokens, cost and latency.' },
      { title: 'Retrieval (RAG)', description: 'Index uploaded documents and ground answers in them.' },
      { title: 'Evaluation runs', description: 'Ding datasets against prompts with pass rates.' },
      { title: 'Usage controls', description: 'API keys with quotas and per-key spend attribution.' },
    ],
    futureFeatures: [
      { title: 'Fine-tuning', description: 'Train custom models on organised datasets.' },
      { title: 'Streaming responses', description: 'Token-level streaming with caching.' },
      { title: 'Team workspaces', description: 'Shared prompts and evaluations.' },
      { title: 'Model routing', description: 'Auto-select model per task with fallbacks.' },
    ],
    apiGroups: [
      { name: 'Generation', description: 'The model call surface.', endpoints: [
        { method: 'POST', path: '/api/generate', description: 'Run a generation from prompt + input. Rate-limited.', requiresAuth: true, relatedTables: ['generations', 'prompts'] },
        { method: 'GET', path: '/api/generations', description: 'Recent runs with cost and latency.', requiresAuth: true, relatedTables: ['generations'] },
        { method: 'GET', path: '/api/generations/:id', description: 'A run\'s full input/output. Owner-scoped.', requiresAuth: true, relatedTables: ['generations'] },
      ]},
      { name: 'Prompts', description: 'Template lifecycle.', endpoints: [
        { method: 'POST', path: '/api/prompts', description: 'Create a prompt template.', requiresAuth: true, relatedTables: ['prompts'] },
        { method: 'PUT', path: '/api/prompts/:id', description: 'New version or activation. Owner-scoped.', requiresAuth: true, relatedTables: ['prompts'] },
        { method: 'GET', path: '/api/prompts', description: 'Templates owned or shared with the caller.', requiresAuth: true, relatedTables: ['prompts'] },
      ]},
      { name: 'Retrieval', description: 'Document indexing.', endpoints: [
        { method: 'POST', path: '/api/documents', description: 'Upload a document for indexing.', requiresAuth: true, relatedTables: ['documents'] },
        { method: 'GET', path: '/api/documents', description: 'Indexed documents with status.', requiresAuth: true, relatedTables: ['documents'] },
        { method: 'DELETE', path: '/api/documents/:id', description: 'Remove indexing. Owner-scoped.', requiresAuth: true, relatedTables: ['documents'] },
      ]},
      { name: 'Evaluations', description: 'Quality runs.', endpoints: [
        { method: 'POST', path: '/api/evaluations', description: 'Queue an evaluation run.', requiresAuth: true, relatedTables: ['evaluations', 'datasets'] },
        { method: 'GET', path: '/api/evaluations', description: 'History with scores.', requiresAuth: true, relatedTables: ['evaluations'] },
      ]},
      { name: 'Usage', description: 'Keys and spend.', endpoints: [
        { method: 'GET', path: '/api/usage', description: 'Token and cost aggregation by day/endpoint.', requiresAuth: true, relatedTables: ['usage_records'] },
        { method: 'POST', path: '/api/api-keys', description: 'Issue an API key (returned once).', requiresAuth: true, relatedTables: ['api_keys'] },
        { method: 'DELETE', path: '/api/api-keys/:id', description: 'Revoke a key.', requiresAuth: true, relatedTables: ['api_keys'] },
      ]},
      { name: 'Moderation', description: 'Flagged output review.', endpoints: [
        { method: 'GET', path: '/api/admin/flagged', description: 'Flagged outputs awaiting decision.', requiresAuth: true, relatedTables: ['flagged_outputs'] },
        { method: 'PATCH', path: '/api/admin/flagged/:id', description: 'Release, block or edit.', requiresAuth: true, relatedTables: ['flagged_outputs', 'generations'] },
      ]},
    ],
  },
};

export function getBlueprint(domain: DomainKey): Blueprint | undefined {
  if (domain === 'generic') return undefined;
  return BLUEPRINTS[domain];
}
