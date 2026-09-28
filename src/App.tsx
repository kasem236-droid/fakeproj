/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ExitModal } from './components/ExitModal';
import { HomeSearchScreen } from './components/home/HomeSearchScreen';
import { CustomersScreen } from './components/customers/CustomersScreen';
import { PurchasesScreen } from './components/purchases/PurchasesScreen';
import { ExternalTransfersScreen } from './components/transfers/ExternalTransfersScreen';
import { TreasuryScreen } from './components/treasury/TreasuryScreen';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { CustomerDetailModal } from './components/customers/CustomerDetailModal';

const MainScreen: React.FC = () => {
  const { activeTab, selectedCustomerForDetail, setSelectedCustomerForDetail } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Top Application Bar */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 w-full overflow-x-hidden">
        {activeTab === 'home' && <HomeSearchScreen />}
        {activeTab === 'customers' && <CustomersScreen />}
        {activeTab === 'purchases' && <PurchasesScreen />}
        {activeTab === 'external_transfers' && <ExternalTransfersScreen />}
        {activeTab === 'treasury' && <TreasuryScreen />}
        {activeTab === 'settings' && <SettingsScreen />}
      </main>

      {/* Detail Modal for Customer */}
      {selectedCustomerForDetail && (
        <CustomerDetailModal
          customer={selectedCustomerForDetail}
          onClose={() => setSelectedCustomerForDetail(null)}
        />
      )}

      {/* Bottom Android Navigation */}
      <BottomNav />

      {/* App Exit Modal */}
      <ExitModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainScreen />
    </AppProvider>
  );
}
