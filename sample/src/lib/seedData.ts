/**
 * Realistic Sri Lankan gem-market seed data.
 *
 * Every record carries `seeded: true` so the admin panel and the reseed routine
 * can identify and clear seeded content without touching real user data.
 * Images live in /public/seed and are served at /seed/* in dev and production.
 *
 * `hoursAgo` is converted to a Firestore Timestamp at write time so the seeded
 * content interleaves correctly with real (serverTimestamp) content in ordered
 * queries.
 */

export interface SeedUser {
  uid: string;
  displayName: string;
  contactNumber: string;
  phone: string;
  photoURL: string;
  role: 'USER' | 'VENDOR' | 'ADMIN';
  bio?: string;
  followersCount: number;
  followingCount: number;
  following: string[];
  hoursAgo: number;
  seeded: true;
}

export interface SeedVendor {
  id: string;
  userId: string;
  companyName: string;
  logo: string;
  coverImage: string;
  description: string;
  location: string;
  rating: number;
  reviewCount: number;
  followersCount: number;
  verified: boolean;
  verificationLevel: 'NONE' | 'NIC' | 'BLUE' | 'GREEN' | 'GOLD';
  contactEmail: string;
  phone: string;
  website?: string;
  hoursAgo: number;
  seeded: true;
}

export interface SeedListing {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  status: 'ACTIVE' | 'SOLD' | 'PENDING';
  featured?: boolean;
  hoursAgo: number;
  seeded: true;
}

export interface SeedPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorType: 'USER' | 'VENDOR';
  content: string;
  media: string[];
  likesCount: number;
  likes: string[];
  ratingsCount: number;
  averageRating: number;
  commentsCount: number;
  sharesCount: number;
  type: 'DISCUSSION' | 'STORY' | 'NEWS' | 'EVENT';
  category?: string;
  hoursAgo: number;
  seeded: true;
}

const img = (name: string) => `/seed/${name}`;

// ---------------------------------------------------------------------------
// VENDORS (5) — each is also a user account with role VENDOR
// ---------------------------------------------------------------------------
export const SEED_VENDORS: SeedVendor[] = [
  {
    id: 'seed-v1', userId: 'seed-v1',
    companyName: 'Shirzad Gems',
    logo: img('profile-1.jpg'), coverImage: img('feed-1.jpg'),
    description: 'Third-generation Ceylon sapphire specialists based in Beruwala. Unheated blue and yellow sapphires with lab certification on request.',
    location: 'Beruwala', rating: 4.9, reviewCount: 132, followersCount: 4820,
    verified: true, verificationLevel: 'GOLD',
    contactEmail: 'nabeel@shirzadgems.lk', phone: '+94 77 555 0111', website: 'https://shirzadgems.lk',
    hoursAgo: 720, seeded: true,
  },
  {
    id: 'seed-v2', userId: 'seed-v2',
    companyName: 'Saidy Gems',
    logo: img('profile-8.jpg'), coverImage: img('feed-17.jpg'),
    description: 'Ratnapura-based dealer offering natural yellow sapphire, chrysoberyl and cat\'s eye direct from the mines.',
    location: 'Ratnapura', rating: 4.8, reviewCount: 96, followersCount: 3110,
    verified: true, verificationLevel: 'GOLD',
    contactEmail: 'sumith@saidygems.lk', phone: '+94 71 234 5678', website: 'https://saidygems.lk',
    hoursAgo: 700, seeded: true,
  },
  {
    id: 'seed-v3', userId: 'seed-v3',
    companyName: 'Ceyaura Gems',
    logo: img('profile-6.jpg'), coverImage: img('feed-4.jpg'),
    description: 'Colombo showroom specialising in fine blue sapphire, spinel and rare collector stones. Guild & GRS certified.',
    location: 'Colombo', rating: 4.7, reviewCount: 74, followersCount: 2540,
    verified: true, verificationLevel: 'BLUE',
    contactEmail: 'tashen@ceyaura.lk', phone: '+94 76 700 4321', website: 'https://ceyaura.lk',
    hoursAgo: 690, seeded: true,
  },
  {
    id: 'seed-v4', userId: 'seed-v4',
    companyName: 'Tharu Gems by La Ceylon',
    logo: img('profile-3.jpg'), coverImage: img('feed-11.jpg'),
    description: 'Natural unheated spinel, garnet and emerald. Handpicked rough cut in-house at Ratnapura.',
    location: 'Ratnapura', rating: 4.8, reviewCount: 58, followersCount: 1980,
    verified: true, verificationLevel: 'GREEN',
    contactEmail: 'prabath@tharugems.lk', phone: '+94 75 117 3901',
    hoursAgo: 680, seeded: true,
  },
  {
    id: 'seed-v5', userId: 'seed-v5',
    companyName: 'Pelawatta Gems',
    logo: img('profile-4.jpg'), coverImage: img('feed-6.jpg'),
    description: 'Elahera mine-to-market dealer. Blue sapphire, moonstone and zircon at wholesale rates.',
    location: 'Elahera', rating: 4.6, reviewCount: 41, followersCount: 1420,
    verified: true, verificationLevel: 'BLUE',
    contactEmail: 'kavinda@pelawattagems.lk', phone: '+94 78 909 8877',
    hoursAgo: 670, seeded: true,
  },
];

