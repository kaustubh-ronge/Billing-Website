import { checkUser } from "@/lib/checkUser";
import HeaderClient from "./HeaderClient";

export default async function Header() {
  // Sync user securely on the server
  const user = await checkUser();

  // Serialize exactly what the client needs
  const serializedUser = user ? {
    role: user.role,
    shopName: user.shop?.businessName,
  } : null;

  return <HeaderClient user={serializedUser} />;
}