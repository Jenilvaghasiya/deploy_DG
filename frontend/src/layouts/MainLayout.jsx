import { Header } from "../components/Common/Header/Header";

export default function MainLayout({ children }) {
  return (
    <>
      <Header headerClass={'fixed top-0 left-0 z-50 w-full bg-transparent'} />
      <main className="min-h-screen bg-black text-white">
        {children}
      </main>
    </>
  );
}