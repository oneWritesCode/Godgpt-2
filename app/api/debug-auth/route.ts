import { auth } from "@/lib/auth";

export async function GET() {
  return Response.json({
    message: "Auth debug",
    availableRoutes: {
      handler: typeof auth.handler,
      api: typeof auth.api,
    }
  });
}