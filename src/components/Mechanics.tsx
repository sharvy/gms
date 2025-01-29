import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Plus, Search, Edit, Trash2 } from "lucide-react";

type Mechanic = {
  id: string;
  name: string;
  specialization: string;
};

const Mechanics = () => {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMechanic, setSelectedMechanic] = useState<Mechanic | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: "",
    specialization: "",
  });

  useEffect(() => {
    fetchMechanics();
  }, []);

  const fetchMechanics = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("mechanics")
        .select("*")
        .order("name");

      if (error) throw error;
      setMechanics(data || []);
    } catch (error) {
      console.error("Error fetching mechanics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedMechanic) {
        // Update existing mechanic
        const { error } = await supabase
          .from("mechanics")
          .update(formData)
          .eq("id", selectedMechanic.id);
        if (error) throw error;
      } else {
        // Create new mechanic
        const { error } = await supabase.from("mechanics").insert([formData]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      setSelectedMechanic(null);
      setFormData({ name: "", specialization: "" });
      fetchMechanics();
    } catch (error) {
      console.error("Error saving mechanic:", error);
    }
  };

  const handleEdit = (mechanic: Mechanic) => {
    setSelectedMechanic(mechanic);
    setFormData({
      name: mechanic.name,
      specialization: mechanic.specialization,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this mechanic?")) {
      try {
        const { error } = await supabase
          .from("mechanics")
          .delete()
          .eq("id", id);
        if (error) throw error;
        fetchMechanics();
      } catch (error) {
        console.error("Error deleting mechanic:", error);
      }
    }
  };

  const filteredMechanics = mechanics.filter(
    (mechanic) =>
      mechanic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mechanic.specialization.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Mechanic Management</h1>
        <button
          onClick={() => {
            setSelectedMechanic(null);
            setFormData({ name: "", specialization: "" });
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Mechanic
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search mechanics..."
            className="w-full p-2 border rounded-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading mechanics...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Specialization
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMechanics.map((mechanic) => (
                  <tr key={mechanic.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {mechanic.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {mechanic.specialization}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleEdit(mechanic)}
                        className="text-blue-600 hover:text-blue-800 mr-4"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(mechanic.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for adding/editing mechanics */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">
              {selectedMechanic ? "Edit Mechanic" : "Add New Mechanic"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Specialization
                </label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) =>
                    setFormData({ ...formData, specialization: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {selectedMechanic ? "Save Changes" : "Add Mechanic"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mechanics;
