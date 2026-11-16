import "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    subscription_tier?: string;
    allowed_wards?: string;
    allowed_galis?: string;
  }

  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      subscription_tier?: string;
      allowed_wards?: string;
      allowed_galis?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    subscription_tier?: string;
    allowed_wards?: string;
    allowed_galis?: string;
  }
}

