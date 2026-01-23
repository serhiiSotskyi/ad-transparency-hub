import { Header } from "@/components/layout/Header";
import { Dashboard } from "@/components/dashboard/Dashboard";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <Dashboard />
      </main>
    </div>
  );
};

export default Index;
