import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign,
  FileText,
  BookOpen,
  Package,
  Calendar,
  Download
} from 'lucide-react';
import { masterApi } from '../services/api';
import { DashboardStats } from '../types';

const Reports: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await masterApi.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const reportCards = [
    {
      title: 'Trial Balance',
      description: 'View trial balance report with all ledger balances',
      icon: BarChart3,
      color: 'bg-blue-500',
      href: '/reports/trial-balance',
      available: true
    },
    {
      title: 'Profit & Loss',
      description: 'Income and expense statement for the period',
      icon: TrendingUp,
      color: 'bg-green-500',
      href: '/reports/profit-loss',
      available: true
    },
    {
      title: 'Balance Sheet',
      description: 'Assets, liabilities and equity statement',
      icon: DollarSign,
      color: 'bg-purple-500',
      href: '/reports/balance-sheet',
      available: true
    },
    {
      title: 'Account Ledger',
      description: 'Individual ledger account statements',
      icon: BookOpen,
      color: 'bg-orange-500',
      href: '/reports/account-ledger',
      available: true
    },
    {
      title: 'Sales Register',
      description: 'Sales transaction summary and details',
      icon: FileText,
      color: 'bg-red-500',
      href: '/reports/sales-register',
      available: true
    },
    {
      title: 'Purchase Register',
      description: 'Purchase transaction summary and details',
      icon: Package,
      color: 'bg-indigo-500',
      href: '/reports/purchase-register',
      available: true
    },
    {
      title: 'Daily Cash Movement',
      description: 'Cash and bank transaction summary',
      icon: Calendar,
      color: 'bg-pink-500',
      href: '/reports/daily-cash-movement',
      available: true
    },
    {
      title: 'Bills Receivable',
      description: 'Outstanding bills receivable report',
      icon: FileText,
      color: 'bg-yellow-500',
      href: '/reports/bills-receivable',
      available: true
    },
    {
      title: 'Bills Payable',
      description: 'Outstanding bills payable report',
      icon: FileText,
      color: 'bg-teal-500',
      href: '/reports/bills-payable',
      available: true
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="mt-2 text-gray-600">
          Generate and view various financial and accounting reports
        </p>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 rounded-md bg-blue-500">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Vouchers
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {stats.total_vouchers.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 rounded-md bg-green-500">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Ledgers
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {stats.total_ledgers.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 rounded-md bg-purple-500">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Today's Vouchers
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {stats.today_vouchers.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 rounded-md bg-orange-500">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      This Month
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {stats.month_vouchers.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {reportCards.map((report) => (
          <div
            key={report.title}
            className={`bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow ${
              !report.available ? 'opacity-50' : 'cursor-pointer'
            }`}
            onClick={() => report.available && window.open(report.href, '_blank')}
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-md ${report.color}`}>
                    <report.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    {report.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {report.description}
                  </p>
                </div>
                {report.available && (
                  <div className="flex-shrink-0">
                    <Download className="h-5 w-5 text-gray-400" />
                  </div>
                )}
              </div>
              
              {report.available && (
                <div className="mt-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Available
                  </span>
                </div>
              )}
              
              {!report.available && (
                <div className="mt-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Coming Soon
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Report Generation Info */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <BarChart3 className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Report Generation
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Reports are generated in real-time from your Tally database. 
                You can filter reports by date range, ledger groups, and other criteria.
                All reports can be exported to PDF or Excel format.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;

