/**
 * Initial catalog + homepage content, loaded by prisma/seed.ts.
 * Images point at /public placeholders until the client's Cloudinary media is uploaded.
 */

const sub = (id: string, name: string, slug: string) => ({ id, name, slug });

// Placeholder images reuse existing assets until the client shares category photography.
export const DUMMY_CATEGORIES = [
  {
    id: "cat-1", name: "Sarees", slug: "sarees", image: "/images/categories/sarees.jpg", productCount: 24,
    subcategories: [
      sub("sub-1-1", "Gaji Silk", "gaji-silk"),
      sub("sub-1-2", "Banarasi", "banarasi"),
      sub("sub-1-3", "Bandhej", "bandhej"),
      sub("sub-1-4", "Organza", "organza"),
      sub("sub-1-5", "Designer Sarees", "designer-sarees"),
    ],
  },
  {
    id: "cat-2", name: "Suits", slug: "suits", image: "/images/categories/suits.jpg", productCount: 21,
    subcategories: [
      sub("sub-2-1", "3-Piece Suits", "3-piece-suits"),
      sub("sub-2-2", "Anarkali", "anarkali"),
      sub("sub-2-3", "Designer Suits", "designer-suits"),
      sub("sub-2-4", "Festive Suits", "festive-suits"),
    ],
  },
  {
    id: "cat-3", name: "Lehengas", slug: "lehengas", image: "/images/categories/lehengas.jpg", productCount: 18,
    subcategories: [
      sub("sub-3-1", "Bridal Lehengas", "bridal-lehengas"),
      sub("sub-3-2", "Designer Lehengas", "designer-lehengas"),
      sub("sub-3-3", "Sider Lehengas", "sider-lehengas"),
    ],
  },
  {
    id: "cat-4", name: "Dresses / Custom Outfits", slug: "dresses-custom-outfits", image: "/images/categories/kurtis.jpg", productCount: 12,
    subcategories: [],
  },
  {
    id: "cat-5", name: "Jewellery", slug: "jewellery", image: "/images/categories/dupattas.jpg", productCount: 30,
    subcategories: [
      sub("sub-5-1", "Imitation Jewellery", "imitation-jewellery"),
      sub("sub-5-2", "One-Gram Jewellery", "one-gram-jewellery"),
      sub("sub-5-3", "Two-Gram Jewellery", "two-gram-jewellery"),
      sub("sub-5-4", "Rental Jewellery", "rental-jewellery"),
    ],
  },
  {
    id: "cat-6", name: "Bridal & Wedding", slug: "bridal-wedding", image: "/images/categories/anarkalis.jpg", productCount: 15,
    subcategories: [
      sub("sub-6-1", "Bridal Outfits", "bridal-outfits"),
      sub("sub-6-2", "Bridal Jewellery", "bridal-jewellery"),
      sub("sub-6-3", "Wedding Accessories", "wedding-accessories"),
    ],
  },
];

