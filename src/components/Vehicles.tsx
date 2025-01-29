import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  Car,
  History,
  Plus,
  Search,
  ChevronRight,
  Calendar,
  PenTool as Tool,
  DollarSign,
} from "lucide-react";

type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
  customer: {
    name: string;
    phone: string;
  };
  jobs: {
    id: string;
    service: {
      name: string;
    };
    status: string;
    completed_at: string;
    total_cost: number;
    notes: string;
  }[];
};

const Vehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select(
          `
          id,
          make,
          model,
          year,
          license_plate,
          vin,
          customer:customers(name, phone),
          jobs:jobs(
            id,
            service:services(name),
            status,
            completed_at,
            total_cost,
            notes
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Vehicles</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors">
          <Plus className="w-5 h-5 mr-2" />
          Add Vehicle
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search vehicles by make, model, or license plate..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vehicle List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Vehicle List</h2>
          </div>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading vehicles...</p>
            </div>
          ) : (
            <div className="divide-y">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  onClick={() => setSelectedVehicle(vehicle)}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between ${
                    selectedVehicle?.id === vehicle.id ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-center">
                    <Car className="w-8 h-8 text-gray-400" />
                    <div className="ml-4">
                      <h3 className="text-lg font-medium">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h3>
                      <p className="text-sm text-gray-500">
                        License: {vehicle.license_plate}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Service History */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Service History</h2>
          </div>
          {selectedVehicle ? (
            <div>
              <div className="p-4 bg-gray-50 border-b">
                <h3 className="text-xl font-semibold mb-2">
                  {selectedVehicle.year} {selectedVehicle.make}{" "}
                  {selectedVehicle.model}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">License Plate</p>
                    <p className="font-medium">
                      {selectedVehicle.license_plate}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">VIN</p>
                    <p className="font-medium">{selectedVehicle.vin}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Owner</p>
                    <p className="font-medium">
                      {selectedVehicle.customer.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Contact</p>
                    <p className="font-medium">
                      {selectedVehicle.customer.phone}
                    </p>
                  </div>
                </div>
              </div>
              <div className="divide-y">
                {selectedVehicle.jobs
                  .sort(
                    (a, b) =>
                      new Date(b.completed_at).getTime() -
                      new Date(a.completed_at).getTime()
                  )
                  .map((job) => (
                    <div key={job.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{job.service.name}</h4>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            job.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          {formatDate(job.completed_at)}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Tool className="w-4 h-4 mr-2" />
                          Service
                        </div>
                        <div className="flex items-center text-gray-600">
                          <DollarSign className="w-4 h-4 mr-2" />$
                          {job.total_cost?.toFixed(2) || "0.00"}
                        </div>
                      </div>
                      {job.notes && (
                        <p className="mt-2 text-sm text-gray-600">
                          {job.notes}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <History className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p>Select a vehicle to view its service history</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Vehicles;