// ---------------------------------------------------------------------------
// USERS (10) — individual collectors / buyers
// ---------------------------------------------------------------------------
export const SEED_USERS: SeedUser[] = [
  { uid: 'seed-u1', displayName: 'Lakshantha Gunathilaka', contactNumber: '+94770001001', phone: '+94770001001', photoURL: img('profile-2.jpg'), role: 'USER', bio: 'Gem enthusiast & collector, Colombo', followersCount: 210, followingCount: 180, following: ['seed-v1', 'seed-v2'], hoursAgo: 600, seeded: true },
  { uid: 'seed-u2', displayName: 'Dananjaya Dilshan', contactNumber: '+94770001002', phone: '+94770001002', photoURL: img('profile-5.jpg'), role: 'USER', bio: 'Sapphire lover from Ratnapura', followersCount: 340, followingCount: 90, following: ['seed-v4'], hoursAgo: 590, seeded: true },
  { uid: 'seed-u3', displayName: 'Thakashi Anthony', contactNumber: '+94770001003', phone: '+94770001003', photoURL: img('profile-7.jpg'), role: 'USER', bio: 'Buyer • Negombo', followersCount: 88, followingCount: 120, following: ['seed-v3'], hoursAgo: 580, seeded: true },
  { uid: 'seed-u4', displayName: 'Nuwan Jayasuriya', contactNumber: '+94770001004', phone: '+94770001004', photoURL: img('profile-2.jpg'), role: 'USER', bio: 'Jewellery designer', followersCount: 150, followingCount: 200, following: ['seed-v1', 'seed-v5'], hoursAgo: 560, seeded: true },
  { uid: 'seed-u5', displayName: 'Chamara Wickramasinghe', contactNumber: '+94770001005', phone: '+94770001005', photoURL: img('profile-5.jpg'), role: 'USER', bio: 'Collector of rare spinels', followersCount: 420, followingCount: 60, following: ['seed-v4', 'seed-v2'], hoursAgo: 540, seeded: true },
  { uid: 'seed-u6', displayName: 'Ishara Fernando', contactNumber: '+94770001006', phone: '+94770001006', photoURL: img('profile-7.jpg'), role: 'USER', bio: 'Gemmology student', followersCount: 66, followingCount: 140, following: ['seed-v1'], hoursAgo: 520, seeded: true },
  { uid: 'seed-u7', displayName: 'Ruwan Ekanayake', contactNumber: '+94770001007', phone: '+94770001007', photoURL: img('profile-1.jpg'), role: 'USER', bio: 'Ring & pendant maker, Kandy', followersCount: 190, followingCount: 110, following: ['seed-v3', 'seed-v5'], hoursAgo: 500, seeded: true },
  { uid: 'seed-u8', displayName: 'Dilhani Rajapaksa', contactNumber: '+94770001008', phone: '+94770001008', photoURL: img('profile-6.jpg'), role: 'USER', bio: 'Loves padparadscha 💛🧡', followersCount: 275, followingCount: 95, following: ['seed-v2'], hoursAgo: 470, seeded: true },
  { uid: 'seed-u9', displayName: 'Amila Senanayake', contactNumber: '+94770001009', phone: '+94770001009', photoURL: img('profile-3.jpg'), role: 'USER', bio: 'Exporter • Beruwala', followersCount: 510, followingCount: 70, following: ['seed-v1', 'seed-v4'], hoursAgo: 440, seeded: true },
  { uid: 'seed-u10', displayName: 'Saidy Roshan', contactNumber: '+94770001010', phone: '+94770001010', photoURL: img('profile-8.jpg'), role: 'USER', bio: 'Weekend gem hunter', followersCount: 130, followingCount: 160, following: ['seed-v5', 'seed-v3'], hoursAgo: 410, seeded: true },
];

