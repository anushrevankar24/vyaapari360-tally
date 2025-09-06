import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Vouchers from './pages/Vouchers';
import VoucherDetail from './pages/VoucherDetail';
import Ledgers from './pages/Ledgers';
import LedgerDetail from './pages/LedgerDetail';
import MasterDataManagement from './pages/MasterDataManagement';
import Reports from './pages/Reports';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vouchers" element={<Vouchers />} />
          <Route path="/vouchers/:guid" element={<VoucherDetail />} />
          <Route path="/ledgers" element={<Ledgers />} />
          <Route path="/ledgers/:name" element={<LedgerDetail />} />
          <Route path="/master-data" element={<MasterDataManagement />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;