export const DUMMY_PRODUCTS = [
  {
    id: "prod-1",
    name: "Royal Banarasi Silk Saree",
    slug: "royal-banarasi-silk-saree",
    description: "A stunning red Banarasi silk saree with intricate gold zari embroidery. Perfect for weddings and festive occasions. The rich gold weaving on pure silk fabric makes this piece truly regal.",
    fabric: "Pure Banarasi Silk",
    careInstructions: "Dry clean only. Store in muslin cloth.",
    category: { id: "cat-1", name: "Sarees", slug: "sarees" },
    subcategory: { id: "sub-1-2", name: "Banarasi", slug: "banarasi" },
    basePrice: 8999,
    baseMrp: 14999,
    images: ["/images/products/saree-red.jpg"],
    isBestseller: true,
    isNewArrival: false,
    variants: [
      { id: "v1-1", sku: "GH-SAR-RED-FR", size: "Free Size", color: "Maroon", colorHex: "#722F37", price: 8999, mrp: 14999, stock: 12 },
    ],
  },
  {
    id: "prod-2",
    name: "Blush Pink Bridal Lehenga",
    slug: "blush-pink-bridal-lehenga",
    description: "An exquisite blush pink bridal lehenga with heavy gold and silver embroidery. This stunning piece features intricate zardozi work and comes with a matching choli and dupatta.",
    fabric: "Silk Organza with Net Dupatta",
    careInstructions: "Dry clean only. Handle with care.",
    category: { id: "cat-3", name: "Lehengas", slug: "lehengas" },
    subcategory: { id: "sub-3-1", name: "Bridal Lehengas", slug: "bridal-lehengas" },
    basePrice: 24999,
    baseMrp: 39999,
    images: ["/images/products/lehenga-pink.jpg"],
    isBestseller: true,
    isNewArrival: true,
    variants: [
      { id: "v2-1", sku: "GH-LEH-PNK-S", size: "S", color: "Blush Pink", colorHex: "#F2E4DB", price: 24999, mrp: 39999, stock: 5 },
      { id: "v2-2", sku: "GH-LEH-PNK-M", size: "M", color: "Blush Pink", colorHex: "#F2E4DB", price: 24999, mrp: 39999, stock: 8 },
      { id: "v2-3", sku: "GH-LEH-PNK-L", size: "L", color: "Blush Pink", colorHex: "#F2E4DB", price: 24999, mrp: 39999, stock: 3 },
    ],
  },
  {
    id: "prod-3",
    name: "Teal Embroidered Kurti",
    slug: "teal-embroidered-kurti",
    description: "An elegant teal green embroidered cotton kurti with gold thread work and delicate mirror work details. Perfect for casual outings and daily wear.",
    fabric: "Pure Cotton with Gold Thread Embroidery",
    careInstructions: "Machine wash cold. Do not bleach.",
    category: { id: "cat-4", name: "Dresses / Custom Outfits", slug: "dresses-custom-outfits" },
    subcategory: null,
    basePrice: 1999,
    baseMrp: 3499,
    images: ["/images/products/kurti-teal.jpg"],
    isBestseller: false,
    isNewArrival: true,
    variants: [
      { id: "v3-1", sku: "GH-KUR-TEL-S", size: "S", color: "Teal", colorHex: "#008080", price: 1999, mrp: 3499, stock: 20 },
      { id: "v3-2", sku: "GH-KUR-TEL-M", size: "M", color: "Teal", colorHex: "#008080", price: 1999, mrp: 3499, stock: 25 },
      { id: "v3-3", sku: "GH-KUR-TEL-L", size: "L", color: "Teal", colorHex: "#008080", price: 1999, mrp: 3499, stock: 18 },
      { id: "v3-4", sku: "GH-KUR-TEL-XL", size: "XL", color: "Teal", colorHex: "#008080", price: 1999, mrp: 3499, stock: 10 },
    ],
  },
  {
    id: "prod-4",
    name: "Navy Zardozi Anarkali",
    slug: "navy-zardozi-anarkali",
    description: "A gorgeous navy blue floor-length Anarkali gown with silver zardozi embroidery and a flowy net dupatta. An absolute showstopper for weddings and receptions.",
    fabric: "Georgette with Net Dupatta",
    careInstructions: "Dry clean only.",
    category: { id: "cat-2", name: "Suits", slug: "suits" },
    subcategory: { id: "sub-2-2", name: "Anarkali", slug: "anarkali" },
    basePrice: 12999,
    baseMrp: 19999,
    images: ["/images/products/anarkali-navy.jpg"],
    isBestseller: true,
    isNewArrival: false,
    variants: [
      { id: "v4-1", sku: "GH-ANK-NAV-S", size: "S", color: "Navy Blue", colorHex: "#1B2A4A", price: 12999, mrp: 19999, stock: 6 },
      { id: "v4-2", sku: "GH-ANK-NAV-M", size: "M", color: "Navy Blue", colorHex: "#1B2A4A", price: 12999, mrp: 19999, stock: 9 },
      { id: "v4-3", sku: "GH-ANK-NAV-L", size: "L", color: "Navy Blue", colorHex: "#1B2A4A", price: 12999, mrp: 19999, stock: 4 },
    ],
  },
  {
    id: "prod-5",
    name: "Peach Chikankari Suit Set",
    slug: "peach-chikankari-suit-set",
    description: "An elegant peach chikankari salwar suit set with matching dupatta. Featuring traditional Lucknowi white thread work on soft peach fabric for a graceful look.",
    fabric: "Pure Cotton with Chikankari Embroidery",
    careInstructions: "Hand wash in cold water. Do not wring.",
    category: { id: "cat-2", name: "Suits", slug: "suits" },
    subcategory: { id: "sub-2-1", name: "3-Piece Suits", slug: "3-piece-suits" },
    basePrice: 4499,
    baseMrp: 6999,
    images: ["/images/products/suit-peach.jpg"],
    isBestseller: false,
    isNewArrival: true,
    variants: [
      { id: "v5-1", sku: "GH-SUT-PCH-S", size: "S", color: "Peach", colorHex: "#FFDAB9", price: 4499, mrp: 6999, stock: 15 },
      { id: "v5-2", sku: "GH-SUT-PCH-M", size: "M", color: "Peach", colorHex: "#FFDAB9", price: 4499, mrp: 6999, stock: 20 },
      { id: "v5-3", sku: "GH-SUT-PCH-L", size: "L", color: "Peach", colorHex: "#FFDAB9", price: 4499, mrp: 6999, stock: 12 },
      { id: "v5-4", sku: "GH-SUT-PCH-XL", size: "XL", color: "Peach", colorHex: "#FFDAB9", price: 4499, mrp: 6999, stock: 8 },
    ],
  },
  {
    id: "prod-6",
    name: "Golden Silk Dupatta",
    slug: "golden-silk-dupatta",
    description: "A luxurious golden-beige silk dupatta with fine embroidery and sequin work. A versatile accessory that adds elegance to any outfit.",
    fabric: "Pure Silk with Zari Work",
    careInstructions: "Dry clean only.",
    category: { id: "cat-6", name: "Bridal & Wedding", slug: "bridal-wedding" },
    subcategory: { id: "sub-6-3", name: "Wedding Accessories", slug: "wedding-accessories" },
    basePrice: 2499,
    baseMrp: 4999,
    images: ["/images/products/dupatta-gold.jpg"],
    isBestseller: false,
    isNewArrival: true,
    variants: [
      { id: "v6-1", sku: "GH-DUP-GLD-FR", size: "Free Size", color: "Golden", colorHex: "#C5A55A", price: 2499, mrp: 4999, stock: 30 },
    ],
  },
  {
    id: "prod-7",
    name: "Emerald Paisley Silk Saree",
    slug: "emerald-paisley-silk-saree",
    description: "A stunning emerald green silk saree with gold border and traditional paisley motifs. Rich Kanjeevaram-style weaving that makes a statement at every occasion.",
    fabric: "Pure Silk with Zari Border",
    careInstructions: "Dry clean only. Store in muslin cloth.",
    category: { id: "cat-1", name: "Sarees", slug: "sarees" },
    subcategory: { id: "sub-1-5", name: "Designer Sarees", slug: "designer-sarees" },
    basePrice: 11999,
    baseMrp: 18999,
    images: ["/images/products/saree-green.jpg"],
    isBestseller: true,
    isNewArrival: true,
    variants: [
      { id: "v7-1", sku: "GH-SAR-GRN-FR", size: "Free Size", color: "Emerald Green", colorHex: "#50C878", price: 11999, mrp: 18999, stock: 7 },
    ],
  },
  {
    id: "prod-8",
    name: "Rose Gold Festive Lehenga",
    slug: "rose-gold-festive-lehenga",
    description: "A magnificent rose gold festive lehenga with intricate sequin and pearl embellishments. Perfect for sangeet, mehendi, and festive celebrations.",
    fabric: "Net with Satin Lining",
    careInstructions: "Dry clean only. Handle embellishments with care.",
    category: { id: "cat-3", name: "Lehengas", slug: "lehengas" },
    subcategory: { id: "sub-3-2", name: "Designer Lehengas", slug: "designer-lehengas" },
    basePrice: 18999,
    baseMrp: 29999,
    images: ["/images/products/lehenga-pink.jpg"],
    isBestseller: false,
    isNewArrival: true,
    variants: [
      { id: "v8-1", sku: "GH-LEH-RSG-S", size: "S", color: "Rose Gold", colorHex: "#B76E79", price: 18999, mrp: 29999, stock: 4 },
      { id: "v8-2", sku: "GH-LEH-RSG-M", size: "M", color: "Rose Gold", colorHex: "#B76E79", price: 18999, mrp: 29999, stock: 6 },
      { id: "v8-3", sku: "GH-LEH-RSG-L", size: "L", color: "Rose Gold", colorHex: "#B76E79", price: 18999, mrp: 29999, stock: 3 },
    ],
  },
];

