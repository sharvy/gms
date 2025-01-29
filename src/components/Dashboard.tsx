import React, { useState, useEffect } from 'react';
import { supabase } from "../lib/supabase";
import { 
  Users, 
  Car, 
  Wrench, 
  AlertCircle,
  TrendingUp,
  DollarSign 
} from 'lucide-react';

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    totalCustomers: 0,
    activeVehicles: 0,
    pendingJobs: 0,
    criticalParts: 0,
    monthlyJobs: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      try {
        // Get total customers
        const { count: customersCount } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true });

        // Get total vehicles (assuming all vehicles are active for now)
        const { count: vehiclesCount } = await supabase
          .from('vehicles')
          .select('*', { count: 'exact', head: true });

        // Get monthly jobs and revenue
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        firstDayOfMonth.setHours(0, 0, 0, 0);

        const { count: monthlyJobsCount } = await supabase
          .from('jobs')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', firstDayOfMonth.toISOString());

        setMetrics({
          totalCustomers: customersCount || 0,
          activeVehicles: vehiclesCount || 0,
          pendingJobs: 0, // TODO: Add when jobs table is implemented
          criticalParts: 0, // TODO: Add when parts table is implemented
          monthlyJobs: monthlyJobsCount || 0,
          revenue: 0 // TODO: Add when jobs table is implemented
        });
      } catch (error) {
        console.error('Error fetching dashboard metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardMetrics();
  }, []);

  const renderMetric = (icon: React.ReactNode, label: string, value: number | string, color: string) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        {React.cloneElement(icon as React.ReactElement, { className: `w-12 h-12 text-${color}-500` })}
        <div className="ml-4">
          <h3 className="text-gray-500 text-sm">{label}</h3>
          <p className="text-2xl font-semibold">
            {loading ? (
              <span className="animate-pulse">Loading...</span>
            ) : (
              typeof value === 'number' && label.includes('Revenue') 
                ? `$${value.toLocaleString()}` 
                : value
            )}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {renderMetric(<Users />, "Total Customers", metrics.totalCustomers, "blue")}
        {renderMetric(<Car />, "Active Vehicles", metrics.activeVehicles, "green")}
        {renderMetric(<Wrench />, "Pending Jobs", metrics.pendingJobs, "purple")}
        {renderMetric(<AlertCircle />, "Critical Parts", metrics.criticalParts, "red")}
        {renderMetric(<TrendingUp />, "Monthly Jobs", metrics.monthlyJobs, "indigo")}
        {renderMetric(<DollarSign />, "Revenue (MTD)", metrics.revenue, "yellow")}
      </div>

      {/* Recent Activity Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4">
            <p className="text-gray-500">Coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
