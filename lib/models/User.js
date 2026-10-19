import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    title: String,
    message: String,
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const historySchema = new mongoose.Schema({
    type: String,
    slug: String,
    title: String,
    thumb: String,
    lastChapterTitle: String,
    lastChapterSlug: String,
    lastRead: { type: Date, default: Date.now }
});

const librarySchema = new mongoose.Schema({
    slug: { type: String, required: true },
    mangaData: { type: mongoose.Schema.Types.Mixed },
    addedAt: { type: Date, default: Date.now }
});

const pendingPremiumOrderSchema = new mongoose.Schema({
    orderId:          { type: String, required: true },
    days:             { type: Number, required: true },
    amount:           { type: Number, required: true },
    label:            { type: String, default: 'Paket Premium' },
    status:           { type: String, enum: ['pending', 'approved', 'paid', 'expired'], default: 'pending' },
    approvedAt:       { type: Date, default: null },
    createdAt:        { type: Date, default: Date.now },
    telegramChatId:   { type: String, default: null },  // Chat ID user Telegram untuk notif
    telegramUsername: { type: String, default: null },  // Username user untuk referensi admin
    trx_reference:    { type: String, default: null },  // WijayaPay internal reference (WPTRXXXXXNN)
    expiredAt:        { type: Date,   default: null },  // Waktu expired QR dari WijayaPay
});

const userSchema = new mongoose.Schema({
    googleId: String,
    email: String,
    displayName: String,
    photoURL: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 100 },
    isAdmin: { type: Boolean, default: false },
    isPremium: { type: Boolean, default: false },
    premiumUntil: { type: Date, default: null },
    hasUsedTrial: { type: Boolean, default: false },
    pendingPremiumOrders: { type: [pendingPremiumOrderSchema], default: [] },
    coins:   { type: Number, default: 0 },   // Loyalty koin — +20 per aktivasi premium
    totalReadingMinutes: { type: Number, default: 0 },
    dailyDownloads: {
        date: { type: String, default: "" },
        count: { type: Number, default: 0 }
    },
    downloadCount: { type: Number, default: 0 },
    lastDownloadDate: { type: Date, default: Date.now },
    notifications: [notificationSchema],
    history: [historySchema],
    library: [librarySchema],
    anilist: {
        accessToken: { type: String, default: null },
        userId: { type: Number, default: null },
        userName: { type: String, default: null },
        avatar: { type: String, default: null },
        connectedAt: { type: Date, default: null },
        autoSync: { type: Boolean, default: true },
    }
});

// Hapus model cache agar schema terbaru selalu dipakai (penting di Next.js dev mode)
if (mongoose.models['User']) {
    delete mongoose.models['User'];
}
const User = mongoose.model('User', userSchema);

export default User;
