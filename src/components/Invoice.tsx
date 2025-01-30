import React from "react";
import { supabase } from "../lib/supabase";
import {
  FileText,
  Printer,
  Download,
  Mail,
  DollarSign,
  Package,
  Clock,
  PenTool as Tool,
} from "lucide-react";
import { format } from "date-fns";

type InvoiceProps = {
  jobId: string;
  onClose: () => void;
};

type JobDetails = {
  id: string;
  completed_at: string;
  total_cost: number;
  notes: string;
  vehicle: {
    make: string;
    model: string;
    year: number;
    license_plate: string;
    customer: {
      name: string;
      email: string;
      phone: string;
      address: string;
    };
  };
  service: {
    name: string;
    base_price: number;
  };
  mechanic: {
    name: string;
    hourly_rate: number;
  };
  parts: {
    name: string;
    quantity: number;
    price_at_time: number;
  }[];
};

const Invoice = ({ jobId, onClose }: InvoiceProps) => {
  const [job, setJob] = React.useState<JobDetails | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select(
          `
          id,
          completed_at,
          total_cost,
          notes,
          vehicle:vehicles (
            make,
            model,
            year,
            license_plate,
            customer:customers (
              name,
              email,
              phone,
              address
            )
          ),
          service:services (
            name,
            base_price
          ),
          mechanic:mechanics (
            name,
            hourly_rate
          ),
          parts:job_parts (
            name:parts_inventory(name),
            quantity,
            price_at_time
          )
        `
        )
        .eq("id", jobId)
        .single();

      if (error) throw error;
      setJob(data);
    } catch (error) {
      console.error("Error fetching job details:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = () => {
    if (!job) return 0;
    const partsTotal = job.parts.reduce(
      (sum, part) => sum + part.price_at_time * part.quantity,
      0
    );
    return job.service.base_price + partsTotal;
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.1; // 10% tax rate
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-center mt-4">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl">
        {/* Invoice Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Invoice</h1>
            <p className="text-gray-600">#{job.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg" title="Print">
              <Printer className="w-5 h-5" />
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Download PDF"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Email Invoice"
            >
              <Mail className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Business & Customer Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-lg font-semibold mb-2">Garage Manager</h2>
            <p className="text-gray-600">123 Auto Street</p>
            <p className="text-gray-600">Mechanic City, MC 12345</p>
            <p className="text-gray-600">+1 (555) 123-4567</p>
            <p className="text-gray-600">service@garagemanager.com</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">Bill To</h2>
            <p className="text-gray-900 font-medium">
              {job.vehicle.customer.name}
            </p>
            <p className="text-gray-600">{job.vehicle.customer.address}</p>
            <p className="text-gray-600">{job.vehicle.customer.phone}</p>
            <p className="text-gray-600">{job.vehicle.customer.email}</p>
          </div>
        </div>

        {/* Service Details */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Service Details</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Vehicle</p>
                <p className="font-medium">
                  {job.vehicle.year} {job.vehicle.make} {job.vehicle.model}
                </p>
                <p className="text-gray-600">
                  License: {job.vehicle.license_plate}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Service Date</p>
                <p className="font-medium">
                  {format(new Date(job.completed_at), "MMMM d, yyyy")}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Service Type</p>
                <p className="font-medium">{job.service.name}</p>
              </div>
              <div>
                <p className="text-gray-600">Mechanic</p>
                <p className="font-medium">{job.mechanic.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Itemized Charges */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Charges</h2>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4">Description</th>
                <th className="text-right p-4">Quantity</th>
                <th className="text-right p-4">Price</th>
                <th className="text-right p-4">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="p-4">
                  <div className="flex items-center">
                    <Tool className="w-4 h-4 mr-2 text-gray-400" />
                    {job.service.name}
                  </div>
                </td>
                <td className="p-4 text-right">1</td>
                <td className="p-4 text-right">
                  ${job.service.base_price.toFixed(2)}
                </td>
                <td className="p-4 text-right">
                  ${job.service.base_price.toFixed(2)}
                </td>
              </tr>
              {job.parts.map((part, index) => (
                <tr key={index}>
                  <td className="p-4">
                    <div className="flex items-center">
                      <Package className="w-4 h-4 mr-2 text-gray-400" />
                      {part.name}
                    </div>
                  </td>
                  <td className="p-4 text-right">{part.quantity}</td>
                  <td className="p-4 text-right">
                    ${part.price_at_time.toFixed(2)}
                  </td>
                  <td className="p-4 text-right">
                    ${(part.price_at_time * part.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="border-t pt-4">
          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">
                  ${calculateSubtotal().toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Tax (10%)</span>
                <span className="font-medium">
                  ${calculateTax().toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {job.notes && (
          <div className="mt-8 border-t pt-4">
            <h2 className="text-lg font-semibold mb-2">Notes</h2>
            <p className="text-gray-600">{job.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Thank you for your business!</p>
          <p>Please contact us if you have any questions about this invoice.</p>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