// First slide carries the headline + CTAs; the rest are image-only (no ctaText) and link to ctaUrl.
export const HERO_SLIDES = [
  {
    imageUrl: "/images/hero/hero-1.jpg",
    heading: "Discover the Art of Tradition",
    subheading: "Shop New Arrivals & Explore Collections",
    ctaText: "Shop New Arrivals",
    ctaUrl: "/shop?sort=newest",
    secondaryCtaText: "Explore Collections",
    secondaryCtaUrl: "/shop",
  },
  { imageUrl: "/images/hero/hero-2.jpg", heading: "Banarasi Silk Saree", ctaUrl: "/category/sarees?sub=banarasi" },
  { imageUrl: "/images/hero/hero-3.jpg", heading: "Bridal Lehenga Collection", ctaUrl: "/category/lehengas?sub=bridal-lehengas" },
  { imageUrl: "/images/hero/hero-4.jpg", heading: "Anarkali Suits", ctaUrl: "/category/suits?sub=anarkali" },
];

export const DUMMY_TESTIMONIALS = [
  {
    id: "test-1",
    customerName: "Priya Sharma",
    review: "The Banarasi saree I ordered was absolutely stunning! The quality of silk and the intricate zari work exceeded my expectations. Received so many compliments at my sister's wedding.",
    rating: 5,
    productName: "Royal Banarasi Silk Saree",
  },
  {
    id: "test-2",
    customerName: "Ananya Patel",
    review: "I'm in love with my bridal lehenga from Ghero. The embroidery is exquisite and the fit was perfect. Kajal ji personally helped me customize the blouse. Highly recommend!",
    rating: 5,
    productName: "Blush Pink Bridal Lehenga",
  },
  {
    id: "test-3",
    customerName: "Meera Reddy",
    review: "Beautiful collection of kurtis! The chikankari work is authentic and the fabric quality is excellent. Fast delivery and great packaging too. Will definitely order again.",
    rating: 4,
    productName: "Teal Embroidered Kurti",
  },
  {
    id: "test-4",
    customerName: "Sneha Gupta",
    review: "The Anarkali gown was exactly as shown in the pictures. The navy color is so rich and the silver embroidery is gorgeous. Perfect for festive occasions.",
    rating: 5,
    productName: "Navy Zardozi Anarkali",
  },
];

export const DUMMY_REELS = [
  { id: "reel-1", image: "/images/reels/reel-1.jpg", caption: "Wedding Season Favorites", productSlug: "royal-banarasi-silk-saree" },
  { id: "reel-2", image: "/images/reels/reel-2.jpg", caption: "Bridal Collection 2026", productSlug: "blush-pink-bridal-lehenga" },
  { id: "reel-3", image: "/images/reels/reel-3.jpg", caption: "Festive Ready", productSlug: "navy-zardozi-anarkali" },
  { id: "reel-4", image: "/images/reels/reel-4.jpg", caption: "Everyday Elegance", productSlug: "teal-embroidered-kurti" },
];
