import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  Users,
  Car,
  Wrench,
  AlertCircle,
  TrendingUp,
  DollarSign,
  CheckCircle,
  Clock,
  Info,
} from "lucide-react";

// Add this type near the top with other imports
type Activity = {
  id: string;
  status: string;
  created_at: string;
  total_cost: string;
  customers: {
    first_name: string;
    last_name: string;
  };
  vehicles: {
    make: string;
    model: string;
  };
};

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    totalCustomers: 0,
    activeVehicles: 0,
    pendingJobs: 0,
    criticalParts: 0,
    monthlyJobs: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Get total customers
        const { count: customersCount } = await supabase
          .from("customers")
          .select("*", { count: "exact", head: true });

        // Get total vehicles (assuming all vehicles are active for now)
        const { count: vehiclesCount } = await supabase
          .from("vehicles")
          .select("*", { count: "exact", head: true });

        // Get monthly jobs and revenue
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        firstDayOfMonth.setHours(0, 0, 0, 0);

        const { count: monthlyJobsCount } = await supabase
          .from("jobs")
          .select("*", { count: "exact", head: true })
          .gte("created_at", firstDayOfMonth.toISOString());

        // Get critical parts count (parts with quantity <= reorder_point)
        const { count: criticalPartsCount } = await supabase
          .from("parts_inventory")
          .select("*")
          .lte("reorder_point", 200);
        // .lte("quantity", "reorder_point");

        console.log("criticalPartsCount:", criticalPartsCount);

        // Get pending jobs (status = 'pending' or 'in_progress')
        const { count: pendingJobsCount } = await supabase
          .from("jobs")
          .select("*", { count: "exact", head: true })
          .in("status", ["pending", "in_progress"]);

        // Get monthly revenue
        const { data: monthlyJobs } = await supabase
          .from("jobs")
          .select("total_cost")
          .gte("created_at", firstDayOfMonth.toISOString())
          .not("total_cost", "is", null);

        // Calculate total revenue
        const monthlyRevenue =
          monthlyJobs?.reduce((sum, job) => {
            console.log("Current job:", job, "Current sum:", sum);
            return sum + (parseFloat(job.total_cost) || 0);
          }, 0) || 0;

        setMetrics({
          totalCustomers: customersCount || 0,
          activeVehicles: vehiclesCount || 0,
          pendingJobs: pendingJobsCount || 0,
          criticalParts: criticalPartsCount || 0,
          monthlyJobs: monthlyJobsCount || 0,
          revenue: monthlyRevenue,
        });

        // Fetch recent activities
        const { data: activities, error } = await supabase
          .from("jobs")
          .select(
            `
            id,
            status,
            created_at,
            total_cost,
            vehicles (
              make,
              model,
              customers (
                name
              )
            )
          `
          )
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) throw error;
        setRecentActivities(activities || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getActivityIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "in_progress":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "pending":
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const renderMetric = (
    icon: React.ReactNode,
    label: string,
    value: number | string,
    color: string
  ) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        {React.cloneElement(icon as React.ReactElement, {
          className: `w-12 h-12 text-${color}-500`,
        })}
        <div className="ml-4">
          <h3 className="text-gray-500 text-sm">{label}</h3>
          <p className="text-2xl font-semibold">
            {loading ? (
              <span className="animate-pulse">Loading...</span>
            ) : typeof value === "number" && label.includes("Revenue") ? (
              `$${value.toLocaleString()}`
            ) : (
              value
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
        {renderMetric(
          <Users />,
          "Total Customers",
          metrics.totalCustomers,
          "blue"
        )}
        {renderMetric(
          <Car />,
          "Active Vehicles",
          metrics.activeVehicles,
          "green"
        )}
        {renderMetric(
          <Wrench />,
          "Pending Jobs",
          metrics.pendingJobs,
          "purple"
        )}
        {renderMetric(
          <AlertCircle />,
          "Critical Parts",
          metrics.criticalParts,
          "red"
        )}
        {renderMetric(
          <TrendingUp />,
          "Monthly Jobs",
          metrics.monthlyJobs,
          "indigo"
        )}
        {renderMetric(
          <DollarSign />,
          "Revenue (MTD)",
          metrics.revenue,
          "yellow"
        )}
      </div>

      {/* Recent Activity Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-4">
              <p className="text-gray-500">Loading activities...</p>
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="p-4">
              <p className="text-gray-500">No recent activities</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center">
                    {getActivityIcon(activity.status)}
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.vehicles.customers.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {activity.vehicles.make} {activity.vehicles.model} -{" "}
                        {activity.status}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <p className="text-sm text-gray-600">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </p>
                      {activity.total_cost && (
                        <p className="text-sm font-medium text-gray-900">
                          ${parseFloat(activity.total_cost).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
