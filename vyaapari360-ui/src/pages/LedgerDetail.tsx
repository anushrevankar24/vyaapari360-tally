import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  BookOpen, 
  DollarSign,
  FileText,
  User,
  MapPin,
  CreditCard,
  Building
} from 'lucide-react';
import { ledgerApi } from '../services/api';
import { LedgerDetails } from '../types';

const LedgerDetail: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [ledgerDetails, setLedgerDetails] = useState<LedgerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    fromDate: '2020-04-01',
    toDate: '2025-03-31'
  });

  useEffect(() => {
    if (name) {
      fetchLedgerDetails();
    }
  }, [name, dateRange]);

  const fetchLedgerDetails = async () => {
    try {
      setLoading(true);
      const data = await ledgerApi.getByName(decodeURIComponent(name!), dateRange);
      setLedgerDetails(data);
    } catch (error) {
      console.error('Error fetching ledger details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatAmountWithBlank = (amount: number) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '';
    }
    return formatAmount(amount);
  };

  const handleVoucherClick = (voucherGuid: string) => {
    navigate(`/vouchers/${voucherGuid}`);
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!ledgerDetails) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Ledger not found</h2>
        <p className="mt-2 text-gray-600">The requested ledger could not be found.</p>
        <Link
          to="/ledgers"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Ledgers
        </Link>
      </div>
    );
  }

  const { ledger, openingBalance, closingBalance, transactions } = ledgerDetails;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/ledgers"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Ledgers
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <BookOpen className="h-8 w-8 mr-3" />
              {ledger.name}
            </h1>
            <p className="mt-2 text-gray-600">
              Ledger account details and transaction history
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              ledger.primary_group === 'Assets' ? 'bg-green-100 text-green-800' :
              ledger.primary_group === 'Liabilities' ? 'bg-red-100 text-red-800' :
              ledger.primary_group === 'Income' ? 'bg-blue-100 text-blue-800' :
              ledger.primary_group === 'Expenses' ? 'bg-orange-100 text-orange-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {ledger.primary_group}
            </span>
            
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              ledger.is_revenue ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {ledger.is_revenue ? 'Revenue' : 'Non-Revenue'}
            </span>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Date Range</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={dateRange.fromDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, fromDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={dateRange.toDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, toDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Ledger Information */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Ledger Information</h2>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center">
              <BookOpen className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-500">Group</p>
                <p className="text-sm text-gray-900">{ledger.parent}</p>
              </div>
            </div>
            
            {ledger.alias && (
              <div className="flex items-center">
                <User className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Alias</p>
                  <p className="text-sm text-gray-900">{ledger.alias}</p>
                </div>
              </div>
            )}
            
            {ledger.gstn && (
              <div className="flex items-center">
                <Building className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">GSTN</p>
                  <p className="text-sm text-gray-900">{ledger.gstn}</p>
                </div>
              </div>
            )}
            
            {ledger.bank_account_number && (
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Bank Account</p>
                  <p className="text-sm text-gray-900">{ledger.bank_account_number}</p>
                </div>
              </div>
            )}
            
            {ledger.email && (
              <div className="flex items-center">
                <User className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-sm text-gray-900">{ledger.email}</p>
                </div>
              </div>
            )}
            
            {ledger.mailing_address && (
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <p className="text-sm text-gray-900">{ledger.mailing_address}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Balance Summary */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 rounded-md bg-blue-500">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Opening Balance
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {formatAmountWithBlank(openingBalance)}
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
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Closing Balance
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {formatAmountWithBlank(closingBalance)}
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
                  <FileText className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Transactions
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {transactions.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Transaction History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Voucher
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Other Ledgers
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Debit
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credit
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Narration
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction, index) => (
                <tr 
                  key={index} 
                  onClick={() => handleVoucherClick(transaction.voucher_guid)}
                  className="hover:bg-blue-50 cursor-pointer transition-colors duration-150 group"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      {formatDate(transaction.date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {transaction.voucher_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {transaction.voucher_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                    {transaction.other_ledgers || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {transaction.debit > 0 ? formatAmountWithBlank(transaction.debit) : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {transaction.credit > 0 ? formatAmountWithBlank(transaction.credit) : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                    {formatAmountWithBlank(transaction.balance)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {transaction.narration}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LedgerDetail;

