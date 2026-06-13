import Header from "@/components/HeaderComponents/Header";

export default function PublicLayout({ children }) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}