// ---------------------------------------------------------------------------
// LISTINGS (6) — LKR pricing, multi-image galleries
// ---------------------------------------------------------------------------
export const SEED_LISTINGS: SeedListing[] = [
  {
    id: 'seed-l1', vendorId: 'seed-v2',
    title: 'Natural Unheated Yellow Sapphire 3.05 CT',
    description: 'Gemstone: Natural Yellow Sapphire\nOrigin: Ceylon (Sri Lanka)\nCarat Weight: 3.05\nShape: Oval\nCutting Style: Mixed\nColour: Yellow\nClarity: VS\nTreatment: None (Unheated)\nCertificate: On request',
    price: 285000, currency: 'LKR',
    images: [img('listing-1-1.jpg'), img('listing-1-2.jpg'), img('listing-1-3.jpg')],
    status: 'ACTIVE', featured: true, hoursAgo: 120, seeded: true,
  },
  {
    id: 'seed-l2', vendorId: 'seed-v4',
    title: 'Natural Rhodolite Garnet 4.20 CT — Vivid Purple',
    description: 'Beautiful colour, clarity and lustre. Natural unheated rhodolite garnet with a vivid purplish-red hue. Oval mixed cut.\nWeight: 4.20 CRT\nOrigin: Sri Lanka\nTreatment: None',
    price: 68000, currency: 'LKR',
    images: [img('listing-2-1.jpg'), img('listing-2-2.jpg')],
    status: 'ACTIVE', hoursAgo: 96, seeded: true,
  },
  {
    id: 'seed-l3', vendorId: 'seed-v1',
    title: 'Guild Certified Natural Unheated Blue Sapphire 5.64 CT',
    description: 'Guild certified natural unheated Ceylon blue sapphire. Excellent royal blue saturation with outstanding lustre.\nWeight: 5.64 CT\nShape: Oval\nOrigin: Sri Lanka\nTreatment: None (Unheated)\nCertificate: Guild Laboratory',
    price: 1250000, currency: 'LKR',
    images: [img('listing-3-1.jpg'), img('listing-3-2.jpg'), img('listing-3-3.jpg'), img('listing-3-4.jpg')],
    status: 'ACTIVE', featured: true, hoursAgo: 72, seeded: true,
  },
  {
    id: 'seed-l4', vendorId: 'seed-v5',
    title: 'Natural White Zircon 1.85 CT — Colourless Brilliance',
    description: 'Natural colourless zircon with exceptional fire and brilliance. Emerald cut.\nWeight: 1.85 CT\nOrigin: Sri Lanka\nTreatment: None',
    price: 22000, currency: 'LKR',
    images: [img('listing-4-1.jpg'), img('listing-4-2.jpg')],
    status: 'ACTIVE', hoursAgo: 48, seeded: true,
  },
  {
    id: 'seed-l5', vendorId: 'seed-v3',
    title: 'Natural Sky Blue Topaz 12.20 CT',
    description: 'Large natural sky-blue topaz, eye clean with a vivid electric-blue tone. Oval cut, ideal centre stone.\nWeight: 12.20 CT\nOrigin: Sri Lanka',
    price: 95000, currency: 'LKR',
    images: [img('listing-5-1.jpg')],
    status: 'ACTIVE', hoursAgo: 30, seeded: true,
  },
  {
    id: 'seed-l6', vendorId: 'seed-v2',
    title: 'Natural Chrysoberyl 1.00 CT — Clean Gemstone',
    description: 'Natural chrysoberyl gemstone, clean and bright honey-gold colour.\nWeight: 1.00 CT\nOrigin: Ratnapura, Sri Lanka\nTreatment: None',
    price: 160000, currency: 'LKR',
    images: [img('listing-6-1.jpg')],
    status: 'ACTIVE', hoursAgo: 12, seeded: true,
  },
];

