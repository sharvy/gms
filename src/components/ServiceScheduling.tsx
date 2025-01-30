import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  Calendar,
  Clock,
  Car,
  User,
  Wrench,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  format,
  addDays,
  startOfWeek,
  addWeeks,
  subWeeks,
  isSameDay,
} from "date-fns";

type Job = {
  id: string;
  scheduled_date: string;
  status: string;
  total_cost: number;
  created_at: string;
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
};

type Service = {
  id: string;
  name: string;
  estimated_hours: number;
  base_price: number;
};

type Mechanic = {
  id: string;
  name: string;
  specialization: string;
};

const ServiceScheduling = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date()));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
    fetchServices();
    fetchMechanics();
  }, [currentWeek]);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
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
        .gte("scheduled_date", format(currentWeek, "yyyy-MM-dd"))
        .lte("scheduled_date", format(addDays(currentWeek, 6), "yyyy-MM-dd"))
        .order("scheduled_date");

      if (error) throw error;
      console.log("Fetched jobs:", data);
      setJobs(data || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    const { data } = await supabase.from("services").select("*").order("name");
    setServices(data || []);
  };

  const fetchMechanics = async () => {
    const { data } = await supabase.from("mechanics").select("*").order("name");
    setMechanics(data || []);
  };

  const weekDays = [...Array(7)].map((_, i) => addDays(currentWeek, i));

  const getJobsForDay = (date: Date) => {
    return jobs.filter((job) => isSameDay(new Date(job.scheduled_date), date));
  };

  return (
    <div className="p-6">
      {/* Calendar Navigation */}
      <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-lg shadow">
        <button
          onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold">
          {format(currentWeek, "MMMM d")} -{" "}
          {format(addDays(currentWeek, 6), "MMMM d, yyyy")}
        </h2>
        <button
          onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading schedule...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="grid grid-cols-7 border-b">
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={`p-4 text-center border-r last:border-r-0 ${
                  isSameDay(day, new Date()) ? "bg-blue-50" : ""
                }`}
              >
                <div className="font-semibold">{format(day, "EEE")}</div>
                <div className="text-gray-500">{format(day, "MMM d")}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {weekDays.map((day) => {
              const dayJobs = getJobsForDay(day);

              return (
                <div
                  key={day.toISOString()}
                  className="p-4 border-r last:border-r-0 min-h-[200px]"
                >
                  {dayJobs.map((job) => (
                    <div
                      key={job.id}
                      className="bg-blue-50 p-2 rounded-lg mb-2 text-sm hover:bg-blue-100 cursor-pointer"
                    >
                      <div className="font-medium mb-1">
                        {job.service.name}
                      </div>
                      <div className="flex items-center text-gray-600 text-xs mb-1">
                        <Car className="w-3 h-3 mr-1" />
                        {job.vehicle.make} {job.vehicle.model}
                      </div>
                      <div className="flex items-center text-gray-600 text-xs mb-1">
                        <User className="w-3 h-3 mr-1" />
                        Status: {job.status}
                      </div>
                      <div className="flex items-center text-gray-600 text-xs">
                        <Wrench className="w-3 h-3 mr-1" />
                        {job.mechanic.name}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceScheduling;
