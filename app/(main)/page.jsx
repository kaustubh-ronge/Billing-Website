import Hero from '@/components/HeroComponents/Hero';
import { checkUser } from "@/lib/checkUser";
import React from 'react'

const Home = async () => {
  const user = await checkUser();
  
  return(
    <Hero systemRole={user?.systemRole} />
  )
}

export default Home
