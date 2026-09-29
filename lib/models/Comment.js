import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    slug:        { type: String, required: true, index: true },
    userId:      { type: String, required: true },
    displayName: { type: String, required: true },
    photoURL:    { type: String, default: '' },
    isPremium:   { type: Boolean, default: false },
    isAdmin:     { type: Boolean, default: false },
    totalReadingMinutes: { type: Number, default: 0 },
    text:        { type: String, required: true, maxlength: 2000 },
    createdAt:   { type: Date, default: Date.now },
});

// Hapus cache model agar schema terbaru selalu dipakai di Next.js dev mode
if (mongoose.models['Comment']) {
    delete mongoose.models['Comment'];
}

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
