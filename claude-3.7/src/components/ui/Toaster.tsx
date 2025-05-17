// src/components/ui/Toaster.tsx
"use client"; // Toaster component from react-hot-toast is a client component

// This component simply re-exports the Toaster from react-hot-toast.
// You would then render this <Toaster /> component in your root layout or providers.
// This approach is common if you want all UI components, even re-exports,
// to live under `~/components/ui`.
export { Toaster } from "react-hot-toast";

// If you wanted to provide default props or a custom wrapper:
// import { Toaster as HotToaster } from "react-hot-toast";
//
// export const Toaster = () => {
//   return (
//     <HotToaster
//       position="top-right"
//       toastOptions={{
//         duration: 5000,
//         // Default styles can be set here
//         // style: {
//         //   background: '#333',
//         //   color: '#fff',
//         // },
//       }}
//     />
//   );
// };