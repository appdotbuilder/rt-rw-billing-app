
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AdminDashboard } from './components/AdminDashboard';
import { ClientDashboard } from './components/ClientDashboard';
import { Settings, Users, Wifi } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState<'admin' | 'client'>('admin');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wifi className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">RT/RW Net Billing 🌐</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={currentView === 'admin' ? 'default' : 'outline'}
                onClick={() => setCurrentView('admin')}
                className="flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>Admin</span>
              </Button>
              <Button
                variant={currentView === 'client' ? 'default' : 'outline'}
                onClick={() => setCurrentView('client')}
                className="flex items-center space-x-2"
              >
                <Users className="h-4 w-4" />
                <span>Client</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {currentView === 'admin' ? (
          <AdminDashboard onViewClient={(customerId: number) => {
            setSelectedCustomerId(customerId);
            setCurrentView('client');
          }} />
        ) : (
          <ClientDashboard 
            customerId={selectedCustomerId} 
            onBackToAdmin={() => setCurrentView('admin')}
          />
        )}
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-gray-600">
            <p>RT/RW Net Billing System - Managing your internet services with ease 📡</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
