import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Car,
  Wrench,
  HardHat as UserHardHat,
  Package,
  Calendar,
} from "lucide-react";

const Sidebar = () => {
  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/customers", icon: Users, label: "Customers" },
    { to: "/vehicles", icon: Car, label: "Vehicles" },
    { to: "/jobs", icon: Wrench, label: "Jobs" },
    { to: "/schedule", icon: Calendar, label: "Schedule" },
    { to: "/mechanics", icon: UserHardHat, label: "Mechanics" },
    { to: "/services", icon: Package, label: "Services" },
    { to: "/parts", icon: Package, label: "Parts" },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white">
      <div className="p-4">
        <h1 className="text-2xl font-bold">Garage Manager</h1>
      </div>
      <nav className="mt-8">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ${
                isActive ? "bg-gray-800 text-white" : ""
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
