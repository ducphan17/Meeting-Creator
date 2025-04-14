// "use client";

// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import Image from "next/image";
// import { Button } from "../components/ui/button";

// export default function Home() {
//   const router = useRouter();
//   const [isClient, setIsClient] = useState(false);

//   useEffect(() => {
//     setIsClient(true);
//   }, []);

//   const handleCreate = () => {
//     router.push("/create");
//   };

//   const handleJoin = () => {
//     router.push("/join");
//   };

//   return (
//     <main className="min-h-screen bg-[#2D2A40] text-white">
//       <nav className="p-4 flex justify-between items-center border-b border-gray-800">
//         <div className="text-lg font-medium">Home</div>
//         <div className="text-lg font-medium">Create Event</div>
//       </nav>

//       <div className="flex flex-col md:flex-row h-[calc(100vh-64px)]">
//         <div className="flex-1 p-8 flex flex-col justify-center items-center relative">
//           {isClient && (
//             <div className="absolute inset-0 z-0">
//               <Image
//                 src="/images/background.png"
//                 alt="Background"
//                 fill
//                 style={{ objectFit: "cover" }}
//                 priority
//               />
//             </div>
//           )}

//           <div className="z-10 text-center max-w-md">
//             <h1 className="text-5xl font-bold mb-4">Welcome to Meet Creator</h1>
//             <p className="text-xl mb-8">Please Create or Join an Event</p>

//             <div className="flex flex-col sm:flex-row gap-4 justify-center">
//               <Button
//                 onClick={handleCreate}
//                 className="px-12 py-6 text-lg rounded-full bg-gradient-to-r from-purple-600 to-blue-400 hover:from-purple-700 hover:to-blue-500"
//               >
//                 CREATE
//               </Button>
//               <Button
//                 onClick={handleJoin}
//                 className="px-12 py-6 text-lg rounded-full bg-gradient-to-r from-purple-600 to-blue-400 hover:from-purple-700 hover:to-blue-500"
//               >
//                 Join
//               </Button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </main>
//   );
// }

// app/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../components/ui/button";

export default function Home() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleCreate = () => {
    router.push("/create");
  };

  const handleJoin = () => {
    router.push("/join");
  };

  return (
    <main className="min-h-screen bg-[#2D2A40] text-white flex items-center justify-center">
      <div className="text-center max-w-md p-8">
        <h1 className="text-5xl font-bold mb-4">Welcome to Meet Creator</h1>
        <p className="text-xl mb-12">Please Create or Join an Event</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleCreate}
            className="px-12 py-4 text-lg rounded-full bg-purple-600 hover:bg-purple-700 uppercase font-semibold"
          >
            CREATE
          </Button>
          <Button
            onClick={handleJoin}
            className="px-12 py-4 text-lg rounded-full bg-purple-600 hover:bg-purple-700"
          >
            Join
          </Button>
        </div>
      </div>
    </main>
  );
}
