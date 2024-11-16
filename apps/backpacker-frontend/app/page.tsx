import Image from "next/image";

export default function Home() {
  return (
    <div className="">
      
    </div>
  );
}

"use client"
import React, { useState } from 'react';
import Image from "next/image";
import Picture from "../assets/Ghibmove.png";
import Navbar from '@/components/UI/navbar';

export default function Home() {
  return (
    
    <div className="flex bg-white flex-col items-center justify-start w-full  min-h-screen px-4 py-6">
     <Navbar/>
      <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-[80%] mt-8 gap-8">
        <div className="flex flex-col gap-5 w-full md:w-[60%] text-center md:text-left">
          <h1 className="text-4xl md:text-7xl text-black font-bold">
            Pack your <span className="text-[#6495ED]">Bags</span>
          </h1>
          <h2 className="text-3xl md:text-5xl text-black font-bold">
            Built for travelers <span className="text-[#6495ED]">by travelers</span>
          </h2>
          <p className="text-lg md:text-xl text-black font-bold">
            Dynamic offers a suite of tools for effortless log in, wallet creation and user management. 
            Designed for users. Built for developers.
          </p>
          <div className="flex flex-col md:flex-row gap-4 md:gap-10 items-center">
            <button className="w-full md:w-auto bg-white border border-[#6495ED] shadow-lg text-[#6495ED] px-4 py-2 rounded-md font-medium hover:bg-[#6495ED] hover:text-white transition duration-150 ease-in-out">
              <span className="text-lg md:text-xl font-bold">Get started</span>
            </button>
            <button className="w-full md:w-auto bg-white border border-gray-400 shadow-lg text-black px-4 py-2 rounded-md font-medium hover:text-[#6495ED] transition duration-150 ease-in-out hover:border-[#6495ED]">
              <span className="text-lg md:text-xl font-bold">View Live Demo</span>
            </button>
          </div>
        </div>

      
        <div className="w-full md:w-auto mt-8 md:mt-0">
          <Image 
            src={Picture} 
            alt="picture"
            width={600}
            height={600}
          />
        </div>
      </div>
    </div>
  );
}
