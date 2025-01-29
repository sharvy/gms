import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Filter,
  X,
  Edit,
  Trash2,
} from "lucide-react";

type Job = {
  id: string;
  vehicle_id: string;
  service_id: string;
  mechanic_id: string;
  vehicle: {
    make: string;
    model: string;
    license_plate: string;
  };
  service: {
    name: string;
  };
  mechanic: {
    name: string;
  };
  status: string;
  scheduled_date: string;
  total_cost: number;
  created_at: string;
};

type NewJobFormData = {
  vehicle_id: string | "";
  service_id: string | "";
  mechanic_id: string | "";
  scheduled_date: string;
  total_cost: number;
};

const Jobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false);
  const [isEditJobModalOpen, setIsEditJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [vehicles, setVehicles] = useState<
    Array<{ id: string; make: string; model: string; license_plate: string }>
  >([]);
  const [services, setServices] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [mechanics, setMechanics] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [formData, setFormData] = useState<NewJobFormData>({
    vehicle_id: "",
    service_id: "",
    mechanic_id: "",
    scheduled_date: "",
    total_cost: 0,
  });

  useEffect(() => {
    fetchJobs();
    fetchDropdownData();
  }, [filter]);

  const fetchDropdownData = async () => {
    try {
      const [vehiclesData, servicesData, mechanicsData] = await Promise.all([
        supabase.from("vehicles").select("id, make, model, license_plate"),
        supabase.from("services").select("id, name"),
        supabase.from("mechanics").select("id, name"),
      ]);

      if (vehiclesData.data) setVehicles(vehiclesData.data);
      if (servicesData.data) setServices(servicesData.data);
      if (mechanicsData.data) setMechanics(mechanicsData.data);
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from("jobs")
        .insert([
          {
            vehicle_id: formData.vehicle_id,
            service_id: formData.service_id,
            mechanic_id: formData.mechanic_id,
            scheduled_date: formData.scheduled_date,
            total_cost: formData.total_cost,
            status: "pending",
          },
        ])
        .select();

      if (error) throw error;

      setIsNewJobModalOpen(false);
      setFormData({
        vehicle_id: "",
        service_id: "",
        mechanic_id: "",
        scheduled_date: "",
        total_cost: 0,
      });
      fetchJobs();
    } catch (error) {
      console.error("Error creating job:", error);
    }
  };

  const fetchJobs = async () => {
    try {
      const query = supabase
        .from("jobs")
        .select(
          `
          id,
          status,
          scheduled_date,
          total_cost,
          created_at,
          vehicle:vehicles(make, model, license_plate),
          service:services(name),
          mechanic:mechanics(name)
        `
        )
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query.eq("status", filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "in_progress":
        return <AlertCircle className="w-4 h-4" />;
      case "completed":
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const updateJobStatus = async (jobId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("jobs")
        .update({ status })
        .eq("id", jobId);

      if (error) throw error;
      fetchJobs();
    } catch (error) {
      console.error("Error updating job status:", error);
    }
  };

  const deleteJob = async (jobId: string) => {
    if (window.confirm("Are you sure you want to delete this job?")) {
      try {
        const { error } = await supabase.from("jobs").delete().eq("id", jobId);

        if (error) throw error;
        fetchJobs();
      } catch (error) {
        console.error("Error deleting job:", error);
      }
    }
  };

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    setFormData({
      vehicle_id: job.vehicle_id,
      service_id: job.service_id,
      mechanic_id: job.mechanic_id,
      scheduled_date: job.scheduled_date.split("T")[0],
      total_cost: job.total_cost,
    });
    setIsEditJobModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;

    try {
      const { error } = await supabase
        .from("jobs")
        .update({
          ...formData,
        })
        .eq("id", editingJob.id);

      if (error) throw error;

      setIsEditJobModalOpen(false);
      setEditingJob(null);
      setFormData({
        vehicle_id: "",
        service_id: "",
        mechanic_id: "",
        scheduled_date: "",
        total_cost: 0,
      });
      fetchJobs();
    } catch (error) {
      console.error("Error updating job:", error);
    }
  };

  const handleSelectChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    field: keyof NewJobFormData
  ) => {
    const value = e.target.value;
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Workshop Jobs</h1>
        <button
          onClick={() => setIsNewJobModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Job
        </button>
      </div>

      {isNewJobModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">New Job</h2>
              <button onClick={() => setIsNewJobModalOpen(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Vehicle
                  </label>
                  <select
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={formData.vehicle_id}
                    onChange={(e) => handleSelectChange(e, "vehicle_id")}
                  >
                    <option value="">Select a vehicle</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.make} {vehicle.model} - {vehicle.license_plate}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Service
                  </label>
                  <select
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={formData.service_id}
                    onChange={(e) => handleSelectChange(e, "service_id")}
                  >
                    <option value="">Select a service</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Mechanic
                  </label>
                  <select
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={formData.mechanic_id}
                    onChange={(e) => handleSelectChange(e, "mechanic_id")}
                  >
                    <option value="">Select a mechanic</option>
                    {mechanics.map((mechanic) => (
                      <option key={mechanic.id} value={mechanic.id}>
                        {mechanic.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={formData.scheduled_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scheduled_date: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Total Cost
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={formData.total_cost}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        total_cost: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsNewJobModalOpen(false)}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditJobModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Job</h2>
              <button onClick={() => setIsEditJobModalOpen(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Vehicle
                  </label>
                  <select
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={formData.vehicle_id}
                    onChange={(e) => handleSelectChange(e, "vehicle_id")}
                  >
                    <option value="">Select a vehicle</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.make} {vehicle.model} - {vehicle.license_plate}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Service
                  </label>
                  <select
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={formData.service_id}
                    onChange={(e) => handleSelectChange(e, "service_id")}
                  >
                    <option value="">Select a service</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Mechanic
                  </label>
                  <select
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={formData.mechanic_id}
                    onChange={(e) => handleSelectChange(e, "mechanic_id")}
                  >
                    <option value="">Select a mechanic</option>
                    {mechanics.map((mechanic) => (
                      <option key={mechanic.id} value={mechanic.id}>
                        {mechanic.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={formData.scheduled_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scheduled_date: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Total Cost
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={formData.total_cost}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        total_cost: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditJobModalOpen(false)}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search jobs..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative">
          <Filter className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-10 pr-8 py-2 border rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading jobs...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mechanic
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scheduled Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {job.vehicle.make} {job.vehicle.model}
                      </div>
                      <div className="text-sm text-gray-500">
                        {job.vehicle.license_plate}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {job.service.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {job.mechanic.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          job.status
                        )}`}
                      >
                        {getStatusIcon(job.status)}
                        <span className="ml-1 capitalize">
                          {job.status.replace("_", " ")}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(job.scheduled_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${job.total_cost?.toFixed(2) || "0.00"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateJobStatus(job.id, "pending")}
                          className="text-yellow-600 hover:text-yellow-800"
                          title="Mark as Pending"
                        >
                          <Clock className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => updateJobStatus(job.id, "in_progress")}
                          className="text-blue-600 hover:text-blue-800"
                          title="Mark as In Progress"
                        >
                          <AlertCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => updateJobStatus(job.id, "completed")}
                          className="text-green-600 hover:text-green-800"
                          title="Mark as Completed"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => updateJobStatus(job.id, "cancelled")}
                          className="text-red-600 hover:text-red-800"
                          title="Mark as Cancelled"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(job)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit Job"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => deleteJob(job.id)}
                          className="text-gray-600 hover:text-gray-800"
                          title="Delete Job"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;
