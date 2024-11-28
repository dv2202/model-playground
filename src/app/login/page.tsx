'use client';

import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation'; 
import Spinner from '../components/Spinner/Spinner'; 
import { Bot } from 'lucide-react';
import { FaGoogle } from "react-icons/fa";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  // const handleClick = async() => {
  //   const result = await signIn("google");

  //   if (result?.error) {
  //     console.error("Google sign-in failed", result.error);
  
  //   } else {
  //     console.log("Sign-in successful, redirecting...");
  //   }
  // };

  useEffect(() => {
    if (session) {
      router.push('/');
    }
  }, [session, router]);

  return (
    <div className="flex h-screen bg-[#232323] text-white">
      {/* Left Section */}
      <div className="w-[60%] flex flex-col items-center justify-center">
        <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-lg">
                <Bot className="w-8 h-8 text-white" />
        </div>
          <h1 className="text-3xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400">AI Playground</h1>
        </div>
        <h2 className="md:text-4xl sm:text-sm text-gray-600 dark:text-gray-300 mt-1 text-center">
            Experiment with cutting-edge  <br /> AI models
        </h2>
      </div>

      {/* Right Section */}
      <div className="w-[40%] flex flex-col pr-[10px] items-center justify-center rounded-md">
        <div className="bg-[#161616] rounded-md h-[95%] w-full flex flex-col items-center justify-center">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Welcome Back</h2>
            <p className="text-gray-400 mt-2">Let's sign in to continue</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center mt-10">
              <Spinner />
              <span className="ml-3">Signing in...</span>
            </div>
          ) : (
            <button
            onClick={()=>signIn("google")}
              className="flex items-center gap-3 px-6 py-3 mt-10 bg-white text-black rounded-lg shadow-lg hover:bg-gray-300 transition"
            >
                <FaGoogle />
              <span>Continue with Google</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
