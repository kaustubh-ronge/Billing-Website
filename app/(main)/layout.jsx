import Header from "@/components/HeaderComponents/Header";
import Footer from "@/components/FooterComponents/Footer";

export default function PublicLayout({ children }) {
  return (
    <>
      <Header />
      <div className="min-h-[calc(100vh-200px)]">{children}</div>
      <Footer />
    </>
  );
}
