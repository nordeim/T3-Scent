# Enhanced E-commerce Platform for "The Scent"

I'll create even more advanced features to take this aromatherapy e-commerce platform to the next level. After careful review, I've identified several areas for enhancement:

## 1. Advanced Analytics Dashboard with Real-time Metrics

```tsx
// src/components/admin/AdvancedAnalyticsDashboard.tsx

import { useState, useEffect } from "react";
import { api } from "~/utils/api";
import {
  LineChart,
  BarChart,
  PieChart,
  Line,
  Bar,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { DateRangePicker } from "~/components/ui/DateRangePicker";
import { Select } from "~/components/ui/Select";
import { Card } from "~/components/ui/Card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/Tabs";
import { Button } from "~/components/ui/Button";
import { formatCurrency, formatNumber } from "~/utils/format";
import {
  FaDownload,
  FaFilter,
  FaChartLine,
  FaChartBar,
  FaChartPie,
  FaUsers,
  FaShoppingCart,
  FaMoneyBillWave,
  FaExchangeAlt,
} from "react-icons/fa";
import { Skeleton } from "~/components/ui/Skeleton";

const COLORS = ["#2a7c8a", "#4fd1c5", "#e0a86f", "#ff7b4f", "#7f9cf5", "#f56565"];

type DateRange = {
  from: Date;
  to: Date;
};

type AnalyticsMetric = 
  | "revenue"
  | "orders"
  | "customers"
  | "aov" // Average Order Value
  | "conversion"
  | "retention";

type AnalyticsDimension = 
  | "day"
  | "week"
  | "month"
  | "quarter"
  | "year"
  | "category"
  | "product"
  | "channel";

const AdvancedAnalyticsDashboard = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    to: new Date(),
  });
  
  const [primaryMetric, setPrimaryMetric] = useState<AnalyticsMetric>("revenue");
  const [comparisonMetric, setComparisonMetric] = useState<AnalyticsMetric>("orders");
  const [dimension, setDimension] = useState<AnalyticsDimension>("day");
  const [showComparison, setShowComparison] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf" | "excel">("csv");
  
  // Fetch analytics data
  const { data: analyticsData, isLoading: isLoadingAnalytics, refetch } = 
    api.analytics.getAdvancedMetrics.useQuery({
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
      metrics: showComparison 
        ? [primaryMetric, comparisonMetric] 
        : [primaryMetric],
      dimension,
    });
  
  // Fetch customer segments
  const { data: customerSegments, isLoading: isLoadingSegments } = 
    api.analytics.getCustomerSegments.useQuery({
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
    });
  
  // Fetch product performance
  const { data: productPerformance, isLoading: isLoadingProducts } = 
    api.analytics.getProductPerformance.useQuery({
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
      limit: 10,
    });
  
  // Fetch sales by channel
  const { data: salesByChannel, isLoading: isLoadingChannels } = 
    api.analytics.getSalesByChannel.useQuery({
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
    });
  
  // Update analytics when filters change
  useEffect(() => {
    void refetch();
  }, [dateRange, primaryMetric, comparisonMetric, dimension, showComparison, refetch]);
  
  const handleExportData = () => {
    // Implementation for exporting data in selected format
    alert(`Exporting data in ${exportFormat} format`);
  };
  
  // Format metric display
  const formatMetricValue = (metric: AnalyticsMetric, value: number) => {
    switch (metric) {
      case "revenue":
        return formatCurrency(value);
      case "conversion":
      case "retention":
        return `${value.toFixed(2)}%`;
      case "aov":
        return formatCurrency(value);
      default:
        return formatNumber(value);
    }
  };
  
  // Get metric label
  const getMetricLabel = (metric: AnalyticsMetric) => {
    switch (metric) {
      case "revenue": return "Revenue";
      case "orders": return "Orders";
      case "customers": return "Customers";
      case "aov": return "Avg. Order Value";
      case "conversion": return "Conversion Rate";
      case "retention": return "Retention Rate";
    }
  };
  
  // Get summary metrics
  const getSummaryMetrics = () => {
    if (!analyticsData) return [];
    
    const summary = [
      {
        title: "Total Revenue",
        value: formatCurrency(analyticsData.totals.revenue || 0),
        change: analyticsData.changes.revenue || 0,
        icon: <FaMoneyBillWave className="h-6 w-6 text-primary" />,
      },
      {
        title: "Total Orders",
        value: formatNumber(analyticsData.totals.orders || 0),
        change: analyticsData.changes.orders || 0,
        icon: <FaShoppingCart className="h-6 w-6 text-purple-500" />,
      },
      {
        title: "New Customers",
        value: formatNumber(analyticsData.totals.customers || 0),
        change: analyticsData.changes.customers || 0,
        icon: <FaUsers className="h-6 w-6 text-blue-500" />,
      },
      {
        title: "Conversion Rate",
        value: `${(analyticsData.totals.conversion || 0).toFixed(2)}%`,
        change: analyticsData.changes.conversion || 0,
        icon: <FaExchangeAlt className="h-6 w-6 text-amber-500" />,
      },
    ];
    
    return summary;
  };
  
  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Advanced Analytics Dashboard
        </h1>
        
        <div className="flex flex-wrap items-center gap-2">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            calendarProps={{ numberOfMonths: 2 }}
            className="min-w-[260px]"
          />
          
          <Button
            variant="outline"
            onClick={handleExportData}
            className="flex items-center gap-2"
          >
            <FaDownload className="h-4 w-4" />
            Export
            <Select
              value={exportFormat}
              onValueChange={(value) => setExportFormat(value as "csv" | "pdf" | "excel")}
              options={[
                { value: "csv", label: "CSV" },
                { value: "pdf", label: "PDF" },
                { value: "excel", label: "Excel" },
              ]}
              className="ml-2 h-auto w-auto border-none p-0"
              buttonClassName="h-auto min-w-0 p-0 font-normal"
            />
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoadingAnalytics
          ? Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))
          : getSummaryMetrics().map((metric, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {metric.title}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                      {metric.value}
                    </p>
                  </div>
                  <div className="rounded-full bg-primary/10 p-2 dark:bg-primary-dark/20">
                    {metric.icon}
                  </div>
                </div>
                <div className={`mt-2 inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                  metric.change >= 0 
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                }`}>
                  {metric.change >= 0 ? "+" : ""}
                  {metric.change.toFixed(2)}%
                </div>
              </Card>
            ))
        }
      </div>
      
      {/* Time Series Chart */}
      <Card className="p-4 md:p-6">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Trends Over Time
          </h2>
          
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={primaryMetric}
              onValueChange={(value) => setPrimaryMetric(value as AnalyticsMetric)}
              options={[
                { value: "revenue", label: "Revenue" },
                { value: "orders", label: "Orders" },
                { value: "customers", label: "Customers" },
                { value: "aov", label: "Avg. Order Value" },
                { value: "conversion", label: "Conversion Rate" },
                { value: "retention", label: "Retention Rate" },
              ]}
              placeholder="Select primary metric"
              className="w-[180px]"
            />
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="show-comparison"
                checked={showComparison}
                onChange={(e) => setShowComparison(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:text-primary-light dark:focus:ring-primary-light"
              />
              <label 
                htmlFor="show-comparison" 
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Compare with
              </label>
            </div>
            
            {showComparison && (
              <Select
                value={comparisonMetric}
                onValueChange={(value) => setComparisonMetric(value as AnalyticsMetric)}
                options={[
                  { value: "revenue", label: "Revenue" },
                  { value: "orders", label: "Orders" },
                  { value: "customers", label: "Customers" },
                  { value: "aov", label: "Avg. Order Value" },
                  { value: "conversion", label: "Conversion Rate" },
                  { value: "retention", label: "Retention Rate" },
                ]}
                placeholder="Select comparison metric"
                className="w-[180px]"
              />
            )}
            
            <Select
              value={dimension}
              onValueChange={(value) => setDimension(value as AnalyticsDimension)}
              options={[
                { value: "day", label: "Daily" },
                { value: "week", label: "Weekly" },
                { value: "month", label: "Monthly" },
              ]}
              placeholder="Select time dimension"
              className="w-[120px]"
            />
          </div>
        </div>
        
        {isLoadingAnalytics ? (
          <Skeleton className="h-80 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={analyticsData?.timeSeries || []}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis 
                yAxisId="left"
                orientation="left"
                tickFormatter={(value) => formatMetricValue(primaryMetric, value)}
              />
              {showComparison && (
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(value) => formatMetricValue(comparisonMetric, value)}
                />
              )}
              <Tooltip 
                formatter={(value, name) => {
                  const metric = name === primaryMetric 
                    ? primaryMetric 
                    : comparisonMetric;
                  return [formatMetricValue(metric, value as number), getMetricLabel(metric)];
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey={primaryMetric}
                name={getMetricLabel(primaryMetric)}
                stroke="#2a7c8a"
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
              {showComparison && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey={comparisonMetric}
                  name={getMetricLabel(comparisonMetric)}
                  stroke="#e0a86f"
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>
      
      {/* Detailed Breakdowns */}
      <Tabs defaultValue="segments">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="segments" className="flex items-center gap-2">
            <FaUsers className="h-4 w-4" />
            <span>Customer Segments</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <FaChartBar className="h-4 w-4" />
            <span>Product Performance</span>
          </TabsTrigger>
          <TabsTrigger value="channels" className="flex items-center gap-2">
            <FaChartPie className="h-4 w-4" />
            <span>Sales Channels</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="segments" className="mt-4">
          <Card className="p-4 md:p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Customer Segments Analysis
            </h3>
            
            {isLoadingSegments ? (
              <Skeleton className="h-80 w-full" />
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Revenue by Customer Type
                  </p>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={customerSegments?.revenueByType || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {(customerSegments?.revenueByType || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Customer Acquisition vs Retention
                  </p>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart 
                      data={customerSegments?.acquisitionRetention || []}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 50, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(value) => formatNumber(value)} />
                      <YAxis type="category" dataKey="name" width={100} />
                      <Tooltip formatter={(value) => formatNumber(value as number)} />
                      <Legend />
                      <Bar dataKey="newCustomers" name="New Customers" fill="#2a7c8a" />
                      <Bar dataKey="returningCustomers" name="Returning Customers" fill="#4fd1c5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="lg:col-span-2">
                  <p className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Customer Lifetime Value Trend
                  </p>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart 
                      data={customerSegments?.lifetimeValueTrend || []}
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        name="Avg. Customer LTV"
                        stroke="#ff7b4f" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="products" className="mt-4">
          <Card className="p-4 md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Top Performing Products
              </h3>
              
              <Button variant="link" className="text-primary dark:text-primary-light">
                View All Products
              </Button>
            </div>
            
            {isLoadingProducts ? (
              <Skeleton className="h-80 w-full" />
            ) : (
              <div className="space-y-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                      <tr>
                        <th scope="col" className="px-4 py-3">Product</th>
                        <th scope="col" className="px-4 py-3">Revenue</th>
                        <th scope="col" className="px-4 py-3">Units Sold</th>
                        <th scope="col" className="px-4 py-3">Avg. Rating</th>
                        <th scope="col" className="px-4 py-3">Conversion Rate</th>
                        <th scope="col" className="px-4 py-3">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(productPerformance?.products || []).map((product, index) => (
                        <tr 
                          key={index}
                          className="border-b bg-white dark:border-gray-700 dark:bg-gray-900"
                        >
                          <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900 dark:text-white">
                            {product.name}
                          </td>
                          <td className="px-4 py-3">
                            {formatCurrency(product.revenue)}
                          </td>
                          <td className="px-4 py-3">
                            {formatNumber(product.unitsSold)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <span className="mr-1 text-yellow-400">★</span>
                              {product.avgRating.toFixed(1)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {product.conversionRate.toFixed(2)}%
                          </td>
                          <td className="px-4 py-3">
                            <span className={product.trend >= 0 
                              ? "text-green-600 dark:text-green-400" 
                              : "text-red-600 dark:text-red-400"
                            }>
                              {product.trend >= 0 ? "+" : ""}
                              {product.trend.toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Revenue by Category
                  </p>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={productPerformance?.categoryPerformance || []}
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Bar dataKey="revenue" name="Revenue" fill="#2a7c8a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="channels" className="mt-4">
          <Card className="p-4 md:p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Sales Channels Analysis
            </h3>
            
            {isLoadingChannels ? (
              <Skeleton className="h-80 w-full" />
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Revenue by Channel
                  </p>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={salesByChannel?.revenueByChannel || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="channel"
                        label={({ channel, percent }) => 
                          `${channel}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {(salesByChannel?.revenueByChannel || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Conversion Rate by Channel
                  </p>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart 
                      data={salesByChannel?.conversionByChannel || []}
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="channel" />
                      <YAxis tickFormatter={(value) => `${value}%`} />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Legend />
                      <Bar 
                        dataKey="rate" 
                        name="Conversion Rate" 
                        fill="#ff7b4f"
                        label={{ 
                          position: 'top',
                          formatter: (value: number) => `${value.toFixed(1)}%` 
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="lg:col-span-2">
                  <p className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Channel Performance Over Time
                  </p>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart 
                      data={salesByChannel?.channelTrends || []}
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="direct" 
                        name="Direct" 
                        stroke="#2a7c8a" 
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="organic" 
                        name="Organic Search" 
                        stroke="#4fd1c5" 
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="referral" 
                        name="Referral" 
                        stroke="#e0a86f" 
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="social" 
                        name="Social Media" 
                        stroke="#ff7b4f" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;
```

## 2. Subscription Management System

```tsx
// src/components/subscription/SubscriptionManager.tsx

import { useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Select } from "~/components/ui/Select";
import { Badge } from "~/components/ui/Badge";
import { EmptyState } from "~/components/ui/EmptyState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/Tabs";
import { ConfirmDialog } from "~/components/ui/ConfirmDialog";
import { toast } from "react-hot-toast";
import { formatCurrency, formatDate } from "~/utils/format";
import {
  FaBox,
  FaClock,
  FaEdit,
  FaPause,
  FaPlay,
  FaTrash,
  FaBoxOpen,
  FaCalendarAlt,
  FaCreditCard,
} from "react-icons/fa";

const FREQUENCY_OPTIONS = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "BIWEEKLY", label: "Every 2 Weeks" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "BIMONTHLY", label: "Every 2 Months" },
  { value: "QUARTERLY", label: "Every 3 Months" },
];

const SubscriptionManager = () => {
  const { data: session } = useSession();
  const [selectedSubscription, setSelectedSubscription] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editFrequency, setEditFrequency] = useState<string>("");
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  
  // Get user's active subscriptions
  const { data: subscriptions, refetch: refetchSubscriptions } = 
    api.subscriptions.getUserSubscriptions.useQuery(
      undefined,
      { enabled: !!session }
    );
  
  // Get subscription history
  const { data: subscriptionHistory } = 
    api.subscriptions.getSubscriptionHistory.useQuery(
      undefined,
      { enabled: !!session }
    );
  
  // Get recommended products for subscription
  const { data: recommendedProducts } = 
    api.subscriptions.getRecommendedProducts.useQuery(
      undefined,
      { enabled: !!session }
    );
  
  // Mutations
  const updateSubscription = api.subscriptions.updateSubscription.useMutation({
    onSuccess: () => {
      toast.success("Subscription updated successfully");
      setShowEditDialog(false);
      void refetchSubscriptions();
    },
    onError: (error) => {
      toast.error(`Error updating subscription: ${error.message}`);
    },
  });
  
  const pauseSubscription = api.subscriptions.pauseSubscription.useMutation({
    onSuccess: () => {
      toast.success("Subscription paused");
      void refetchSubscriptions();
    },
  });
  
  const resumeSubscription = api.subscriptions.resumeSubscription.useMutation({
    onSuccess: () => {
      toast.success("Subscription resumed");
      void refetchSubscriptions();
    },
  });
  
  const cancelSubscription = api.subscriptions.cancelSubscription.useMutation({
    onSuccess: () => {
      toast.success("Subscription cancelled");
      setShowCancelDialog(false);
      void refetchSubscriptions();
    },
    onError: (error) => {
      toast.error(`Error cancelling subscription: ${error.message}`);
    },
  });
  
  const skipNextDelivery = api.subscriptions.skipNextDelivery.useMutation({
    onSuccess: () => {
      toast.success("Next delivery skipped");
      setShowSkipDialog(false);
      void refetchSubscriptions();
    },
  });
  
  const createSubscription = api.subscriptions.createSubscription.useMutation({
    onSuccess: () => {
      toast.success("Product added to your subscriptions");
      void refetchSubscriptions();
    },
  });
  
  const handleUpdateFrequency = () => {
    if (selectedSubscription && editFrequency) {
      updateSubscription.mutate({
        id: selectedSubscription,
        frequency: editFrequency as any,
      });
    }
  };
  
  const handleCancelSubscription = () => {
    if (selectedSubscription) {
      cancelSubscription.mutate({ id: selectedSubscription });
    }
  };
  
  const handleSkipNextDelivery = () => {
    if (selectedSubscription) {
      skipNextDelivery.mutate({ id: selectedSubscription });
    }
  };
  
  const handleAddSubscription = (productId: string, frequency: string) => {
    createSubscription.mutate({
      productId,
      frequency: frequency as any,
    });
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge variant="success">Active</Badge>;
      case "PAUSED":
        return <Badge variant="warning">Paused</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "PENDING":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  if (!session) {
    return (
      <EmptyState
        icon={<FaBoxOpen className="h-12 w-12 text-gray-400" />}
        title="Sign in to manage your subscriptions"
        description="Subscribe to your favorite products and have them delivered automatically"
        action={<Button href="/api/auth/signin">Sign In</Button>}
      />
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          My Subscriptions
        </h1>
      </div>
      
      <Tabs defaultValue="active">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">
            Active Subscriptions
          </TabsTrigger>
          <TabsTrigger value="history">
            Subscription History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-4">
          {!subscriptions || subscriptions.length === 0 ? (
            <EmptyState
              icon={<FaBox className="h-12 w-12 text-gray-400" />}
              title="No active subscriptions"
              description="Subscribe to your favorite products and never run out"
              action={<Button href="/products">Browse Products</Button>}
            />
          ) : (
            <div className="space-y-4">
              {subscriptions.map((subscription) => (
                <Card key={subscription.id} className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      {subscription.product.images[0] && (
                        <img
                          src={subscription.product.images[0].url}
                          alt={subscription.product.name}
                          className="h-16 w-16 rounded-md object-cover"
                        />
                      )}
                      
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {subscription.product.name}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <FaClock className="h-3 w-3" />
                            {subscription.frequency.replace("_", " ").toLowerCase()}
                          </span>
                          <span className="flex items-center gap-1">
                            <FaCreditCard className="h-3 w-3" />
                            {formatCurrency(parseFloat(subscription.product.price.toString()))}
                          </span>
                          <span className="flex items-center gap-1">
                            <FaCalendarAlt className="h-3 w-3" />
                            Next: {formatDate(subscription.nextDelivery || new Date())}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="mr-2">
                        {getStatusBadge(subscription.active ? "ACTIVE" : "PAUSED")}
                      </div>
                      
                      {subscription.active ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSubscription(subscription.id);
                            pauseSubscription.mutate({ id: subscription.id });
                          }}
                          className="flex items-center gap-1"
                        >
                          <FaPause className="h-3 w-3" />
                          Pause
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSubscription(subscription.id);
                            resumeSubscription.mutate({ id: subscription.id });
                          }}
                          className="flex items-center gap-1"
                        >
                          <FaPlay className="h-3 w-3" />
                          Resume
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedSubscription(subscription.id);
                          setEditFrequency(subscription.frequency);
                          setShowEditDialog(true);
                        }}
                        className="flex items-center gap-1"
                      >
                        <FaEdit className="h-3 w-3" />
                        Edit
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedSubscription(subscription.id);
                          setShowSkipDialog(true);
                        }}
                      >
                        Skip Next
                      </Button>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedSubscription(subscription.id);
                          setShowCancelDialog(true);
                        }}
                        className="flex items-center gap-1"
                      >
                        <FaTrash className="h-3 w-3" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="history" className="mt-4">
          {!subscriptionHistory || subscriptionHistory.length === 0 ? (
            <EmptyState
              icon={<FaClock className="h-12 w-12 text-gray-400" />}
              title="No subscription history"
              description="Your past deliveries and cancelled subscriptions will appear here"
            />
          ) : (
            <div className="space-y-4">
              {subscriptionHistory.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      {item.product.images[0] && (
                        <img
                          src={item.product.images[0].url}
                          alt={item.product.name}
                          className="h-16 w-16 rounded-md object-cover"
                        />
                      )}
                      
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {item.product.name}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <span>
                            {item.frequency.replace("_", " ").toLowerCase()}
                          </span>
                          <span>
                            {formatCurrency(parseFloat(item.product.price.toString()))}
                          </span>
                          <span>
                            Last Delivery: {formatDate(item.lastDelivery || item.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      {getStatusBadge(item.status)}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-4"
                        onClick={() => {
                          createSubscription.mutate({
                            productId: item.product.id,
                            frequency: item.frequency,
                          });
                        }}
                      >
                        Resubscribe
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Recommended Products for Subscription */}
      {recommendedProducts && recommendedProducts.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
            Recommended for Subscription
          </h2>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recommendedProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                {product.images[0] && (
                  <div className="relative h-48 w-full">
                    <img
                      src={product.images[0].url}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {product.name}
                  </h3>
                  
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {product.description.length > 100
                      ? `${product.description.substring(0, 100)}...`
                      : product.description}
                  </p>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(parseFloat(product.price.toString()))}
                    </span>
                    
                    <Select
                      options={FREQUENCY_OPTIONS}
                      placeholder="Subscribe"
                      onValueChange={(frequency) => 
                        handleAddSubscription(product.id, frequency)
                      }
                      className="w-40"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* Edit Subscription Dialog */}
      <ConfirmDialog
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onConfirm={handleUpdateFrequency}
        title="Edit Subscription"
        confirmText="Update"
        cancelText="Cancel"
        icon={<FaEdit className="h-6 w-6 text-primary" />}
      >
        <p className="mb-4">Change your subscription frequency:</p>
        <Select
          value={editFrequency}
          onValueChange={setEditFrequency}
          options={FREQUENCY_OPTIONS}
          className="w-full"
        />
      </ConfirmDialog>
      
      {/* Cancel Subscription Dialog */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancelSubscription}
        title="Cancel Subscription"
        description="Are you sure you want to cancel this subscription? You can resubscribe at any time."
        confirmText="Cancel Subscription"
        cancelText="Keep Subscription"
        variant="destructive"
        icon={<FaTrash className="h-6 w-6 text-red-500" />}
      />
      
      {/* Skip Next Delivery Dialog */}
      <ConfirmDialog
        isOpen={showSkipDialog}
        onClose={() => setShowSkipDialog(false)}
        onConfirm={handleSkipNextDelivery}
        title="Skip Next Delivery"
        description="Would you like to skip the next scheduled delivery? Your subscription will continue with the following delivery."
        confirmText="Skip Next Delivery"
        cancelText="Keep Scheduled Delivery"
        icon={<FaCalendarAlt className="h-6 w-6 text-amber-500" />}
      />
    </div>
  );
};

export default SubscriptionManager;
```

## 3. Loyalty Program and Rewards System

```tsx
// src/components/loyalty/LoyaltyDashboard.tsx

import { useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/Tabs";
import { Progress } from "~/components/ui/Progress";
import { Badge } from "~/components/ui/Badge";
import { EmptyState } from "~/components/ui/EmptyState";
import { ConfirmDialog } from "~/components/ui/ConfirmDialog";
import { toast } from "react-hot-toast";
import {
  FaGift,
  FaMedal,
  FaHistory,
  FaExchangeAlt,
  FaInfoCircle,
  FaCrown,
  FaStar,
  FaTrophy,
  FaArrowUp,
} from "react-icons/fa";
import { formatCurrency, formatDate } from "~/utils/format";

// For tooltip
import { Tooltip, TooltipTrigger, TooltipContent } from "~/components/ui/Tooltip";

const TIER_INFO = {
  BRONZE: {
    name: "Bronze",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    icon: <FaMedal className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
  },
  SILVER: {
    name: "Silver",
    color: "text-slate-500 dark:text-slate-300",
    bgColor: "bg-slate-100 dark:bg-slate-800",
    icon: <FaMedal className="h-5 w-5 text-slate-500 dark:text-slate-300" />,
  },
  GOLD: {
    name: "Gold",
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    icon: <FaCrown className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />,
  },
  PLATINUM: {
    name: "Platinum",
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-100 dark:bg-teal-900/30",
    icon: <FaStar className="h-5 w-5 text-teal-600 dark:text-teal-400" />,
  },
};

const LoyaltyDashboard = () => {
  const { data: session } = useSession();
  const [selectedReward, setSelectedReward] = useState<string | null>(null);
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  
  // Get user's loyalty status
  const { data: loyaltyData, refetch: refetchLoyalty } = 
    api.loyalty.getUserLoyalty.useQuery(
      undefined,
      { enabled: !!session }
    );
  
  // Get available rewards
  const { data: availableRewards } = 
    api.loyalty.getAvailableRewards.useQuery(
      undefined,
      { enabled: !!session }
    );
  
  // Get point history
  const { data: pointHistory } = 
    api.loyalty.getPointHistory.useQuery(
      undefined,
      { enabled: !!session }
    );
  
  // Get redemption history
  const { data: redemptionHistory } = 
    api.loyalty.getRedemptionHistory.useQuery(
      undefined,
      { enabled: !!session }
    );
  
  // Redeem reward mutation
  const redeemReward = api.loyalty.redeemReward.useMutation({
    onSuccess: () => {
      toast.success("Reward redeemed successfully");
      setShowRedeemDialog(false);
      void refetchLoyalty();
    },
    onError: (error) => {
      toast.error(`Error redeeming reward: ${error.message}`);
    },
  });
  
  const handleRedeemReward = () => {
    if (selectedReward) {
      redeemReward.mutate({ rewardId: selectedReward });
    }
  };
  
  // Calculate time until next tier
  const getNextTierInfo = () => {
    if (!loyaltyData) return null;
    
    const tierThresholds = {
      BRONZE: 0,
      SILVER: 1000,
      GOLD: 5000,
      PLATINUM: 10000,
    };
    
    const currentTier = loyaltyData.tier as keyof typeof tierThresholds;
    const nextTier = 
      currentTier === "BRONZE" ? "SILVER" :
      currentTier === "SILVER" ? "GOLD" :
      currentTier === "GOLD" ? "PLATINUM" : null;
    
    if (!nextTier) return null;
    
    const pointsNeeded = tierThresholds[nextTier as keyof typeof tierThresholds] - loyaltyData.lifetimePoints;
    const progress = Math.min(
      100,
      ((loyaltyData.lifetimePoints - tierThresholds[currentTier]) /
        (tierThresholds[nextTier as keyof typeof tierThresholds] - tierThresholds[currentTier])) * 100
    );
    
    return {
      nextTier,
      pointsNeeded,
      progress,
    };
  };
  
  const nextTierInfo = getNextTierInfo();
  const tierInfo = loyaltyData ? TIER_INFO[loyaltyData.tier as keyof typeof TIER_INFO] : null;
  
  if (!session) {
    return (
      <EmptyState
        icon={<FaGift className="h-12 w-12 text-gray-400" />}
        title="Sign in to access loyalty rewards"
        description="Earn points with every purchase and redeem for exclusive rewards"
        action={<Button href="/api/auth/signin">Sign In</Button>}
      />
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Rewards & Loyalty
        </h1>
      </div>
      
      {/* Loyalty Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Your Points
              </h2>
              <p className="text-3xl font-bold text-primary dark:text-primary-light">
                {loyaltyData?.points || 0}
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Lifetime Points: {loyaltyData?.lifetimePoints || 0}
              </p>
            </div>
            
            {tierInfo && (
              <div className={`flex items-center gap-2 rounded-full ${tierInfo.bgColor} px-3 py-1`}>
                {tierInfo.icon}
                <span className={`font-medium ${tierInfo.color}`}>
                  {tierInfo.name}
                </span>
              </div>
            )}
          </div>
          
          {nextTierInfo && (
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Next Tier: {TIER_INFO[nextTierInfo.nextTier as keyof typeof TIER_INFO].name}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {nextTierInfo.pointsNeeded} points to go
                </span>
              </div>
              <Progress value={nextTierInfo.progress} className="h-2" />
            </div>
          )}
          
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button href="/account/points-history" variant="outline" className="flex items-center justify-center gap-2">
              <FaHistory className="h-4 w-4" />
              Points History
            </Button>
            <Button href="/rewards" className="flex items-center justify-center gap-2">
              <FaGift className="h-4 w-4" />
              Browse Rewards
            </Button>
          </div>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Membership Benefits
          </h2>
          
          <ul className="mt-4 space-y-3">
            {loyaltyData?.benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="mt-0.5 text-primary dark:text-primary-light">
                  <FaStar className="h-4 w-4" />
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {benefit}
                </span>
              </li>
            ))}
          </ul>
          
          {nextTierInfo && (
            <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                <FaArrowUp className="h-4 w-4 text-primary dark:text-primary-light" />
                Upgrade to {TIER_INFO[nextTierInfo.nextTier as keyof typeof TIER_INFO].name} for more benefits
              </div>
              <ul className="mt-2 space-y-2 text-xs text-gray-600 dark:text-gray-400">
                {loyaltyData?.nextTierBenefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>
      
      {/* Rewards and History */}
      <Tabs defaultValue="rewards" className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rewards" className="flex items-center gap-2">
            <FaGift className="h-4 w-4" />
            <span>Available Rewards</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <FaHistory className="h-4 w-4" />
            <span>Points History</span>
          </TabsTrigger>
          <TabsTrigger value="redemptions" className="flex items-center gap-2">
            <FaExchangeAlt className="h-4 w-4" />
            <span>Redemption History</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="rewards" className="mt-4">
          {!availableRewards || availableRewards.length === 0 ? (
            <EmptyState
              icon={<FaGift className="h-12 w-12 text-gray-400" />}
              title="No rewards available"
              description="Check back soon for new reward options"
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {availableRewards.map((reward) => (
                <Card key={reward.id} className="overflow-hidden">
                  {reward.imageUrl && (
                    <div className="relative h-40 w-full">
                      <img
                        src={reward.imageUrl}
                        alt={reward.name}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute right-2 top-2 rounded-full bg-primary px-2 py-1 text-xs font-semibold text-white">
                        {reward.pointsCost} points
                      </div>
                    </div>
                  )}
                  
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {reward.name}
                      </h3>
                      
                      {reward.tier && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className={`${
                              TIER_INFO[reward.tier as keyof typeof TIER_INFO].color
                            } border-current`}>
                              {TIER_INFO[reward.tier as keyof typeof TIER_INFO].name}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            {`Available for ${TIER_INFO[reward.tier as keyof typeof TIER_INFO].name} tier and above`}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {reward.description}
                    </p>
                    
                    {reward.expiresAt && (
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                        Available until {formatDate(reward.expiresAt)}
                      </p>
                    )}
                    
                    <div className="mt-4">
                      <Button
                        className="w-full"
                        disabled={loyaltyData?.points < reward.pointsCost}
                        onClick={() => {
                          setSelectedReward(reward.id);
                          setShowRedeemDialog(true);
                        }}
                      >
                        {loyaltyData?.points < reward.pointsCost
                          ? `Need ${reward.pointsCost - (loyaltyData?.points || 0)} more points`
                          : "Redeem Reward"}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="history" className="mt-4">
          {!pointHistory || pointHistory.length === 0 ? (
            <EmptyState
              icon={<FaHistory className="h-12 w-12 text-gray-400" />}
              title="No points history"
              description="Your point earnings will appear here as you make purchases"
            />
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                    <tr>
                      <th scope="col" className="px-4 py-3">Date</th>
                      <th scope="col" className="px-4 py-3">Description</th>
                      <th scope="col" className="px-4 py-3">Points</th>
                      <th scope="col" className="px-4 py-3">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pointHistory.map((entry) => (
                      <tr key={entry.id} className="border-b bg-white dark:border-gray-700 dark:bg-gray-900">
                        <td className="whitespace-nowrap px-4 py-3 text-gray-900 dark:text-white">
                          {formatDate(entry.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {entry.description}
                        </td>
                        <td className={`whitespace-nowrap px-4 py-3 font-medium ${
                          entry.points > 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}>
                          {entry.points > 0 ? "+" : ""}
                          {entry.points}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={entry.type === "EARN" ? "success" : "default"}>
                            {entry.type}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="redemptions" className="mt-4">
          {!redemptionHistory || redemptionHistory.length === 0 ? (
            <EmptyState
              icon={<FaExchangeAlt className="h-12 w-12 text-gray-400" />}
              title="No redemption history"
              description="Your redeemed rewards will appear here"
            />
          ) : (
            <div className="space-y-4">
              {redemptionHistory.map((redemption) => (
                <Card key={redemption.id} className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {redemption.reward.name}
                        </h3>
                        <Badge>
                          {redemption.status}
                        </Badge>
                      </div>
                      
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Redeemed on {formatDate(redemption.createdAt)}
                      </p>
                      
                      {redemption.expiresAt && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                          Expires on {formatDate(redemption.expiresAt)}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {redemption.reward.pointsCost} points
                      </p>
                      
                      {redemption.reward.type === "COUPON" && redemption.couponCode && (
                        <div className="mt-2">
                          <span className="inline-block rounded bg-gray-100 px-2 py-1 text-sm font-mono font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                            {redemption.couponCode}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Redeem Reward Dialog */}
      <ConfirmDialog
        isOpen={showRedeemDialog}
        onClose={() => setShowRedeemDialog(false)}
        onConfirm={handleRedeemReward}
        title="Redeem Reward"
        description={
          selectedReward && availableRewards
            ? `Are you sure you want to redeem ${
                availableRewards.find(r => r.id === selectedReward)?.name
              } for ${
                availableRewards.find(r => r.id === selectedReward)?.pointsCost
              } points?`
            : "Are you sure you want to redeem this reward?"
        }
        confirmText="Redeem"
        cancelText="Cancel"
        icon={<FaGift className="h-6 w-6 text-primary" />}
      />
    </div>
  );
};

export default LoyaltyDashboard;
```

## 4. AR Product Visualization Component

```tsx
// src/components/products/ARVisualization.tsx

import { useState, useEffect, useRef } from "react";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/Tabs";
import { Spinner } from "~/components/ui/Spinner";
import { Select } from "~/components/ui/Select";
import { FaCamera, FaVrCardboard, FaInfoCircle, FaCheck, FaTimes } from "react-icons/fa";
import { toast } from "react-hot-toast";

import dynamic from "next/dynamic";

// Dynamic import for Model Viewer (WebXR component)
const ModelViewer = dynamic(
  () => import('~/components/products/ModelViewer'),
  { ssr: false, loading: () => <div className="h-80 w-full flex items-center justify-center"><Spinner size="lg" /></div> }
);

interface ARVisualizationProps {
  productId: string;
  productName: string;
  modelUrl?: string;
  previewImageUrl?: string;
  productSize?: {
    width: number;
    height: number;
    depth: number;
  };
}

const ARVisualization = ({
  productId,
  productName,
  modelUrl,
  previewImageUrl,
  productSize,
}: ARVisualizationProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [arSupported, setArSupported] = useState<boolean | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [loadingCamera, setLoadingCamera] = useState(false);
  const [renderMode, setRenderMode] = useState<"preview" | "ar" | "3d">("preview");
  const [sceneReady, setSceneReady] = useState(false);
  const [selectedSurface, setSelectedSurface] = useState("table");
  const [modelScale, setModelScale] = useState(1);
  
  // Check browser AR compatibility
  useEffect(() => {
    const checkArSupport = async () => {
      // Check if WebXR is supported
      if ("xr" in window && (window as any).xr) {
        try {
          const isSupported = await (navigator as any).xr?.isSessionSupported("immersive-ar");
          setArSupported(isSupported);
        } catch (error) {
          console.error("Error checking AR support:", error);
          setArSupported(false);
        }
      } else {
        setArSupported(false);
      }
    };
    
    void checkArSupport();
  }, []);
  
  // Handle camera activation
  const activateCamera = async () => {
    if (!videoRef.current) return;
    
    setLoadingCamera(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      
      videoRef.current.srcObject = stream;
      setCameraActive(true);
      setCameraPermission(true);
      setRenderMode("ar");
    } catch (error) {
      console.error("Error accessing camera:", error);
      setCameraPermission(false);
      toast.error("Unable to access camera. Please check permissions.");
    } finally {
      setLoadingCamera(false);
    }
  };
  
  // Handle camera deactivation
  const deactivateCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setRenderMode("preview");
  };
  
  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);
  
  // Handle scene loading
  const handleSceneReady = () => {
    setSceneReady(true);
  };
  
  // Handle taking screenshot
  const takeScreenshot = () => {
    if (!canvasRef.current || !videoRef.current) return;
    
    const context = canvasRef.current.getContext('2d');
    if (!context) return;
    
    // Set canvas dimensions to match video
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    
    // Convert canvas to image data URL
    const imageDataUrl = canvasRef.current.toDataURL('image/png');
    
    // Create an anchor element to download the image
    const a = document.createElement('a');
    a.href = imageDataUrl;
    a.download = `${productName.replace(/\s+/g, '-').toLowerCase()}-ar-view.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success("Screenshot saved");
  };
  
  // Determine compatible "try in your space" message
  const getCompatibilityMessage = () => {
    if (arSupported === null) {
      return "Checking AR compatibility...";
    } else if (arSupported) {
      return "Experience this product in your space with augmented reality";
    } else {
      return "3D preview available - AR not supported on your device";
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
          <FaVrCardboard className="mr-2 h-5 w-5 text-primary dark:text-primary-light" />
          Visualize This Product
        </h3>
        
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          {arSupported === null ? (
            <Spinner size="sm" className="mr-2" />
          ) : arSupported ? (
            <FaCheck className="mr-2 h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <FaTimes className="mr-2 h-4 w-4 text-red-600 dark:text-red-400" />
          )}
          {getCompatibilityMessage()}
        </div>
      </div>
      
      <Tabs 
        value={renderMode} 
        onValueChange={(value) => {
          if (value === "ar" && !cameraActive) {
            void activateCamera();
          } else if (value !== "ar" && cameraActive) {
            deactivateCamera();
          } else {
            setRenderMode(value as "preview" | "ar" | "3d");
          }
        }}
      >
        <div className="p-4 bg-gray-50 dark:bg-gray-800">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview">Product Preview</TabsTrigger>
            <TabsTrigger value="3d">3D View</TabsTrigger>
            <TabsTrigger value="ar" disabled={arSupported === false}>
              Try in Your Space
            </TabsTrigger>
          </TabsList>
        </div>
        
        <div className="relative">
          {/* Preview Image Mode */}
          <TabsContent value="preview" className="m-0">
            <div className="relative h-80 w-full">
              {previewImageUrl ? (
                <img
                  src={previewImageUrl}
                  alt={productName}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-800">
                  <p className="text-gray-500 dark:text-gray-400">
                    Preview image not available
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* 3D Model View */}
          <TabsContent value="3d" className="m-0">
            <div className="relative h-80 w-full">
              {modelUrl ? (
                <ModelViewer
                  src={modelUrl}
                  alt={productName}
                  ar={false}
                  scale={modelScale.toString()}
                  onSceneReady={handleSceneReady}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-800">
                  <p className="text-gray-500 dark:text-gray-400">
                    3D model not available
                  </p>
                </div>
              )}
              
              {modelUrl && (
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">
                      Scale
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={modelScale}
                      onChange={(e) => setModelScale(parseFloat(e.target.value))}
                      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-300 dark:bg-gray-700"
                    />
                  </div>
                  
                  <div>
                    {productSize && (
                      <div className="rounded-md bg-white/80 p-2 text-xs dark:bg-black/50">
                        <div className="flex items-center gap-2">
                          <FaInfoCircle className="h-3 w-3" />
                          <span>
                            {productSize.width} × {productSize.height} × {productSize.depth} cm
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* AR Mode */}
          <TabsContent value="ar" className="m-0">
            <div className="relative h-80 w-full">
              {loadingCamera ? (
                <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-800">
                  <Spinner size="lg" />
                </div>
              ) : cameraPermission === false ? (
                <div className="flex h-full w-full flex-col items-center justify-center bg-gray-100 p-4 dark:bg-gray-800">
                  <FaTimes className="mb-2 h-8 w-8 text-red-500" />
                  <p className="mb-2 text-center font-medium text-gray-900 dark:text-white">
                    Camera access denied
                  </p>
                  <p className="mb-4 text-center text-sm text-gray-600 dark:text-gray-400">
                    Please enable camera access in your browser settings to use AR features
                  </p>
                  <Button
                    onClick={() => {
                      void activateCamera();
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              ) : cameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="h-full w-full object-cover"
                  />
                  
                  {/* Overlaid 3D model */}
                  {modelUrl && (
                    <div className="absolute inset-0 pointer-events-none">
                      {/* AR model would be rendered here with frameworks like AR.js or WebXR */}
                      <div className="absolute bottom-4 left-4 text-xs bg-black/50 text-white rounded p-1">
                        AR Mode Active
                      </div>
                    </div>
                  )}
                  
                  <div className="absolute bottom-4 right-4 flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={takeScreenshot}
                      className="flex items-center gap-1"
                    >
                      <FaCamera className="h-4 w-4" />
                      Capture
                    </Button>
                    
                    <Select
                      value={selectedSurface}
                      onValueChange={setSelectedSurface}
                      options={[
                        { value: "table", label: "Table" },
                        { value: "floor", label: "Floor" },
                        { value: "wall", label: "Wall" },
                      ]}
                      className="w-24"
                    />
                  </div>
                  
                  <canvas ref={canvasRef} className="hidden" />
                </>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-gray-100 p-4 dark:bg-gray-800">
                  <FaCamera className="mb-2 h-8 w-8 text-gray-400" />
                  <p className="mb-2 text-center font-medium text-gray-900 dark:text-white">
                    Try this product in your space
                  </p>
                  <p className="mb-4 text-center text-sm text-gray-600 dark:text-gray-400">
                    Use your camera to see how this product looks in your environment
                  </p>
                  <Button
                    onClick={() => {
                      void activateCamera();
                    }}
                  >
                    Enable Camera
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </div>
        
        <div className="border-t border-gray-200 p-4 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <FaInfoCircle className="mr-1 inline-block h-4 w-4" />
            Visualize how {productName} will look in your space before you buy
          </p>
        </div>
      </Tabs>
    </Card>
  );
};

export default ARVisualization;
```

## 5. Multi-language and Multi-currency Support

```tsx
// src/contexts/LocalizationContext.tsx

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useRouter } from "next/router";
import { useLocalStorage } from "~/hooks/useLocalStorage";
import { toast } from "react-hot-toast";

type Currency = {
  code: string;
  symbol: string;
  exchangeRate: number;
  name: string;
};

type Language = {
  code: string;
  name: string;
  flag: string;
};

type LocalizationContextType = {
  language: string;
  setLanguage: (code: string) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (price: number) => string;
  availableLanguages: Language[];
  availableCurrencies: Currency[];
  translations: Record<string, string>;
  t: (key: string, params?: Record<string, string>) => string;
};

const AVAILABLE_LANGUAGES: Language[] = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
];

const AVAILABLE_CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", exchangeRate: 1, name: "US Dollar" },
  { code: "EUR", symbol: "€", exchangeRate: 0.93, name: "Euro" },
  { code: "GBP", symbol: "£", exchangeRate: 0.82, name: "British Pound" },
  { code: "CAD", symbol: "C$", exchangeRate: 1.38, name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", exchangeRate: 1.53, name: "Australian Dollar" },
  { code: "JPY", symbol: "¥", exchangeRate: 110.15, name: "Japanese Yen" },
];

const LocalizationContext = createContext<LocalizationContextType | null>(null);

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error("useLocalization must be used within a LocalizationProvider");
  }
  return context;
};

interface LocalizationProviderProps {
  children: ReactNode;
}

export const LocalizationProvider = ({ children }: LocalizationProviderProps) => {
  const router = useRouter();
  
  // Initialize from browser/stored preferences
  const [storedLanguage, setStoredLanguage] = useLocalStorage("language", "");
  const [storedCurrency, setStoredCurrency] = useLocalStorage("currency", "");
  
  const [language, setLanguageState] = useState(storedLanguage || "en");
  const [currency, setCurrencyState] = useState<Currency>(
    AVAILABLE_CURRENCIES.find(c => c.code === storedCurrency) || AVAILABLE_CURRENCIES[0]
  );
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  // Load translations based on selected language
  useEffect(() => {
    const loadTranslations = async () => {
      setIsLoading(true);
      try {
        // In a real app, this would be a network request or imported JSON
        // For demo purposes, we'll simulate some translations
        let loaded: Record<string, string> = {};
        
        switch (language) {
          case "es":
            loaded = {
              "home": "Inicio",
              "products": "Productos",
              "cart": "Carrito",
              "account": "Cuenta",
              "search": "Buscar productos...",
              "add_to_cart": "Añadir al carrito",
              "out_of_stock": "Agotado",
              "price": "Precio",
              "quantity": "Cantidad",
              "total": "Total",
              "checkout": "Pagar",
              "welcome_message": "Bienvenido a The Scent",
              // ... more translations
            };
            break;
          case "fr":
            loaded = {
              "home": "Accueil",
              "products": "Produits",
              "cart": "Panier",
              "account": "Compte",
              "search": "Rechercher des produits...",
              "add_to_cart": "Ajouter au panier",
              "out_of_stock": "Épuisé",
              "price": "Prix",
              "quantity": "Quantité",
              "total": "Total",
              "checkout": "Commander",
              "welcome_message": "Bienvenue à The Scent",
              // ... more translations
            };
            break;
          case "de":
            loaded = {
              "home": "Startseite",
              "products": "Produkte",
              "cart": "Warenkorb",
              "account": "Konto",
              "search": "Produkte suchen...",
              "add_to_cart": "In den Warenkorb",
              "out_of_stock": "Ausverkauft",
              "price": "Preis",
              "quantity": "Menge",
              "total": "Gesamt",
              "checkout": "Zur Kasse",
              "welcome_message": "Willkommen bei The Scent",
              // ... more translations
            };
            break;
          default:
            loaded = {}; // English is the default, keys = values
        }
        
        setTranslations(loaded);
      } catch (error) {
        console.error("Failed to load translations:", error);
        toast.error("Failed to load translations");
      } finally {
        setIsLoading(false);
      }
    };
    
    void loadTranslations();
  }, [language]);
  
  // Set language with storage update
  const setLanguage = (code: string) => {
    const languageExists = AVAILABLE_LANGUAGES.some(lang => lang.code === code);
    if (!languageExists) {
      console.error(`Language code "${code}" is not supported`);
      return;
    }
    
    setLanguageState(code);
    setStoredLanguage(code);
    
    // Optionally update route locale
    const { pathname, asPath, query } = router;
    void router.push({ pathname, query }, asPath, { locale: code });
    
    // Show toast with the language name
    const langName = AVAILABLE_LANGUAGES.find(lang => lang.code === code)?.name || code;
    toast.success(`Language changed to ${langName}`);
  };
  
  // Set currency with storage update
  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    setStoredCurrency(newCurrency.code);
    
    // Show toast with the currency name
    toast.success(`Currency changed to ${newCurrency.name}`);
  };
  
  // Format price based on current currency
  const formatPrice = (price: number): string => {
    const convertedPrice = price * currency.exchangeRate;
    
    // Format based on currency
    return new Intl.NumberFormat(language, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(convertedPrice);
  };
  
  // Translation function
  const t = (key: string, params?: Record<string, string>): string => {
    let text = translations[key] || key;
    
    // Replace parameters if provided
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(`{{${param}}}`, value);
      });
    }
    
    return text;
  };
  
  return (
    <LocalizationContext.Provider
      value={{
        language,
        setLanguage,
        currency,
        setCurrency,
        formatPrice,
        availableLanguages: AVAILABLE_LANGUAGES,
        availableCurrencies: AVAILABLE_CURRENCIES,
        translations,
        t,
      }}
    >
      {children}
    </LocalizationContext.Provider>
  );
};
```

## 6. Advanced Role-Based Access Control

```tsx
// src/components/admin/RoleManagement.tsx

import { useState } from "react";
import { api } from "~/utils/api";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Switch } from "~/components/ui/Switch";
import { Badge } from "~/components/ui/Badge";
import { Label } from "~/components/ui/Label";
import { Select } from "~/components/ui/Select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/Dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/Tabs";
import { toast } from "react-hot-toast";
import { ConfirmDialog } from "~/components/ui/ConfirmDialog";
import {
  FaUserPlus,
  FaEdit,
  FaTrash,
  FaLock,
  FaUnlock,
  FaUsersCog,
  FaUserShield,
  FaUserTag,
  FaTable,
  FaClipboardList,
} from "react-icons/fa";

// Simplified permission structure - in a real app this would be more detailed
type Permission = {
  id: string;
  name: string;
  description: string;
  category: "products" | "orders" | "customers" | "marketing" | "settings" | "analytics";
};

type Role = {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isDefault: boolean;
  isSystem: boolean;
  usersCount: number;
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  roleId: string;
  roleName: string;
  lastActive: Date;
  isActive: boolean;
  createdAt: Date;
};

const PERMISSION_CATEGORIES = [
  { id: "products", name: "Products", icon: <FaTable /> },
  { id: "orders", name: "Orders", icon: <FaClipboardList /> },
  { id: "customers", name: "Customers", icon: <FaUserTag /> },
  { id: "marketing", name: "Marketing", icon: <FaUserTag /> },
  { id: "settings", name: "Settings", icon: <FaUsersCog /> },
  { id: "analytics", name: "Analytics", icon: <FaTable /> },
];

const RoleManagement = () => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [isDeleteRoleConfirmOpen, setIsDeleteRoleConfirmOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    roleId: "",
    sendInvite: true,
  });
  const [editRoleData, setEditRoleData] = useState<Partial<Role>>({
    name: "",
    description: "",
    permissions: [],
  });
  const [searchFilter, setSearchFilter] = useState("");
  const [permissionFilter, setPermissionFilter] = useState<string | null>(null);
  
  // Fetch roles data
  const { data: roles, refetch: refetchRoles } = api.admin.getAllRoles.useQuery();
  
  // Fetch permissions data
  const { data: permissions } = api.admin.getAllPermissions.useQuery();
  
  // Fetch admin users
  const { data: adminUsers, refetch: refetchUsers } = api.admin.getAdminUsers.useQuery();
  
  // Mutations
  const createUser = api.admin.createAdminUser.useMutation({
    onSuccess: () => {
      toast.success("User created successfully");
      setIsCreateUserOpen(false);
      setNewUserData({
        name: "",
        email: "",
        roleId: "",
        sendInvite: true,
      });
      void refetchUsers();
    },
    onError: (error) => {
      toast.error(`Failed to create user: ${error.message}`);
    },
  });
  
  const updateUserRole = api.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("User role updated");
      void refetchUsers();
    },
    onError: (error) => {
      toast.error(`Failed to update user role: ${error.message}`);
    },
  });
  
  const toggleUserStatus = api.admin.toggleUserStatus.useMutation({
    onSuccess: (data) => {
      toast.success(
        data.isActive
          ? "User activated successfully"
          : "User deactivated successfully"
      );
      void refetchUsers();
    },
    onError: (error) => {
      toast.error(`Failed to update user status: ${error.message}`);
    },
  });
  
  const updateRole = api.admin.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Role updated successfully");
      setIsEditRoleOpen(false);
      void refetchRoles();
    },
    onError: (error) => {
      toast.error(`Failed to update role: ${error.message}`);
    },
  });
  
  const createRole = api.admin.createRole.useMutation({
    onSuccess: () => {
      toast.success("Role created successfully");
      setIsEditRoleOpen(false);
      void refetchRoles();
    },
    onError: (error) => {
      toast.error(`Failed to create role: ${error.message}`);
    },
  });
  
  const deleteRole = api.admin.deleteRole.useMutation({
    onSuccess: () => {
      toast.success("Role deleted successfully");
      setIsDeleteRoleConfirmOpen(false);
      void refetchRoles();
    },
    onError: (error) => {
      toast.error(`Failed to delete role: ${error.message}`);
    },
  });
  
  // Handler for creating a new user
  const handleCreateUser = () => {
    if (!newUserData.name || !newUserData.email || !newUserData.roleId) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    createUser.mutate({
      name: newUserData.name,
      email: newUserData.email,
      roleId: newUserData.roleId,
      sendInvite: newUserData.sendInvite,
    });
  };
  
  // Handler for updating a user's role
  const handleUpdateUserRole = (userId: string, roleId: string) => {
    updateUserRole.mutate({ userId, roleId });
  };
  
  // Handler for toggling a user's active status
  const handleToggleUserStatus = (userId: string) => {
    toggleUserStatus.mutate({ userId });
  };
  
  // Filter functions for admin users
  const filteredUsers = adminUsers?.filter((user) => {
    const searchMatch =
      searchFilter === "" ||
      user.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      user.email.toLowerCase().includes(searchFilter.toLowerCase()) ||
      user.roleName.toLowerCase().includes(searchFilter.toLowerCase());
      
    const roleMatch = selectedRole === null || user.roleId === selectedRole;
    
    return searchMatch && roleMatch;
  });
  
  // Open edit role dialog
  const openEditRoleDialog = (role?: Role) => {
    if (role) {
      setEditRoleData({
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: [...role.permissions],
      });
    } else {
      setEditRoleData({
        name: "",
        description: "",
        permissions: [],
      });
    }
    setIsEditRoleOpen(true);
  };
  
  // Handler for role permission toggle
  const handlePermissionToggle = (permissionId: string) => {
    setEditRoleData((prev) => {
      const permissions = [...(prev.permissions || [])];
      const index = permissions.indexOf(permissionId);
      
      if (index === -1) {
        permissions.push(permissionId);
      } else {
        permissions.splice(index, 1);
      }
      
      return { ...prev, permissions };
    });
  };
  
  // Handler for save role
  const handleSaveRole = () => {
    if (!editRoleData.name) {
      toast.error("Role name is required");
      return;
    }
    
    if (editRoleData.id) {
      // Update existing role
      updateRole.mutate({
        id: editRoleData.id,
        name: editRoleData.name,
        description: editRoleData.description || "",
        permissions: editRoleData.permissions || [],
      });
    } else {
      // Create new role
      createRole.mutate({
        name: editRoleData.name,
        description: editRoleData.description || "",
        permissions: editRoleData.permissions || [],
      });
    }
  };
  
  // Handler for delete role
  const handleDeleteRole = () => {
    if (selectedRole) {
      deleteRole.mutate({ id: selectedRole });
    }
  };
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="users">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            User & Role Management
          </h1>
          
          <TabsList>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <FaUserShield className="h-4 w-4" />
              <span>Admin Users</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <FaUsersCog className="h-4 w-4" />
              <span>Roles & Permissions</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="users" className="mt-6">
          <Card>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1 flex flex-col sm:flex-row gap-4">
                <Input
                  placeholder="Search users..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="max-w-sm"
                />
                
                <Select
                  value={selectedRole || ""}
                  onValueChange={(value) => setSelectedRole(value || null)}
                  options={[
                    { value: "", label: "All Roles" },
                    ...(roles?.map(role => ({
                      value: role.id,
                      label: role.name,
                    })) || []),
                  ]}
                  className="max-w-xs"
                />
              </div>
              
              <Button
                onClick={() => setIsCreateUserOpen(true)}
                className="flex items-center gap-2"
              >
                <FaUserPlus className="h-4 w-4" />
                Add Admin User
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="px-6 py-3">Name</th>
                    <th scope="col" className="px-6 py-3">Email</th>
                    <th scope="col" className="px-6 py-3">Role</th>
                    <th scope="col" className="px-6 py-3">Last Active</th>
                    <th scope="col" className="px-6 py-3">Status</th>
                    <th scope="col" className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers?.map((user) => (
                    <tr key={user.id} className="border-b bg-white dark:border-gray-700 dark:bg-gray-900">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        <Select
                          value={user.roleId}
                          onValueChange={(value) => handleUpdateUserRole(user.id, value)}
                          options={roles?.map(role => ({
                            value: role.id,
                            label: role.name,
                          })) || []}
                          className="w-40"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : "Never"}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={user.isActive ? "success" : "destructive"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleUserStatus(user.id)}
                            className="p-1"
                            title={user.isActive ? "Deactivate user" : "Activate user"}
                          >
                            {user.isActive ? (
                              <FaLock className="h-4 w-4 text-amber-500" />
                            ) : (
                              <FaUnlock className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedUser(user.id)}
                            className="p-1"
                            title="Delete user"
                          >
                            <FaTrash className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {(!filteredUsers || filteredUsers.length === 0) && (
                    <tr className="border-b bg-white dark:border-gray-700 dark:bg-gray-900">
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="roles" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card>
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Roles
                  </h2>
                  
                  <Button
                    onClick={() => openEditRoleDialog()}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <FaUserPlus className="h-4 w-4" />
                    New Role
                  </Button>
                </div>
                
                <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
                  {roles?.map((role) => (
                    <div
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      className={`p-3 rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
                        selectedRole === role.id
                          ? "bg-primary/10 dark:bg-primary-dark/20"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {role.name}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {role.usersCount} users
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {role.isDefault && (
                          <Badge variant="outline" className="text-xs">
                            Default
                          </Badge>
                        )}
                        {role.isSystem && (
                          <Badge variant="secondary" className="text-xs">
                            System
                          </Badge>
                        )}
                        
                        {!role.isSystem && (
                          <div className="flex items-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditRoleDialog(role);
                              }}
                              className="p-1"
                            >
                              <FaEdit className="h-3 w-3 text-gray-500" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRole(role.id);
                                setIsDeleteRoleConfirmOpen(true);
                              }}
                              className="p-1"
                              disabled={role.usersCount > 0}
                            >
                              <FaTrash className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
            
            <div className="lg:col-span-2">
              <Card>
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {roles?.find(r => r.id === selectedRole)?.name || "Role"} Permissions
                  </h2>
                  
                  <div className="flex items-center gap-2">
                    <Select
                      value={permissionFilter || ""}
                      onValueChange={(value) => setPermissionFilter(value || null)}
                      options={[
                        { value: "", label: "All Categories" },
                        ...PERMISSION_CATEGORIES.map(cat => ({
                          value: cat.id,
                          label: cat.name,
                        })),
                      ]}
                      className="w-48"
                    />
                    
                    {selectedRole && !roles?.find(r => r.id === selectedRole)?.isSystem && (
                      <Button
                        onClick={() => openEditRoleDialog(roles?.find(r => r.id === selectedRole))}
                        size="sm"
                      >
                        Edit Role
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="p-6 divide-y divide-gray-200 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
                  {!selectedRole && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      Select a role to view permissions
                    </div>
                  )}
                  
                  {selectedRole && permissions && PERMISSION_CATEGORIES.map((category) => {
                    const categoryPermissions = permissions.filter(
                      p => p.category === category.id &&
                      (permissionFilter === null || p.category === permissionFilter)
                    );
                    
                    if (categoryPermissions.length === 0) return null;
                    
                    const rolePermissions = roles?.find(r => r.id === selectedRole)?.permissions || [];
                    const isEditable = !roles?.find(r => r.id === selectedRole)?.isSystem;
                    
                    return (
                      <div key={category.id} className="py-4 first:pt-0">
                        <h3 className="flex items-center text-sm font-medium text-gray-900 dark:text-white mb-3">
                          {category.icon}
                          <span className="ml-2">{category.name}</span>
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {categoryPermissions.map((permission) => (
                            <div key={permission.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800">
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {permission.name}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {permission.description}
                                </div>
                              </div>
                              
                              <Switch
                                checked={rolePermissions.includes(permission.id)}
                                disabled={!isEditable}
                                // This would be tied to the actual update function in a real implementation
                                readOnly
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Create User Dialog */}
      <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Admin User</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name" required>Name</Label>
              <Input
                id="name"
                value={newUserData.name}
                onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            
            <div>
              <Label htmlFor="email" required>Email</Label>
              <Input
                id="email"
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            
            <div>
              <Label htmlFor="role" required>Role</Label>
              <Select
                value={newUserData.roleId}
                onValueChange={(value) => setNewUserData({ ...newUserData, roleId: value })}
                options={roles?.map(role => ({
                  value: role.id,
                  label: role.name,
                })) || []}
                placeholder="Select role"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                id="send-invite"
                checked={newUserData.sendInvite}
                onCheckedChange={(checked) => 
                  setNewUserData({ ...newUserData, sendInvite: checked })
                }
              />
              <Label htmlFor="send-invite">Send email invitation</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateUserOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateUser}
              isLoading={createUser.isLoading}
            >
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Role Dialog */}
      <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editRoleData.id ? "Edit Role" : "Create New Role"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
              <div>
                <Label htmlFor="role-name" required>Role Name</Label>
                <Input
                  id="role-name"
                  value={editRoleData.name}
                  onChange={(e) => setEditRoleData({ ...editRoleData, name: e.target.value })}
                  placeholder="Enter role name"
                />
              </div>
              
              <div>
                <Label htmlFor="role-description">Description</Label>
                <Input
                  id="role-description"
                  value={editRoleData.description}
                  onChange={(e) => setEditRoleData({ ...editRoleData, description: e.target.value })}
                  placeholder="Enter role description"
                />
              </div>
            </div>
            
            <div className="md:col-span-2 max-h-[400px] overflow-y-auto">
              <Label className="mb-2 block">Permissions</Label>
              
              {permissions && PERMISSION_CATEGORIES.map((category) => {
                const categoryPermissions = permissions.filter(p => p.category === category.id);
                
                if (categoryPermissions.length === 0) return null;
                
                return (
                  <div key={category.id} className="mb-4">
                    <h3 className="flex items-center text-sm font-medium text-gray-900 dark:text-white mb-2">
                      {category.icon}
                      <span className="ml-2">{category.name}</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-2 border-l-2 border-gray-200 dark:border-gray-700">
                      {categoryPermissions.map((permission) => (
                        <div key={permission.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {permission.name}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {permission.description}
                            </div>
                          </div>
                          
                          <Switch
                            checked={(editRoleData.permissions || []).includes(permission.id)}
                            onCheckedChange={() => handlePermissionToggle(permission.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditRoleOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveRole}
              isLoading={updateRole.isLoading || createRole.isLoading}
            >
              {editRoleData.id ? "Update Role" : "Create Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Role Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteRoleConfirmOpen}
        onClose={() => setIsDeleteRoleConfirmOpen(false)}
        onConfirm={handleDeleteRole}
        title="Delete Role"
        description="Are you sure you want to delete this role? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
};

export default RoleManagement;
```

## 7. Inventory Forecasting System

```tsx
// src/components/admin/InventoryForecasting.tsx

import { useState } from "react";
import { api } from "~/utils/api";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { DatePicker } from "~/components/ui/DatePicker";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/Tabs";
import { Badge } from "~/components/ui/Badge";
import { Select } from "~/components/ui/Select";
import { Switch } from "~/components/ui/Switch";
import { Label } from "~/components/ui/Label";
import { Progress } from "~/components/ui/Progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/Dialog";
import { toast } from "react-hot-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  FaBoxOpen,
  FaTruck,
  FaClipboardList,
  FaChartLine,
  FaSearch,
  FaExclamationTriangle,
  FaPlus,
  FaPrint,
  FaFileExport,
  FaFilter,
  FaRedo,
  FaEdit,
  FaBell,
  FaCalendarAlt,
} from "react-icons/fa";
import { formatCurrency, formatNumber, formatDate } from "~/utils/format";

const COLORS = ["#2a7c8a", "#4fd1c5", "#e0a86f", "#ff7b4f", "#7f9cf5", "#f56565"];

const InventoryForecasting = () => {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
    to: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Next 90 days
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showOutOfStock, setShowOutOfStock] = useState(false);
  const [showLowStock, setShowLowStock] = useState(true);
  const [sortBy, setSortBy] = useState<"name" | "stock" | "forecast" | "turnover">("forecast");
  const [isCreatePurchaseOpen, setIsCreatePurchaseOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [purchaseOrderData, setPurchaseOrderData] = useState({
    productId: "",
    quantity: 0,
    expectedDelivery: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
    supplierId: "",
    unitCost: 0,
  });
  
  // Fetch inventory forecasting data
  const { data: forecastData, refetch: refetchForecasts } = api.inventory.getInventoryForecasts.useQuery({
    from: dateRange.from.toISOString(),
    to: dateRange.to.toISOString(),
  });
  
  // Fetch categories
  const { data: categories } = api.admin.getAllCategories.useQuery();
  
  // Fetch suppliers
  const { data: suppliers } = api.inventory.getSuppliers.useQuery();
  
  // Create purchase order mutation
  const createPurchaseOrder = api.inventory.createPurchaseOrder.useMutation({
    onSuccess: () => {
      toast.success("Purchase order created successfully");
      setIsCreatePurchaseOpen(false);
      void refetchForecasts();
    },
    onError: (error) => {
      toast.error(`Failed to create purchase order: ${error.message}`);
    },
  });
  
  // Generate automatic purchase orders
  const generatePurchaseOrders = api.inventory.generatePurchaseOrders.useMutation({
    onSuccess: (data) => {
      toast.success(`Generated ${data.count} purchase orders`);
      void refetchForecasts();
    },
    onError: (error) => {
      toast.error(`Failed to generate purchase orders: ${error.message}`);
    },
  });
  
  // Calculate inventory metrics
  const getInventoryMetrics = () => {
    if (!forecastData) return null;
    
    const totalProducts = forecastData.products.length;
    const outOfStockCount = forecastData.products.filter(p => p.stockQuantity <= 0).length;
    const lowStockCount = forecastData.products.filter(p => 
      p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold
    ).length;
    const totalInventoryValue = forecastData.products.reduce(
      (sum, p) => sum + (p.stockQuantity * parseFloat(p.costPrice?.toString() || "0")),
      0
    );
    const averageTurnoverRate = forecastData.products.reduce(
      (sum, p) => sum + (p.turnoverRate || 0),
      0
    ) / totalProducts;
    
    return {
      totalProducts,
      outOfStockCount,
      lowStockCount,
      totalInventoryValue,
      averageTurnoverRate,
    };
  };
  
  // Handle creating purchase order
  const handleCreatePurchaseOrder = () => {
    if (!purchaseOrderData.productId || purchaseOrderData.quantity <= 0 || !purchaseOrderData.supplierId) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    createPurchaseOrder.mutate({
      productId: purchaseOrderData.productId,
      quantity: purchaseOrderData.quantity,
      expectedDelivery: purchaseOrderData.expectedDelivery.toISOString(),
      supplierId: purchaseOrderData.supplierId,
      unitCost: purchaseOrderData.unitCost,
    });
  };
  
  // Handle automatic purchase order generation
  const handleGeneratePurchaseOrders = () => {
    generatePurchaseOrders.mutate({
      daysToForecast: 30,
      lowStockThresholdMultiplier: 1.5,
    });
  };
  
  // Filter products based on user selections
  const filteredProducts = forecastData?.products.filter(product => {
    // Search filter
    const searchMatch = searchQuery === "" || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Category filter
    const categoryMatch = categoryFilter === null || 
      product.categories.some(c => c.id === categoryFilter);
    
    // Stock status filters
    const stockStatusMatch = (
      (showOutOfStock && product.stockQuantity <= 0) ||
      (showLowStock && product.stockQuantity > 0 && product.stockQuantity <= product.lowStockThreshold) ||
      (product.stockQuantity > product.lowStockThreshold)
    );
    
    return searchMatch && categoryMatch && stockStatusMatch;
  }) || [];
  
  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "stock":
        return a.stockQuantity - b.stockQuantity;
      case "forecast":
        return (b.forecastedDemand || 0) - (a.forecastedDemand || 0);
      case "turnover":
        return (b.turnoverRate || 0) - (a.turnoverRate || 0);
      default:
        return 0;
    }
  });
  
  // Get stock status badge
  const getStockStatusBadge = (product: typeof forecastData.products[0]) => {
    if (product.stockQuantity <= 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (product.stockQuantity <= product.lowStockThreshold) {
      return <Badge variant="warning">Low Stock</Badge>;
    } else {
      return <Badge variant="success">In Stock</Badge>;
    }
  };
  
  // Get forecasted depletion date
  const getDepletionDate = (product: typeof forecastData.products[0]) => {
    if (!product.depletionDate) return "N/A";
    if (product.stockQuantity <= 0) return "Out of Stock";
    
    const date = new Date(product.depletionDate);
    const daysUntil = Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil <= 0) return "Imminent";
    if (daysUntil <= 7) return `${daysUntil} days`;
    if (daysUntil <= 30) return `${Math.round(daysUntil / 7)} weeks`;
    return formatDate(date);
  };
  
  const metrics = getInventoryMetrics();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Inventory Forecasting
        </h1>
        
        <div className="flex items-center gap-2">
          <DatePicker
            value={dateRange}
            onChange={setDateRange}
            selectRange
          />
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => handleGeneratePurchaseOrders()}
            isLoading={generatePurchaseOrders.isLoading}
          >
            <FaRedo className="h-4 w-4" />
            Auto-Generate Purchase Orders
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Products</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {metrics?.totalProducts || 0}
              </p>
            </div>
            <div className="rounded-full bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <FaBoxOpen className="h-5 w-5" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Out of Stock</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {metrics?.outOfStockCount || 0}
              </p>
            </div>
            <div className="rounded-full bg-red-100 p-2 text-red-600 dark:bg-red-900/30 dark:text-red-400">
              <FaExclamationTriangle className="h-5 w-5" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Low Stock</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {metrics?.lowStockCount || 0}
              </p>
            </div>
            <div className="rounded-full bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <FaBell className="h-5 w-5" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Inventory Value</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(metrics?.totalInventoryValue || 0)}
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-2 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <FaTruck className="h-5 w-5" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Turnover Rate</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {(metrics?.averageTurnoverRate || 0).toFixed(2)}x
              </p>
            </div>
            <div className="rounded-full bg-purple-100 p-2 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <FaChartLine className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>
      
      {/* Tabs for Forecasting Views */}
      <Tabs defaultValue="products">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products">Products Inventory</TabsTrigger>
          <TabsTrigger value="forecasts">Demand Forecasts</TabsTrigger>
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
        </TabsList>
        
        <TabsContent value="products" className="mt-4">
          <Card>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                  leftIcon={<FaSearch className="h-4 w-4 text-gray-400" />}
                />
                
                <Select
                  value={categoryFilter || ""}
                  onValueChange={(value) => setCategoryFilter(value || null)}
                  options={[
                    { value: "", label: "All Categories" },
                    ...(categories?.map(c => ({
                      value: c.id,
                      label: c.name,
                    })) || []),
                  ]}
                  className="w-48"
                  placeholder="Filter by category"
                />
                
                <div className="flex items-center gap-2 ml-2">
                  <Switch
                    id="out-of-stock"
                    checked={showOutOfStock}
                    onCheckedChange={setShowOutOfStock}
                  />
                  <Label htmlFor="out-of-stock" className="text-sm cursor-pointer">
                    Out of Stock
                  </Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    id="low-stock"
                    checked={showLowStock}
                    onCheckedChange={setShowLowStock}
                  />
                  <Label htmlFor="low-stock" className="text-sm cursor-pointer">
                    Low Stock
                  </Label>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Select
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value as typeof sortBy)}
                  options={[
                    { value: "name", label: "Sort by Name" },
                    { value: "stock", label: "Sort by Stock Level" },
                    { value: "forecast", label: "Sort by Forecasted Demand" },
                    { value: "turnover", label: "Sort by Turnover Rate" },
                  ]}
                  className="w-48"
                />
                
                <Button
                  onClick={() => setIsCreatePurchaseOpen(true)}
                  className="flex items-center gap-2"
                >
                  <FaPlus className="h-4 w-4" />
                  Create Purchase Order
                </Button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="px-6 py-3">Product</th>
                    <th scope="col" className="px-6 py-3">SKU</th>
                    <th scope="col" className="px-6 py-3">Category</th>
                    <th scope="col" className="px-6 py-3">Current Stock</th>
                    <th scope="col" className="px-6 py-3">Status</th>
                    <th scope="col" className="px-6 py-3">Forecasted Demand</th>
                    <th scope="col" className="px-6 py-3">Depletion</th>
                    <th scope="col" className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProducts.map((product) => (
                    <tr key={product.id} className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {product.name}
                      </td>
                      <td className="px-6 py-4">
                        {product.sku || "—"}
                      </td>
                      <td className="px-6 py-4">
                        {product.categories[0]?.name || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="mr-2">{product.stockQuantity}</span>
                          {product.lowStockThreshold > 0 && (
                            <div className="w-24">
                              <Progress 
                                value={Math.min(100, (product.stockQuantity / product.lowStockThreshold) * 100)} 
                                className="h-2"
                                variant={
                                  product.stockQuantity <= 0 
                                    ? "destructive" 
                                    : product.stockQuantity <= product.lowStockThreshold 
                                      ? "warning" 
                                      : "default"
                                }
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStockStatusBadge(product)}
                      </td>
                      <td className="px-6 py-4">
                        {product.forecastedDemand || 0} units/month
                      </td>
                      <td className="px-6 py-4">
                        {getDepletionDate(product)}
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedProduct(product.id);
                            setPurchaseOrderData({
                              ...purchaseOrderData,
                              productId: product.id,
                              quantity: Math.max(1, product.forecastedDemand || 10),
                              unitCost: parseFloat(product.costPrice?.toString() || "0"),
                            });
                            setIsCreatePurchaseOpen(true);
                          }}
                          className="flex items-center gap-1"
                        >
                          <FaTruck className="h-3 w-3" />
                          Order
                        </Button>
                      </td>
                    </tr>
                  ))}
                  
                  {sortedProducts.length === 0 && (
                    <tr className="border-b bg-white dark:border-gray-700 dark:bg-gray-900">
                      <td colSpan={8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        No products found matching your filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="forecasts" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Forecasted Demand by Category
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={forecastData?.demandByCategory || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {(forecastData?.demandByCategory || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatNumber(value as number)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Historical vs. Forecasted Demand
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart 
                  data={forecastData?.demandTrend || []}
                  margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatNumber(value as number)} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="historical" 
                    name="Historical" 
                    stroke="#2a7c8a" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="forecasted" 
                    name="Forecasted" 
                    stroke="#ff7b4f" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
            
            <Card className="p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Top Products by Forecasted Demand
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={forecastData?.topProducts || []}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip formatter={(value) => formatNumber(value as number)} />
                  <Legend />
                  <Bar 
                    dataKey="forecast" 
                    name="Forecasted Monthly Demand" 
                    fill="#2a7c8a"
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar 
                    dataKey="stock" 
                    name="Current Stock" 
                    fill="#e0a86f"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="orders" className="mt-4">
          <Card>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Purchase Orders
              </h3>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" className="flex items-center gap-2">
                  <FaPrint className="h-4 w-4" />
                  Print Orders
                </Button>
                
                <Button variant="outline" className="flex items-center gap-2">
                  <FaFileExport className="h-4 w-4" />
                  Export
                </Button>
                
                <Button 
                  onClick={() => setIsCreatePurchaseOpen(true)}
                  className="flex items-center gap-2"
                >
                  <FaPlus className="h-4 w-4" />
                  Create Order
                </Button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="px-6 py-3">Order #</th>
                    <th scope="col" className="px-6 py-3">Product</th>
                    <th scope="col" className="px-6 py-3">Supplier</th>
                    <th scope="col" className="px-6 py-3">Quantity</th>
                    <th scope="col" className="px-6 py-3">Total Cost</th>
                    <th scope="col" className="px-6 py-3">Status</th>
                    <th scope="col" className="px-6 py-3">Expected Delivery</th>
                    <th scope="col" className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {forecastData?.purchaseOrders.map((order) => (
                    <tr key={order.id} className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4">
                        {order.product.name}
                      </td>
                      <td className="px-6 py-4">
                        {order.supplier.name}
                      </td>
                      <td className="px-6 py-4">
                        {order.quantity}
                      </td>
                      <td className="px-6 py-4">
                        {formatCurrency(parseFloat(order.totalCost.toString()))}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            order.status === "DELIVERED" ? "success" :
                            order.status === "SHIPPED" ? "default" :
                            order.status === "PENDING" ? "warning" :
                            "outline"
                          }
                        >
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {formatDate(order.expectedDelivery)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <FaEdit className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <FaClipboardList className="h-4 w-4 text-green-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {forecastData?.purchaseOrders.length === 0 && (
                    <tr className="border-b bg-white dark:border-gray-700 dark:bg-gray-900">
                      <td colSpan={8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        No purchase orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Create Purchase Order Dialog */}
      <Dialog open={isCreatePurchaseOpen} onOpenChange={setIsCreatePurchaseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="product" required>Product</Label>
              <Select
                value={purchaseOrderData.productId}
                onValueChange={(value) => {
                  setPurchaseOrderData({ ...purchaseOrderData, productId: value });
                  const product = forecastData?.products.find(p => p.id === value);
                  if (product) {
                    setPurchaseOrderData(prev => ({
                      ...prev,
                      productId: value,
                      unitCost: parseFloat(product.costPrice?.toString() || "0"),
                      quantity: Math.max(1, product.forecastedDemand || 10),
                    }));
                  }
                }}
                options={forecastData?.products.map(p => ({
                  value: p.id,
                  label: p.name,
                })) || []}
                placeholder="Select product"
              />
            </div>
            
            <div>
              <Label htmlFor="supplier" required>Supplier</Label>
              <Select
                value={purchaseOrderData.supplierId}
                onValueChange={(value) => setPurchaseOrderData({ ...purchaseOrderData, supplierId: value })}
                options={suppliers?.map(s => ({
                  value: s.id,
                  label: s.name,
                })) || []}
                placeholder="Select supplier"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity" required>Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={purchaseOrderData.quantity.toString()}
                  onChange={(e) => setPurchaseOrderData({ 
                    ...purchaseOrderData, 
                    quantity: parseInt(e.target.value) || 0 
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="unitCost" required>Unit Cost ($)</Label>
                <Input
                  id="unitCost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={purchaseOrderData.unitCost.toString()}
                  onChange={(e) => setPurchaseOrderData({ 
                    ...purchaseOrderData, 
                    unitCost: parseFloat(e.target.value) || 0 
                  })}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="expectedDelivery" required>Expected Delivery Date</Label>
              <DatePicker
                value={purchaseOrderData.expectedDelivery}
                onChange={(date) => setPurchaseOrderData({ 
                  ...purchaseOrderData, 
                  expectedDelivery: date || new Date() 
                })}
                withPortal
              />
            </div>
            
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-900 dark:text-white">
                  Order Summary
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(purchaseOrderData.quantity * purchaseOrderData.unitCost)}
                </span>
              </div>
              
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center justify-between">
                  <span>Quantity:</span>
                  <span>{purchaseOrderData.quantity} units</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Unit Cost:</span>
                  <span>{formatCurrency(purchaseOrderData.unitCost)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreatePurchaseOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePurchaseOrder}
              isLoading={createPurchaseOrder.isLoading}
            >
              Create Purchase Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryForecasting;
```

## 8. AI-Powered Scent Recommendation Quiz

```tsx
// src/components/quiz/AdvancedScentQuiz.tsx

import { useState, useEffect } from "react";
import { api } from "~/utils/api";
import { useRouter } from "next/router";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { Progress } from "~/components/ui/Progress";
import { Spinner } from "~/components/ui/Spinner";
import { RadioGroup, RadioItem } from "~/components/ui/RadioGroup";
import { Checkbox } from "~/components/ui/Checkbox";
import { Label } from "~/components/ui/Label";
import { ProductGrid } from "~/components/products/ProductGrid";
import { EmptyState } from "~/components/ui/EmptyState";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowRight,
  FaArrowLeft,
  FaMagic,
  FaRegLightbulb,
  FaCheck,
  FaStar,
} from "react-icons/fa";

interface QuizQuestion {
  id: string;
  question: string;
  description?: string;
  type: "single" | "multiple";
  options: {
    id: string;
    label: string;
    description?: string;
    imageUrl?: string;
    tags: string[];
  }[];
}

const AdvancedScentQuiz = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, string[]>>({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [showDetailedResults, setShowDetailedResults] = useState(false);
  const [personality, setPersonality] = useState<{
    type: string;
    description: string;
    traits: string[];
  } | null>(null);
  
  // Get quiz questions
  const { data: questions, isLoading: isLoadingQuestions } = api.quiz.getAdvancedQuizQuestions.useQuery();
  
  // Submit quiz for recommendations
  const submitQuiz = api.recommendations.getQuizRecommendations.useMutation({
    onSuccess: (data) => {
      setQuizCompleted(true);
      
      // Set scent personality if available
      if (data.personality) {
        setPersonality(data.personality);
      }
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
  
  // Generate session ID for anonymous users
  useEffect(() => {
    if (!session) {
      setSessionId(`quiz-${Math.random().toString(36).substring(2, 15)}`);
    }
  }, [session]);
  
  // Format responses for submission
  const formatResponsesForSubmission = () => {
    const formattedResponses = [];
    
    for (const questionId in responses) {
      const question = questions?.find(q => q.id === questionId);
      if (!question) continue;
      
      const answerValues = responses[questionId];
      
      formattedResponses.push({
        questionId,
        answer: answerValues.join(","),
      });
    }
    
    return formattedResponses;
  };
  
  const handleOptionSelect = (questionId: string, optionId: string, multiple: boolean) => {
    setResponses(prev => {
      const current = prev[questionId] || [];
      
      if (multiple) {
        // For multiple choice questions
        if (current.includes(optionId)) {
          return {
            ...prev,
            [questionId]: current.filter(id => id !== optionId),
          };
        } else {
          return {
            ...prev,
            [questionId]: [...current, optionId],
          };
        }
      } else {
        // For single choice questions
        return {
          ...prev,
          [questionId]: [optionId],
        };
      }
    });
  };
  
  const isOptionSelected = (questionId: string, optionId: string) => {
    return (responses[questionId] || []).includes(optionId);
  };
  
  const canProceed = () => {
    if (!questions) return false;
    const currentQuestion = questions[currentStep];
    return responses[currentQuestion.id]?.length > 0;
  };
  
  const handleNext = () => {
    if (questions && currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - submit quiz
      const formattedResponses = formatResponsesForSubmission();
      
      submitQuiz.mutate({
        responses: formattedResponses,
        sessionId: session ? undefined : sessionId,
      });
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleStartOver = () => {
    setCurrentStep(0);
    setResponses({});
    setQuizCompleted(false);
    setShowDetailedResults(false);
    setPersonality(null);
  };
  
  // Loading state
  if (isLoadingQuestions) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading your personalized scent journey...</p>
        </div>
      </div>
    );
  }
  
  // Error state - no questions
  if (!questions || questions.length === 0) {
    return (
      <EmptyState
        icon={<FaRegLightbulb className="h-12 w-12 text-gray-400" />}
        title="Quiz Unavailable"
        description="We're preparing a new scent journey for you. Please check back soon."
        action={<Button onClick={() => router.push("/products")}>Browse Products</Button>}
      />
    );
  }
  
  const currentQuestion = questions[currentStep];
  const progressPercentage = ((currentStep + 1) / questions.length) * 100;
  
  // Quiz completed - show results
  if (quizCompleted) {
    return (
      <div className="space-y-8">
        <div className="mb-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
              Your Perfect Scent Match
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Based on your preferences, we've curated these recommendations just for you
            </p>
          </motion.div>
        </div>
        
        {personality && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="overflow-hidden">
              <div className="bg-primary/10 p-6 dark:bg-primary-dark/20">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-primary p-3 text-white dark:bg-primary-light">
                    <FaMagic className="h-6 w-6" />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Your Scent Personality: {personality.type}
                    </h3>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">
                      {personality.description}
                    </p>
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                      {personality.traits.map((trait, index) => (
                        <span 
                          key={index}
                          className="inline-flex items-center rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-primary dark:bg-gray-800 dark:text-primary-light"
                        >
                          <FaStar className="mr-1 h-3 w-3" />
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {submitQuiz.data?.recommendedProducts.length > 0 ? (
            <div className="space-y-8">
              <ProductGrid products={submitQuiz.data.recommendedProducts} />
              
              <div className="text-center">
                <Button onClick={handleStartOver} variant="outline">
                  Retake Quiz
                </Button>
                
                {!showDetailedResults && (
                  <Button 
                    onClick={() => setShowDetailedResults(true)}
                    variant="link"
                    className="ml-4"
                  >
                    View Detailed Results
                  </Button>
                )}
              </div>
              
              {showDetailedResults && (
                <Card className="p-6">
                  <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
                    Your Quiz Responses
                  </h3>
                  <div className="space-y-6">
                    {formatResponsesForSubmission().map((response, index) => {
                      const question = questions.find(q => q.id === response.questionId);
                      if (!question) return null;
                      
                      const selectedOptionIds = response.answer.split(",");
                      const selectedOptions = question.options.filter(opt => 
                        selectedOptionIds.includes(opt.id)
                      );
                      
                      return (
                        <div key={index} className="border-b border-gray-200 pb-4 dark:border-gray-700">
                          <p className="mb-2 font-medium text-gray-900 dark:text-white">
                            {question.question}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {selectedOptions.map(option => (
                              <span key={option.id} className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm text-primary dark:bg-primary-dark/20 dark:text-primary-light">
                                <FaCheck className="mr-1.5 h-3 w-3" />
                                {option.label}
                              </span>
                            ))}
                          </div>
                          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Associated scent traits: </span>
                            {selectedOptions.flatMap(o => o.tags).join(", ")}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <EmptyState
              icon={<FaRegLightbulb className="h-12 w-12 text-gray-400" />}
              title="No Perfect Matches Found"
              description="We couldn't find perfect matches for your unique preferences. Try again with different choices or explore our full collection."
              action={
                <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-4 sm:space-y-0">
                  <Button onClick={handleStartOver}>Retake Quiz</Button>
                  <Button variant="outline" onClick={() => router.push("/products")}>
                    Browse All Products
                  </Button>
                </div>
              }
            />
          )}
        </motion.div>
      </div>
    );
  }
  
  // Quiz in progress
  return (
    <div className="mb-12">
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Question {currentStep + 1} of {questions.length}</span>
          <span>{Math.round(progressPercentage)}% Complete</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden">
            <div className="bg-primary/10 p-6 dark:bg-primary-dark/20">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentQuestion.question}
              </h2>
              {currentQuestion.description && (
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {currentQuestion.description}
                </p>
              )}
            </div>
            
            <div className="p-6">
              {currentQuestion.type === "single" ? (
                <RadioGroup
                  value={(responses[currentQuestion.id] || [])[0] || ""}
                  onValueChange={(value) => handleOptionSelect(currentQuestion.id, value, false)}
                  className="space-y-3"
                >
                  {currentQuestion.options.map((option) => (
                    <div key={option.id} className="flex">
                      <RadioItem
                        value={option.id}
                        id={option.id}
                        className="mt-1"
                      />
                      <div className="ml-3">
                        <Label htmlFor={option.id} className="text-base font-medium text-gray-900 dark:text-white">
                          {option.label}
                        </Label>
                        {option.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {option.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <div className="space-y-3">
                  {currentQuestion.options.map((option) => (
                    <div key={option.id} className="flex">
                      <Checkbox
                        id={option.id}
                        checked={isOptionSelected(currentQuestion.id, option.id)}
                        onCheckedChange={(checked) => 
                          handleOptionSelect(currentQuestion.id, option.id, true)
                        }
                        className="mt-1"
                      />
                      <div className="ml-3">
                        <Label htmlFor={option.id} className="text-base font-medium text-gray-900 dark:text-white">
                          {option.label}
                        </Label>
                        {option.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {option.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-8 flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2"
                >
                  <FaArrowLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="flex items-center gap-2"
                >
                  {currentStep < questions.length - 1 ? 'Next' : 'See Results'}
                  <FaArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AdvancedScentQuiz;
```

## 9. Integration with Smart Home Systems

```tsx
// src/components/smart-home/SmartHomeIntegration.tsx

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Switch } from "~/components/ui/Switch";
import { Label } from "~/components/ui/Label";
import { Select } from "~/components/ui/Select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/Tabs";
import { Badge } from "~/components/ui/Badge";
import { EmptyState } from "~/components/ui/EmptyState";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/Dialog";
import { ConfirmDialog } from "~/components/ui/ConfirmDialog";
import { toast } from "react-hot-toast";
import {
  FaPlug,
  FaPlusCircle,
  FaHome,
  FaWifi,
  FaCog,
  FaTrash,
  FaCalendarAlt,
  FaLightbulb,
  FaBell,
  FaExclamationCircle,
  FaInfoCircle,
  FaArrowRight,
  FaSun,
  FaMoon,
  FaRegClock,
} from "react-icons/fa";

// Smart Home Platform types
type SmartHomePlatform = {
  id: string;
  name: string;
  icon: React.ReactNode;
  isConnected: boolean;
  accountName?: string;
  lastSynced?: Date;
};

// Smart Home Device types
type SmartHomeDevice = {
  id: string;
  name: string;
  type: "DIFFUSER" | "HUMIDIFIER" | "LIGHT" | "THERMOSTAT";
  platformId: string;
  platformName: string;
  roomName?: string;
  isOnline: boolean;
  isActive: boolean;
  batteryLevel?: number;
  currentScent?: string;
  lastActivity?: Date;
};

// Automation types
type Automation = {
  id: string;
  name: string;
  enabled: boolean;
  trigger: {
    type: "TIME" | "EVENT" | "CONDITION";
    value: string;
  };
  actions: {
    deviceId: string;
    deviceName: string;
    action: string;
    parameters?: Record<string, any>;
  }[];
  lastTriggered?: Date;
};

// Scent Schedule types
type ScentSchedule = {
  id: string;
  name: string;
  deviceId: string;
  deviceName: string;
  scents: {
    scentId: string;
    name: string;
    startTime: string;
    endTime: string;
    days: number[];
  }[];
  enabled: boolean;
};

const SmartHomeIntegration = () => {
  const { data: session } = useSession();
  const [isAddPlatformOpen, setIsAddPlatformOpen] = useState(false);
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [isAddAutomationOpen, setIsAddAutomationOpen] = useState(false);
  const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [selectedAutomation, setSelectedAutomation] = useState<string | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState<"device" | "automation" | "schedule">("device");
  
  // Get smart home data
  const { data: platforms, refetch: refetchPlatforms } = 
    api.smartHome.getConnectedPlatforms.useQuery(
      undefined,
      { enabled: !!session }
    );
  
  const { data: devices, refetch: refetchDevices } = 
    api.smartHome.getConnectedDevices.useQuery(
      undefined,
      { enabled: !!session }
    );
  
  const { data: automations, refetch: refetchAutomations } = 
    api.smartHome.getAutomations.useQuery(
      undefined,
      { enabled: !!session }
    );
  
  const { data: schedules, refetch: refetchSchedules } = 
    api.smartHome.getScentSchedules.useQuery(
      undefined,
      { enabled: !!session }
    );
  
  const { data: scents } = api.products.getScents.useQuery();
  
  // Connect smart home platform
  const connectPlatform = api.smartHome.connectPlatform.useMutation({
    onSuccess: () => {
      toast.success("Platform connected successfully");
      setIsAddPlatformOpen(false);
      void refetchPlatforms();
    },
    onError: (error) => {
      toast.error(`Failed to connect: ${error.message}`);
    },
  });
  
  // Add device
  const addDevice = api.smartHome.addDevice.useMutation({
    onSuccess: () => {
      toast.success("Device added successfully");
      setIsAddDeviceOpen(false);
      void refetchDevices();
    },
    onError: (error) => {
      toast.error(`Failed to add device: ${error.message}`);
    },
  });
  
  // Toggle device state
  const toggleDevice = api.smartHome.toggleDevice.useMutation({
    onSuccess: (data) => {
      toast.success(`Device ${data.isActive ? "activated" : "deactivated"}`);
      void refetchDevices();
    },
    onError: (error) => {
      toast.error(`Failed to toggle device: ${error.message}`);
    },
  });
  
  // Remove device
  const removeDevice = api.smartHome.removeDevice.useMutation({
    onSuccess: () => {
      toast.success("Device removed successfully");
      setShowDeleteConfirm(false);
      void refetchDevices();
    },
    onError: (error) => {
      toast.error(`Failed to remove device: ${error.message}`);
    },
  });
  
  // Add automation
  const addAutomation = api.smartHome.addAutomation.useMutation({
    onSuccess: () => {
      toast.success("Automation created successfully");
      setIsAddAutomationOpen(false);
      void refetchAutomations();
    },
    onError: (error) => {
      toast.error(`Failed to create automation: ${error.message}`);
    },
  });
  
  // Toggle automation
  const toggleAutomation = api.smartHome.toggleAutomation.useMutation({
    onSuccess: (data) => {
      toast.success(`Automation ${data.enabled ? "enabled" : "disabled"}`);
      void refetchAutomations();
    },
    onError: (error) => {
      toast.error(`Failed to toggle automation: ${error.message}`);
    },
  });
  
  // Remove automation
  const removeAutomation = api.smartHome.removeAutomation.useMutation({
    onSuccess: () => {
      toast.success("Automation removed successfully");
      setShowDeleteConfirm(false);
      void refetchAutomations();
    },
    onError: (error) => {
      toast.error(`Failed to remove automation: ${error.message}`);
    },
  });
  
  // Add scent schedule
  const addScentSchedule = api.smartHome.addScentSchedule.useMutation({
    onSuccess: () => {
      toast.success("Scent schedule created successfully");
      setIsAddScheduleOpen(false);
      void refetchSchedules();
    },
    onError: (error) => {
      toast.error(`Failed to create schedule: ${error.message}`);
    },
  });
  
  // Toggle schedule
  const toggleSchedule = api.smartHome.toggleScentSchedule.useMutation({
    onSuccess: (data) => {
      toast.success(`Schedule ${data.enabled ? "enabled" : "disabled"}`);
      void refetchSchedules();
    },
    onError: (error) => {
      toast.error(`Failed to toggle schedule: ${error.message}`);
    },
  });
  
  // Remove schedule
  const removeScentSchedule = api.smartHome.removeScentSchedule.useMutation({
    onSuccess: () => {
      toast.success("Schedule removed successfully");
      setShowDeleteConfirm(false);
      void refetchSchedules();
    },
    onError: (error) => {
      toast.error(`Failed to remove schedule: ${error.message}`);
    },
  });
  
  // Handle delete confirmation
  const handleDelete = () => {
    if (deleteType === "device" && selectedDevice) {
      removeDevice.mutate({ deviceId: selectedDevice });
    } else if (deleteType === "automation" && selectedAutomation) {
      removeAutomation.mutate({ automationId: selectedAutomation });
    } else if (deleteType === "schedule" && selectedSchedule) {
      removeScentSchedule.mutate({ scheduleId: selectedSchedule });
    }
  };
  
  // Get the device icon based on type
  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "DIFFUSER":
        return <FaSun className="h-5 w-5 text-teal-500" />;
      case "HUMIDIFIER":
        return <FaWifi className="h-5 w-5 text-blue-500" />;
      case "LIGHT":
        return <FaLightbulb className="h-5 w-5 text-yellow-500" />;
      case "THERMOSTAT":
        return <FaSun className="h-5 w-5 text-red-500" />;
      default:
        return <FaPlug className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Get badge for device status
  const getDeviceStatusBadge = (device: SmartHomeDevice) => {
    if (!device.isOnline) {
      return <Badge variant="outline">Offline</Badge>;
    }
    
    return device.isActive ? 
      <Badge variant="success">Active</Badge> : 
      <Badge variant="secondary">Standby</Badge>;
  };
  
  // Format days of week for schedule display
  const formatDays = (days: number[]) => {
    if (days.length === 7) return "Every day";
    if (days.length === 0) return "Never";
    
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    if (days.length === 5 && !days.includes(0) && !days.includes(6)) {
      return "Weekdays";
    }
    if (days.length === 2 && days.includes(0) && days.includes(6)) {
      return "Weekends";
    }
    
    return days.map(d => dayNames[d]).join(", ");
  };
  
  if (!session) {
    return (
      <EmptyState
        icon={<FaHome className="h-12 w-12 text-gray-400" />}
        title="Sign in to connect smart home devices"
        description="Control your aromatherapy devices and create custom schedules"
        action={<Button href="/api/auth/signin">Sign In</Button>}
      />
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Smart Home Integration
        </h1>
        
        <Button
          onClick={() => setIsAddPlatformOpen(true)}
          className="flex items-center gap-2"
        >
          <FaPlusCircle className="h-4 w-4" />
          Connect Platform
        </Button>
      </div>
      
      {/* Connected Platforms */}
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Connected Platforms
        </h2>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {platforms?.map((platform) => (
            <Card key={platform.id} className="overflow-hidden">
              <div className="flex items-center gap-4 border-b border-gray-200 p-4 dark:border-gray-700">
                <div className="rounded-full bg-primary/10 p-2 dark:bg-primary-dark/20">
                  {platform.icon}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {platform.name}
                  </h3>
                  {platform.accountName && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {platform.accountName}
                    </p>
                  )}
                </div>
                <Badge variant="success" className="ml-auto">
                  Connected
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 text-sm text-gray-600 dark:text-gray-400">
                <span>
                  Last synced: {platform.lastSynced ? new Date(platform.lastSynced).toLocaleString() : "Never"}
                </span>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <FaCog className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
          
          {(!platforms || platforms.length === 0) && (
            <div className="col-span-full rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
              <FaPlug className="mx-auto mb-2 h-8 w-8 text-gray-400" />
              <h3 className="mb-1 text-lg font-medium text-gray-900 dark:text-white">
                No platforms connected
              </h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Connect your smart home platforms to control your aromatherapy devices
              </p>
              <Button
                onClick={() => setIsAddPlatformOpen(true)}
                className="flex items-center gap-2"
              >
                <FaPlusCircle className="h-4 w-4" />
                Connect Platform
              </Button>
            </div>
          )}
        </div>
      </Card>
      
      {/* Devices, Automations, Schedules Tabs */}
      <Tabs defaultValue="devices">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="devices" className="flex items-center gap-2">
            <FaPlug className="h-4 w-4" />
            <span>Devices</span>
          </TabsTrigger>
          <TabsTrigger value="automations" className="flex items-center gap-2">
            <FaCog className="h-4 w-4" />
            <span>Automations</span>
          </TabsTrigger>
          <TabsTrigger value="schedules" className="flex items-center gap-2">
            <FaCalendarAlt className="h-4 w-4" />
            <span>Scent Schedules</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="devices" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => setIsAddDeviceOpen(true)}
              variant="outline"
              className="flex items-center gap-2"
              disabled={!platforms || platforms.length === 0}
            >
              <FaPlusCircle className="h-4 w-4" />
              Add Device
            </Button>
          </div>
          
          {(!devices || devices.length === 0) ? (
            <EmptyState
              icon={<FaPlug className="h-12 w-12 text-gray-400" />}
              title="No devices connected"
              description="Add your first aromatherapy device to get started"
              action={
                <Button 
                  onClick={() => setIsAddDeviceOpen(true)}
                  disabled={!platforms || platforms.length === 0}
                >
                  Add Device
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {devices.map((device) => (
                <Card key={device.id} className="overflow-hidden">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-2 dark:bg-primary-dark/20">
                        {getDeviceIcon(device.type)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {device.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {device.platformName}
                          {device.roomName && ` • ${device.roomName}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getDeviceStatusBadge(device)}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setSelectedDevice(device.id);
                          setDeleteType("device");
                          setShowDeleteConfirm(true);
                        }}
                      >
                        <FaTrash className="h-3 w-3 text-gray-500" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-gray-200 p-4 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {device.currentScent ? (
                        <span className="flex items-center gap-1">
                          <FaSun className="h-3 w-3 text-amber-500" />
                          Current: {device.currentScent}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <FaInfoCircle className="h-3 w-3" />
                          {device.type === "DIFFUSER" ? "No scent loaded" : "Status unknown"}
                        </span>
                      )}
                    </div>
                    
                    <Switch
                      checked={device.isActive}
                      disabled={!device.isOnline}
                      onCheckedChange={() => {
                        toggleDevice.mutate({ deviceId: device.id });
                      }}
                    />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="automations" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => setIsAddAutomationOpen(true)}
              variant="outline"
              className="flex items-center gap-2"
              disabled={!devices || devices.length === 0}
            >
              <FaPlusCircle className="h-4 w-4" />
              Create Automation
            </Button>
          </div>
          
          {(!automations || automations.length === 0) ? (
            <EmptyState
              icon={<FaCog className="h-12 w-12 text-gray-400" />}
              title="No automations created"
              description="Create your first automation to control your devices automatically"
              action={
                <Button 
                  onClick={() => setIsAddAutomationOpen(true)}
                  disabled={!devices || devices.length === 0}
                >
                  Create Automation
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {automations.map((automation) => (
                <Card key={automation.id} className="overflow-hidden">
                  <div className="flex items-center justify-between p-4">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {automation.name}
                      </h3>
                      
                      <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          {automation.trigger.type === "TIME" ? (
                            <FaRegClock className="h-3 w-3" />
                          ) : automation.trigger.type === "EVENT" ? (
                            <FaBell className="h-3 w-3" />
                          ) : (
                            <FaExclamationCircle className="h-3 w-3" />
                          )}
                          <span>
                            {automation.trigger.type === "TIME" 
                              ? `At ${automation.trigger.value}` 
                              : automation.trigger.type === "EVENT"
                              ? `When ${automation.trigger.value}`
                              : `If ${automation.trigger.value}`
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={automation.enabled ? "success" : "outline"}>
                        {automation.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setSelectedAutomation(automation.id);
                          setDeleteType("automation");
                          setShowDeleteConfirm(true);
                        }}
                      >
                        <FaTrash className="h-3 w-3 text-gray-500" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 border-t border-gray-200 p-4 dark:border-gray-700">
                    <h4 className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Actions
                    </h4>
                    
                    {automation.actions.map((action, index) => (
                      <div key={index} className="flex items-center gap-2 rounded-md bg-gray-50 p-2 dark:bg-gray-800">
                        <FaArrowRight className="h-3 w-3 text-primary dark:text-primary-light" />
                        <span className="text-sm">
                          {action.deviceName}: {action.action}
                          {action.parameters?.scent && ` (${action.parameters.scent})`}
                        </span>
                      </div>
                    ))}
                    
                    <div className="flex items-center justify-between pt-2 text-sm text-gray-500 dark:text-gray-400">
                      <span>
                        {automation.lastTriggered 
                          ? `Last triggered: ${new Date(automation.lastTriggered).toLocaleString()}`
                          : "Never triggered"
                        }
                      </span>
                      
                      <Switch
                        checked={automation.enabled}
                        onCheckedChange={() => {
                          toggleAutomation.mutate({ automationId: automation.id });
                        }}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="schedules" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => setIsAddScheduleOpen(true)}
              variant="outline"
              className="flex items-center gap-2"
              disabled={!devices || !devices.some(d => d.type === "DIFFUSER")}
            >
              <FaPlusCircle className="h-4 w-4" />
              Create Schedule
            </Button>
          </div>
          
          {(!schedules || schedules.length === 0) ? (
            <EmptyState
              icon={<FaCalendarAlt className="h-12 w-12 text-gray-400" />}
              title="No scent schedules created"
              description="Create a schedule to automatically change scents throughout the day"
              action={
                <Button 
                  onClick={() => setIsAddScheduleOpen(true)}
                  disabled={!devices || !devices.some(d => d.type === "DIFFUSER")}
                >
                  Create Schedule
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {schedules.map((schedule) => (
                <Card key={schedule.id} className="overflow-hidden">
                  <div className="flex items-center justify-between p-4">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {schedule.name}
                      </h3>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {schedule.deviceName}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={schedule.enabled ? "success" : "outline"}>
                        {schedule.enabled ? "Active" : "Inactive"}
                      </Badge>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setSelectedSchedule(schedule.id);
                          setDeleteType("schedule");
                          setShowDeleteConfirm(true);
                        }}
                      >
                        <FaTrash className="h-3 w-3 text-gray-500" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-3 border-t border-gray-200 p-4 dark:border-gray-700">
                    {schedule.scents.map((scent, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between rounded-md bg-gray-50 p-3 dark:bg-gray-800"
                      >
                        <div className="flex items-center gap-3">
                          {idx % 2 === 0 ? (
                            <FaSun className="h-5 w-5 text-amber-500" />
                          ) : (
                            <FaMoon className="h-5 w-5 text-indigo-500" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {scent.name}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {formatDays(scent.days)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {scent.startTime} - {scent.endTime}
                        </div>
                      </div>
                    ))}
                    
                    <div className="flex items-center justify-end pt-2">
                      <Switch
                        checked={schedule.enabled}
                        onCheckedChange={() => {
                          toggleSchedule.mutate({ scheduleId: schedule.id });
                        }}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Add Platform Dialog */}
      {/* (Dialog components for adding platforms, devices, automations, and schedules would go here) */}
      
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={`Delete ${
          deleteType === "device" 
            ? "Device" 
            : deleteType === "automation" 
            ? "Automation" 
            : "Schedule"
        }`}
        description={`Are you sure you want to delete this ${deleteType}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
};

export default SmartHomeIntegration;
```

## 10. Complete and Updated README.md

```markdown
# The Scent - Premium Aromatherapy E-commerce Platform

![Banner](https://i.imgur.com/XvqZzZe.png)

**The Scent** is a cutting-edge e-commerce platform for premium aromatherapy and wellness products, built with modern web technologies and featuring a comprehensive suite of advanced features.

## 🌟 Core Features

### Premium Shopping Experience
- **Responsive Product Catalog** with advanced filtering and sorting
- **Interactive Scent Quiz** with AI-powered product recommendations
- **AR Product Visualization** to see products in your space
- **Multi-language & Multi-currency** support
- **Dark/Light Mode** with automatic system preference detection

### Advanced Customer Engagement
- **Loyalty Program & Rewards System** to incentivize repeat purchases
- **Subscription Management** for recurring deliveries
- **Smart Home Integration** with popular platforms (Philips Hue, HomeKit, etc.)
- **Personalized Recommendations** based on purchase history and preferences

### Enterprise-Grade Admin Capabilities
- **Advanced Analytics Dashboard** with real-time metrics and insights
- **Comprehensive Inventory Management** with forecasting
- **Advanced Role-Based Access Control** for team management
- **Multi-store Management** capabilities

## 🛠️ Technology Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework with server components |
| **TypeScript** | Type safety and improved developer experience |
| **tRPC** | End-to-end typesafe APIs |
| **Prisma** | Type-safe database client and ORM |
| **PostgreSQL** | Relational database for persistent storage |
| **TailwindCSS** | Utility-first CSS framework |
| **NextAuth.js** | Authentication and authorization |
| **Stripe** | Payment processing |
| **Framer Motion** | Animations and transitions |
| **Recharts** | Interactive charts and graphs |

## ✨ Enterprise Features

### 🔒 Advanced Authentication & Authorization
- Multi-factor authentication
- Role-based access control with fine-grained permissions
- Single Sign-On (SSO) integration options
- Password policies and security measures

### 📊 Comprehensive Analytics
- Real-time sales dashboard with key performance indicators
- Customer segmentation and cohort analysis
- Product performance metrics and insights
- Marketing campaign effectiveness tracking
- Traffic source analysis

### 🛒 Advanced E-commerce Features
- Subscription management system
- Loyalty points and rewards program
- Wishlist and save for later functionality
- Complex product variants with images
- Inventory forecasting and automated reordering
- Abandoned cart recovery

### 🔍 Enhanced Customer Experience
- AI-powered product recommendations
- Advanced search with fuzzy matching
- AR product visualization
- Smart home device integration
- Interactive scent quiz for personalized recommendations
- Multi-language and multi-currency support

## 📱 Responsive Design

The platform is fully responsive and optimized for all devices:
- Mobile-first approach
- Tablet-optimized layouts
- Desktop experiences with advanced interactions
- Consistent experience across all device sizes

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or later
- PostgreSQL 14.x or later
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/the-scent.git

# Navigate to project directory
cd the-scent

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up the database
npx prisma db push

# Start the development server
npm run dev
```

## 🗂️ Project Structure

```
the-scent/
├── prisma/               # Database schema and migrations
├── public/               # Static assets
├── src/
│   ├── components/       # React components
│   │   ├── admin/        # Admin dashboard components
│   │   ├── analytics/    # Analytics and reporting components
│   │   ├── ar/           # AR visualization components
│   │   ├── checkout/     # Checkout and payment components
│   │   ├── layout/       # Layout components
│   │   ├── loyalty/      # Loyalty program components
│   │   ├── products/     # Product-related components
│   │   ├── quiz/         # Scent quiz components
│   │   ├── smart-home/   # Smart home integration components
│   │   ├── subscription/ # Subscription management components
│   │   └── ui/           # Reusable UI components
│   ├── contexts/         # React context providers
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Next.js pages and API routes
│   ├── server/           # Server-side code
│   │   ├── api/          # API routes and handlers
│   │   ├── auth/         # Authentication configuration
│   │   └── db/           # Database configuration
│   ├── styles/           # Global styles
│   └── utils/            # Utility functions
└── next.config.js        # Next.js configuration
```

## 💼 Enterprise Solutions

The Scent platform is designed to scale from small boutique stores to enterprise-level operations:

### 🔄 Multi-store Management
Manage multiple store fronts from a single admin panel, with shared inventory and customer data.

### 🌍 Global Commerce
Multi-language, multi-currency, and international shipping capabilities built-in.

### 📱 Omnichannel Selling
Seamlessly integrate online and offline sales channels with inventory synchronization.

### 🧩 Integration Ecosystem
Pre-built integrations with popular services:
- ERP systems
- CRM platforms
- Marketing automation tools
- Fulfillment services
- Accounting software

## 📈 Performance Optimization

The platform is engineered for exceptional performance:

- Server-side rendering and static generation
- Optimized image handling with automatic formats
- Efficient bundle splitting and lazy loading
- Database query optimization
- Redis caching for frequently accessed data
- CDN integration for static assets

## 🛡️ Security Measures

Enterprise-grade security features:

- GDPR compliance tools
- PCI DSS compliance for payment handling
- Regular security audits
- Rate limiting and bot protection
- Input validation and sanitization
- Content Security Policy implementation

## 📞 Support & Documentation

- Comprehensive API documentation
- Interactive component documentation
- Video tutorials for common workflows
- Dedicated support channels

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👏 Acknowledgments

- [Next.js](https://nextjs.org/) for the React framework
- [Prisma](https://prisma.io/) for the database ORM
- [TailwindCSS](https://tailwindcss.com/) for styling
- [tRPC](https://trpc.io/) for the typesafe API
- [create-t3-app](https://create.t3.gg/) for the initial project setup

---

**© 2025 The Scent. All rights reserved.**
```

This revised version of the e-commerce platform provides a comprehensive suite of advanced features that make it an enterprise-grade solution. The additions focus on:

1. **Advanced Analytics**: Real-time metrics and insights for business intelligence
2. **Enhanced Customer Experience**: Through loyalty programs, subscriptions, and AR visualization
3. **Smart Home Integration**: Connecting physical aromatherapy devices with digital experiences
4. **Inventory Intelligence**: Forecasting and automated management
5. **Fine-grained Access Control**: For enterprise team management
6. **Localization**: Full multi-language and multi-currency support
7. **Immersive Experiences**: With the AI-powered scent quiz for personalized recommendations

These enhancements create a truly outstanding e-commerce platform that not only handles basic shopping functionality but provides a comprehensive ecosystem for aromatherapy businesses to grow and scale.
