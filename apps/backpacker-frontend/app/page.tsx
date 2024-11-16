"use client"
import React, { useState } from 'react';
import Image from "next/image";
import Logo from "../assets/Logo.png";
import Picture from "../assets/Ghibmove.png";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="flex bg-white flex-col items-center justify-start w-full min-h-screen px-4 py-6">
      {/* Navbar */}
      <nav className="bg-transparent w-full max-w-[80%] p-5">
        <div className="mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <div className="flex-shrink-0">
              <Image 
                src={Logo} 
                alt="logo" 
                height={150} 
                width={150}
                className="w-auto h-auto"
              />
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-4">
              <a
                href="/"
                className="text-gray-800 hover:text-[#6495ED] px-3 py-2 rounded-md font-bold text-lg"
              >
                Product
              </a>
              <a
                href="/"
                className="text-gray-800 hover:text-[#6495ED] px-3 py-2 rounded-md font-bold text-lg"
              >
                About
              </a>
              <a
                href="/about"
                className="text-gray-800 hover:text-[#6495ED] px-3 py-2 rounded-md font-bold text-lg"
              >
                Company
              </a>
            </div>

            {/* Desktop Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <button className="bg-white border border-[#6495ED] text-[#6495ED] px-4 py-2 rounded-md text-sm font-medium hover:bg-[#6495ED] hover:text-white transition duration-150 ease-in-out">
                Login
              </button>
              <button className="bg-[#6495ED] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-white hover:text-[#6495ED] hover:border hover:border-[#6495ED] transition duration-150 ease-in-out">
                Live Demo
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-800 hover:text-[#6495ED] focus:outline-none p-2"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  // Close (X) icon
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  // Menu (hamburger) icon
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <a
                  href="/"
                  className="block text-gray-800 hover:text-[#6495ED] px-3 py-2 rounded-md text-base font-bold"
                >
                  Product
                </a>
                <a
                  href="/"
                  className="block text-gray-800 hover:text-[#6495ED] px-3 py-2 rounded-md text-base font-bold"
                >
                  About
                </a>
                <a
                  href="/about"
                  className="block text-gray-800 hover:text-[#6495ED] px-3 py-2 rounded-md text-base font-bold"
                >
                  Company
                </a>
                <div className="flex flex-col space-y-2 pt-2">
                  <button className="bg-white border border-[#6495ED] text-[#6495ED] px-4 py-2 rounded-md text-sm font-medium hover:bg-[#6495ED] hover:text-white transition duration-150 ease-in-out">
                    Login
                  </button>
                  <button className="bg-[#6495ED] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-white hover:text-[#6495ED] hover:border hover:border-[#6495ED] transition duration-150 ease-in-out">
                    Live Demo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-[80%] mt-8 gap-8">
        {/* Text Content */}
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

        {/* Image */}
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