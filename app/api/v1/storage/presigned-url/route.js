import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@supabase/supabase-js";

// Cloudflare R2 Credentials validation
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "baithak-media";
const r2PublicUrl = process.env.NEXT_PUBLIC_R2_URL || `https://pub-${accountId}.r2.dev`;

let s3Client = null;

if (accountId && accessKeyId && secretAccessKey) {
  try {
    s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    });
  } catch (err) {
    console.error("Failed to initialize Cloudflare R2 client:", err);
  }
} else {
  console.warn("Cloudflare R2 storage credentials are missing in server environment.");
}

export async function GET(request) {
  // 1. Authenticate request using Supabase access token
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return Response.json(
      { error: "Unauthorized: Missing authorization bearer token." },
      { status: 401 }
    );
  }

  const token = authHeader.split(" ")[1];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return Response.json(
      { error: "Internal Server Error: Supabase server environment configuration is missing." },
      { status: 500 }
    );
  }

  const supabaseServerClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error: authError } = await supabaseServerClient.auth.getUser(token);

  if (authError || !user) {
    return Response.json(
      { error: `Unauthorized: ${authError?.message || "Invalid or expired session token."}` },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");
  const contentType = searchParams.get("content_type");

  if (!s3Client) {
    return Response.json(
      { error: "Cloudflare R2 storage credentials are not configured on the server." },
      { status: 500 }
    );
  }

  if (!filename || !contentType) {
    return Response.json(
      { error: "Missing required query parameters: filename or content_type" },
      { status: 400 }
    );
  }

  if (!contentType.startsWith("image/") && !contentType.startsWith("video/")) {
    return Response.json(
      { error: "Forbidden: Only image and video files are allowed." },
      { status: 403 }
    );
  }

  const expectedAvatarPrefix = `users/${user.id}/avatars/`;
  const expectedCoverPrefix = `users/${user.id}/covers/`;
  const expectedMediaPrefix = `users/${user.id}/posts/`;
  if (!filename.startsWith(expectedAvatarPrefix) && !filename.startsWith(expectedCoverPrefix) && !filename.startsWith(expectedMediaPrefix)) {
    return Response.json(
      { error: "Forbidden: Invalid upload directory or prefix." },
      { status: 403 }
    );
  }

  try {
    // Generate pre-signed PUT URL
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: filename,
      ContentType: contentType,
    });

    // Signed URL expires in 1 hour (3600 seconds)
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    const publicUrl = `${r2PublicUrl.replace(/\/$/, "")}/${filename.replace(/^\//, "")}`;

    return Response.json({
      presigned_url: presignedUrl,
      public_url: publicUrl,
      filename: filename,
    });
  } catch (error) {
    console.error("Error generating Cloudflare R2 presigned URL:", error);
    return Response.json(
      { error: `Internal Server Error: ${error.message}` },
      { status: 500 }
    );
  }
}
