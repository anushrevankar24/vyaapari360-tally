import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  BookOpen, 
  Database, 
  Package,
  TrendingUp,
  Calendar,
  DollarSign
} from 'lucide-react';
import { masterApi } from '../services/api';
import { DashboardStats } from '../types';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await masterApi.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Vouchers',
      value: stats?.total_vouchers || 0,
      icon: FileText,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Total Ledgers',
      value: stats?.total_ledgers || 0,
      icon: BookOpen,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Account Groups',
      value: stats?.total_groups || 0,
      icon: Database,
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      title: 'Stock Items',
      value: stats?.total_stock_items || 0,
      icon: Package,
      color: 'bg-orange-500',
      textColor: 'text-orange-600'
    },
    {
      title: "Today's Vouchers",
      value: stats?.today_vouchers || 0,
      icon: Calendar,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600'
    },
    {
      title: 'This Month',
      value: stats?.month_vouchers || 0,
      icon: TrendingUp,
      color: 'bg-pink-500',
      textColor: 'text-pink-600'
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Overview of your Tally database and recent activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-md ${stat.color}`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.title}
                    </dt>
                    <dd className="text-3xl font-bold text-gray-900">
                      {stat.value.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <a
            href="/vouchers"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">View Vouchers</h3>
                <p className="text-sm text-gray-500">Browse all transactions</p>
              </div>
            </div>
          </a>

          <a
            href="/ledgers"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">View Ledgers</h3>
                <p className="text-sm text-gray-500">Check account balances</p>
              </div>
            </div>
          </a>

          <a
            href="/reports"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Reports</h3>
                <p className="text-sm text-gray-500">Financial reports</p>
              </div>
            </div>
          </a>

          <a
            href="/master-data"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="flex items-center">
              <Database className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Master Data</h3>
                <p className="text-sm text-gray-500">Groups and types</p>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

