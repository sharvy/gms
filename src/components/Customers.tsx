import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Car,
  Calendar,
} from "lucide-react";

type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
};

type Customer = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
  vehicles: Vehicle[];
};

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    vehicle: {
      make: "",
      model: "",
      year: new Date().getFullYear(),
      license_plate: "",
    },
  });
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    license_plate: "",
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select(
          `
          *,
          vehicles (
            id,
            make,
            model,
            year,
            license_plate
          )
        `
        )
        .order("name");

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery)
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // First, insert the customer
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .insert([
          {
            name: newCustomer.name,
            email: newCustomer.email || null,
            phone: newCustomer.phone || null,
            address: newCustomer.address || null,
          },
        ])
        .select();

      if (customerError) throw customerError;

      if (customerData && customerData[0]) {
        // Then, insert the vehicle if all required fields are filled
        if (
          newCustomer.vehicle.make &&
          newCustomer.vehicle.model &&
          newCustomer.vehicle.license_plate
        ) {
          const { data: vehicleData, error: vehicleError } = await supabase
            .from("vehicles")
            .insert([
              {
                customer_id: customerData[0].id,
                make: newCustomer.vehicle.make,
                model: newCustomer.vehicle.model,
                year: newCustomer.vehicle.year,
                license_plate: newCustomer.vehicle.license_plate,
              },
            ])
            .select();

          if (vehicleError) throw vehicleError;

          // Add the new customer with vehicle to the state
          if (vehicleData) {
            setCustomers([
              ...customers,
              {
                ...customerData[0],
                vehicles: vehicleData,
              },
            ]);
          }
        } else {
          // Add the new customer without vehicle to the state
          setCustomers([
            ...customers,
            {
              ...customerData[0],
              vehicles: [],
            },
          ]);
        }

        // Reset form and close modal
        setIsAddModalOpen(false);
        setNewCustomer({
          name: "",
          email: "",
          phone: "",
          address: "",
          vehicle: {
            make: "",
            model: "",
            year: new Date().getFullYear(),
            license_plate: "",
          },
        });
      }
    } catch (error) {
      console.error("Error adding customer:", error);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    try {
      const { data, error } = await supabase
        .from("vehicles")
        .insert([
          {
            customer_id: selectedCustomer.id,
            make: newVehicle.make,
            model: newVehicle.model,
            year: newVehicle.year,
            license_plate: newVehicle.license_plate,
          },
        ])
        .select();

      if (error) throw error;

      if (data) {
        // Update the selected customer's vehicles in state
        const updatedCustomer = {
          ...selectedCustomer,
          vehicles: [...selectedCustomer.vehicles, ...data],
        };
        setSelectedCustomer(updatedCustomer);
        
        // Update the customers list
        setCustomers(
          customers.map((c) =>
            c.id === selectedCustomer.id ? updatedCustomer : c
          )
        );

        // Reset form and close modal
        setIsAddVehicleModalOpen(false);
        setNewVehicle({
          make: "",
          model: "",
          year: new Date().getFullYear(),
          license_plate: "",
        });
      }
    } catch (error) {
      console.error("Error adding vehicle:", error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Customers</h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Customer
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers by name, email, or phone..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer List */}
        <div className="md:col-span-1 bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Customer List</h2>
          </div>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading customers...</p>
            </div>
          ) : (
            <div className="divide-y max-h-[calc(100vh-250px)] overflow-y-auto">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedCustomer?.id === customer.id ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-gray-400" />
                    <div className="ml-4">
                      <h3 className="font-medium">{customer.name}</h3>
                      <p className="text-sm text-gray-500">
                        {customer.vehicles.length} vehicles
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customer Details */}
        <div className="md:col-span-2 bg-white rounded-lg shadow overflow-hidden">
          {selectedCustomer ? (
            <div>
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold mb-4">
                  {selectedCustomer.name}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-5 h-5 mr-3" />
                    <span>{selectedCustomer.phone || "No phone number"}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Mail className="w-5 h-5 mr-3" />
                    <span>{selectedCustomer.email || "No email"}</span>
                  </div>
                  <div className="flex items-center text-gray-600 md:col-span-2">
                    <MapPin className="w-5 h-5 mr-3" />
                    <span>{selectedCustomer.address || "No address"}</span>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Customer since {formatDate(selectedCustomer.created_at)}
                </div>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Vehicles</h3>
                  <button
                    onClick={() => setIsAddVehicleModalOpen(true)}
                    className="bg-blue-600 text-white px-3 py-1 rounded-lg flex items-center hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Vehicle
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedCustomer.vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <Car className="w-8 h-8 text-gray-400" />
                        <div className="ml-4">
                          <h4 className="font-medium">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </h4>
                          <p className="text-sm text-gray-500">
                            License: {vehicle.license_plate}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p>Select a customer to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add New Customer</h2>
            <form onSubmit={handleAddCustomer}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomer.name}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, name: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, email: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={newCustomer.phone}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, phone: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    type="text"
                    value={newCustomer.address}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        address: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-medium mb-3">
                    Vehicle Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Make
                      </label>
                      <input
                        type="text"
                        value={newCustomer.vehicle.make}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            vehicle: {
                              ...newCustomer.vehicle,
                              make: e.target.value,
                            },
                          })
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Model
                      </label>
                      <input
                        type="text"
                        value={newCustomer.vehicle.model}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            vehicle: {
                              ...newCustomer.vehicle,
                              model: e.target.value,
                            },
                          })
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Year
                      </label>
                      <input
                        type="number"
                        value={newCustomer.vehicle.year}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            vehicle: {
                              ...newCustomer.vehicle,
                              year: parseInt(e.target.value),
                            },
                          })
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        License Plate
                      </label>
                      <input
                        type="text"
                        value={newCustomer.vehicle.license_plate}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            vehicle: {
                              ...newCustomer.vehicle,
                              license_plate: e.target.value,
                            },
                          })
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {isAddVehicleModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Vehicle</h2>
            <form onSubmit={handleAddVehicle}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Make *
                  </label>
                  <input
                    type="text"
                    required
                    value={newVehicle.make}
                    onChange={(e) =>
                      setNewVehicle({ ...newVehicle, make: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Model *
                  </label>
                  <input
                    type="text"
                    required
                    value={newVehicle.model}
                    onChange={(e) =>
                      setNewVehicle({ ...newVehicle, model: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Year
                  </label>
                  <input
                    type="number"
                    value={newVehicle.year}
                    onChange={(e) =>
                      setNewVehicle({
                        ...newVehicle,
                        year: parseInt(e.target.value),
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    License Plate *
                  </label>
                  <input
                    type="text"
                    required
                    value={newVehicle.license_plate}
                    onChange={(e) =>
                      setNewVehicle({
                        ...newVehicle,
                        license_plate: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddVehicleModalOpen(false)}
                  className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
