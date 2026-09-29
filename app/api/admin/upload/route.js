import { NextResponse } from 'next/server';
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { isAdminUID } from '@/lib/admin';

export const dynamic = 'force-dynamic';

const s3 = new AWS.S3({
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    region: 'auto',
    signatureVersion: 'v4',
});

export async function POST(request) {
    const adminUid = request.headers.get('x-admin-uid');
    if (!adminUid || !isAdminUID(adminUid)) {
        return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Allowed: jpeg, png, webp, gif' }, { status: 400 });
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return NextResponse.json({ error: 'File too large. Max 5MB' }, { status: 400 });
        }

        const ext = file.name.split('.').pop().toLowerCase();
        const fileName = `covers/${uuidv4()}.${ext}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        await s3.putObject({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: fileName,
            Body: buffer,
            ContentType: file.type,
            CacheControl: 'public, max-age=31536000',
        }).promise();

        const publicUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

        return NextResponse.json({ url: publicUrl });
    } catch (err) {
        console.error('R2 upload error:', err);
        return NextResponse.json({ error: 'Upload failed: ' + err.message }, { status: 500 });
    }
}
