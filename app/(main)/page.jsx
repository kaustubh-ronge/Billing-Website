import Hero from '@/components/HeroComponents/Hero';
import { checkUser } from "@/lib/checkUser";
import { db } from "@/lib/prisma";
import React from 'react';

const Home = async () => {
  const user = await checkUser();
  
  const [totalBusinesses, totalInvoices] = await Promise.all([
    db.shop.count(),
    db.invoice.count()
  ]);
  
  return (
    <Hero 
      systemRole={user?.systemRole} 
      totalBusinesses={totalBusinesses} 
      totalInvoices={totalInvoices} 
    />
  );
}

export default Home;
