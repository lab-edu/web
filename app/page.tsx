import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const cookieStore = await cookies();
  const hasLoginCookie = Boolean(cookieStore.get("lab_edu_token")?.value);

  redirect(hasLoginCookie ? "/dashboard" : "/login");
}
