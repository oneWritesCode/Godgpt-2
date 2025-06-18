import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const headersList = await headers();

    // Get session from Better Auth
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session?.user) {
      console.log('No session found for upload');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('User authenticated for upload:', session.user.id);

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('File received:', file.name, file.type, file.size);

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `File type ${file.type} not supported. Allowed types: ${allowedTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log('Uploading to Cloudinary...');

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto', // Automatically detect file type
          folder: 'chat-uploads', // Organize uploads in a folder
          use_filename: true,
          unique_filename: true,
          overwrite: false,
          transformation: file.type.startsWith('image/') ? [
            { quality: 'auto' }, // Auto optimize quality
            { fetch_format: 'auto' } // Auto convert to best format
          ] : undefined,
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('Cloudinary upload success:', result?.public_id);
            resolve(result);
          }
        }
      ).end(buffer);
    });

    const uploadResult = result as any;

    const response = {
      url: uploadResult.secure_url,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadId: uploadResult.public_id,
      width: uploadResult.width,
      height: uploadResult.height,
    };

    console.log('Upload successful:', response.url);
    console.log('response:', response);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}