// ---------------------------------------------------------------------------
// POSTS (12) — real market-style captions (Sinhala + English)
// ---------------------------------------------------------------------------
const HEAT_POST = `ඔබ මිලදී ගන්න කැමති Heated Blue Sapphire මැණිකක්ද? නැතිනම් Unheated Blue Sapphire මැණිකක්ද?

ගොඩාක් අය Sapphire එකක් ගන්නකොට අහන්නේ කැරට් ගාන සහ පාට ගැන විතරයි. හැබැයි වටිනාකමට බලපාන තවත් වැදගත් කාරණයක් තියෙනවා — ඒ තමයි Heat Treatment.

බොහෝ Sapphire මැණික් වල වර්ණය සහ පැහැදිලිභාවය වැඩි කිරීමට Heat Treatment භාවිතා කරනවා. Heat කරනවා කියන්නෙත් Natural Treatment එකක්ම තමයි.

නමුත් Unheated Sapphire කියන්නේ කිසිදු Heat Treatment එකක් නොකළ, ස්වභාවික තත්ත්වයෙන්ම පවතින මැණිකක්. ඒ නිසාම ලොව පුරා collectors ලා Unheated Sapphire වලට විශේෂ වටිනාකමක් දෙනවා.

ඔබ තෝරන්නේ මොකක්ද? Comment එකේ ලියන්න 👇`;

export const SEED_POSTS: SeedPost[] = [
  { id: 'seed-p1', authorId: 'seed-v1', authorName: 'Shirzad Gems', authorAvatar: img('profile-1.jpg'), authorType: 'VENDOR', content: HEAT_POST, media: [img('feed-1.jpg')], likesCount: 342, likes: [], ratingsCount: 40, averageRating: 4.9, commentsCount: 56, sharesCount: 22, type: 'DISCUSSION', category: 'Education', hoursAgo: 110, seeded: true },
  { id: 'seed-p2', authorId: 'seed-v2', authorName: 'Saidy Gems', authorAvatar: img('profile-8.jpg'), authorType: 'VENDOR', content: 'ලස්සන පුෂ්පරාග ගලක් ඕනිද? 💛\nNatural Unheated Yellow Sapphire gemstone.\nAvailable for sale — DM for price.', media: [img('feed-2.jpg')], likesCount: 188, likes: [], ratingsCount: 20, averageRating: 4.8, commentsCount: 24, sharesCount: 9, type: 'STORY', hoursAgo: 96, seeded: true },
  { id: 'seed-p3', authorId: 'seed-v4', authorName: 'Tharu Gems by La Ceylon', authorAvatar: img('profile-3.jpg'), authorType: 'VENDOR', content: 'Beautiful colour, clarity and lustre 🔥\nA masterpiece — Mahenge Spinel 3 CRT\nNatural Unheated Smokey Spinel.', media: [img('feed-5.jpg')], likesCount: 271, likes: [], ratingsCount: 30, averageRating: 4.9, commentsCount: 33, sharesCount: 14, type: 'STORY', hoursAgo: 80, seeded: true },
  { id: 'seed-p4', authorId: 'seed-v3', authorName: 'Ceyaura Gems', authorAvatar: img('profile-6.jpg'), authorType: 'VENDOR', content: 'සුබ උදෑසනක් හැමෝටම…. Available for Sale ✨\nNatural Sphene Gemstone.\nWeight is 2.77 CRTs\nDimension is 8.58 x 8.55 x 5.82 mm', media: [img('feed-6.jpg')], likesCount: 143, likes: [], ratingsCount: 18, averageRating: 4.7, commentsCount: 19, sharesCount: 6, type: 'STORY', hoursAgo: 64, seeded: true },
  { id: 'seed-p5', authorId: 'seed-u1', authorName: 'Lakshantha Gunathilaka', authorAvatar: img('profile-2.jpg'), authorType: 'USER', content: 'Gewuda sapphire 💙\n20 CT\n30000/=\nLoop balanna puluvan. Interested aya DM karanna.', media: [img('feed-7.jpg')], likesCount: 96, likes: [], ratingsCount: 8, averageRating: 4.5, commentsCount: 21, sharesCount: 3, type: 'DISCUSSION', hoursAgo: 52, seeded: true },
  { id: 'seed-p6', authorId: 'seed-v1', authorName: 'Shirzad Gems', authorAvatar: img('profile-1.jpg'), authorType: 'VENDOR', content: 'Natural Yellow Sapphire\nOrigin: Ceylon (Sri Lanka)\nCarat Weight: 18.74\nShape: Oval\nCutting Style: Mixed\nColour: Yellow\nClarity: SI\nTreatment: None\nCertificate: On request', media: [img('feed-8.jpg')], likesCount: 209, likes: [], ratingsCount: 25, averageRating: 4.9, commentsCount: 28, sharesCount: 11, type: 'STORY', hoursAgo: 44, seeded: true },
  { id: 'seed-p7', authorId: 'seed-v5', authorName: 'Pelawatta Gems', authorAvatar: img('profile-4.jpg'), authorType: 'VENDOR', content: 'Fresh from Elahera 💎 A stunning natural blue sapphire with vivid cornflower colour. Certificate available on request.', media: [img('feed-9.jpg')], likesCount: 156, likes: [], ratingsCount: 16, averageRating: 4.6, commentsCount: 17, sharesCount: 5, type: 'STORY', hoursAgo: 36, seeded: true },
  { id: 'seed-p8', authorId: 'seed-u2', authorName: 'Dananjaya Dilshan', authorAvatar: img('profile-5.jpg'), authorType: 'USER', content: 'Today\'s find — a gorgeous rhodolite garnet with amazing purple fire under sunlight 😍 Ratnapura never disappoints.', media: [img('feed-10.jpg')], likesCount: 128, likes: [], ratingsCount: 10, averageRating: 4.7, commentsCount: 22, sharesCount: 4, type: 'DISCUSSION', hoursAgo: 28, seeded: true },
  { id: 'seed-p9', authorId: 'seed-v4', authorName: 'Tharu Gems by La Ceylon', authorAvatar: img('profile-3.jpg'), authorType: 'VENDOR', content: 'Emerald parcel just in 🟢 Natural beryl, various sizes, ideal for calibrated jewellery lots. Wholesale rates for bulk.', media: [img('feed-13.jpg')], likesCount: 174, likes: [], ratingsCount: 19, averageRating: 4.8, commentsCount: 15, sharesCount: 8, type: 'STORY', hoursAgo: 20, seeded: true },
  { id: 'seed-p10', authorId: 'seed-u3', authorName: 'Thakashi Anthony', authorAvatar: img('profile-7.jpg'), authorType: 'USER', content: 'Weighed in at 12.20 ct! This sky-blue topaz is a monster 🔵 Anyone know a good cutter in Colombo for a re-polish?', media: [img('feed-14.jpg')], likesCount: 84, likes: [], ratingsCount: 6, averageRating: 4.4, commentsCount: 26, sharesCount: 2, type: 'DISCUSSION', hoursAgo: 14, seeded: true },
  { id: 'seed-p11', authorId: 'seed-u8', authorName: 'Dilhani Rajapaksa', authorAvatar: img('profile-6.jpg'), authorType: 'USER', content: 'Vivid pink ruby under the light 🌸 saving up for this one. Ceylon rubies are so underrated!', media: [img('feed-18.jpg')], likesCount: 112, likes: [], ratingsCount: 9, averageRating: 4.6, commentsCount: 18, sharesCount: 5, type: 'DISCUSSION', hoursAgo: 8, seeded: true },
  { id: 'seed-p12', authorId: 'seed-u5', authorName: 'Chamara Wickramasinghe', authorAvatar: img('profile-5.jpg'), authorType: 'USER', content: 'Question for the dealers here — how are you all pricing unheated vs heated blue sapphire this season? Market feels strong 📈', media: [img('feed-4.jpg')], likesCount: 67, likes: [], ratingsCount: 5, averageRating: 4.3, commentsCount: 31, sharesCount: 1, type: 'DISCUSSION', hoursAgo: 4, seeded: true },
];

export const SEED_COLLECTIONS = ['users', 'vendors', 'listings', 'posts', 'comments', 'reviews', 'conversations'] as const;
