import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  Search,
  Plus,
  Package,
  DollarSign,
  AlertCircle,
  Pencil,
  Trash2,
} from "lucide-react";

type Part = {
  id: string;
  name: string;
  part_number: string | null;
  description: string | null;
  quantity: number;
  unit_price: number;
  reorder_point: number;
  created_at: string;
  updated_at: string;
};

const Parts = () => {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPart, setNewPart] = useState<Partial<Part>>({
    name: "",
    part_number: "",
    description: "",
    quantity: 0,
    unit_price: 0,
    reorder_point: 0,
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);

  useEffect(() => {
    fetchParts();
  }, []);

  const fetchParts = async () => {
    try {
      const { data, error } = await supabase
        .from("parts_inventory")
        .select("*")
        .order("name");

      if (error) throw error;
      setParts(data || []);
    } catch (error) {
      console.error("Error fetching parts:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredParts = parts.filter(
    (part) =>
      part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (part.part_number?.toLowerCase() || "").includes(
        searchQuery.toLowerCase()
      )
  );

  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from("parts_inventory")
        .insert([newPart])
        .select();

      if (error) throw error;

      setParts([...(data || []), ...parts]);
      setShowAddModal(false);
      setNewPart({
        name: "",
        part_number: "",
        description: "",
        quantity: 0,
        unit_price: 0,
        reorder_point: 0,
      });
    } catch (error) {
      console.error("Error adding part:", error);
    }
  };

  const handleEditPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPart) return;

    try {
      const { error } = await supabase
        .from("parts_inventory")
        .update(editingPart)
        .eq("id", editingPart.id);

      if (error) throw error;

      setParts(parts.map((p) => (p.id === editingPart.id ? editingPart : p)));
      setShowEditModal(false);
      setEditingPart(null);
    } catch (error) {
      console.error("Error updating part:", error);
    }
  };

  const handleDeletePart = async (partId: string) => {
    if (!window.confirm("Are you sure you want to delete this part?")) return;

    try {
      const { error } = await supabase
        .from("parts_inventory")
        .delete()
        .eq("id", partId);

      if (error) throw error;

      setParts(parts.filter((p) => p.id !== partId));
    } catch (error) {
      console.error("Error deleting part:", error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Parts Inventory</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Part
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search parts by name or part number..."
            className="pl-10 pr-4 py-2 border rounded-lg w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading parts...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Part Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredParts.map((part) => (
                <tr key={part.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Package className="w-8 h-8 text-gray-400 mr-3" />
                      <div>
                        <div className="font-medium">{part.name}</div>
                        <div className="text-sm text-gray-500">
                          {part.part_number || "No part number"}
                        </div>
                        {part.description && (
                          <div className="text-sm text-gray-500">
                            {part.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      Quantity: {part.quantity}
                      <br />
                      Reorder Point: {part.reorder_point}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                      {part.unit_price.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {part.quantity <= part.reorder_point ? (
                      <div className="flex items-center text-red-600">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Low Stock
                      </div>
                    ) : (
                      <div className="text-green-600">In Stock</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPart(part);
                          setShowEditModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50"
                        title="Edit part"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePart(part.id);
                        }}
                        className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50"
                        title="Delete part"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Part</h2>
            <form onSubmit={handleAddPart}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={newPart.name}
                    onChange={(e) =>
                      setNewPart({ ...newPart, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Part Number
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={newPart.part_number || ""}
                    onChange={(e) =>
                      setNewPart({ ...newPart, part_number: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={newPart.description || ""}
                    onChange={(e) =>
                      setNewPart({ ...newPart, description: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={newPart.quantity}
                      onChange={(e) =>
                        setNewPart({
                          ...newPart,
                          quantity: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Unit Price *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={newPart.unit_price}
                      onChange={(e) =>
                        setNewPart({
                          ...newPart,
                          unit_price: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Reorder Point *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={newPart.reorder_point}
                    onChange={(e) =>
                      setNewPart({
                        ...newPart,
                        reorder_point: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Add Part
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingPart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Part</h2>
            <form onSubmit={handleEditPart}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={editingPart.name}
                    onChange={(e) =>
                      setEditingPart({ ...editingPart, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Part Number
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={editingPart.part_number || ""}
                    onChange={(e) =>
                      setEditingPart({
                        ...editingPart,
                        part_number: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={editingPart.description || ""}
                    onChange={(e) =>
                      setEditingPart({
                        ...editingPart,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={editingPart.quantity}
                      onChange={(e) =>
                        setEditingPart({
                          ...editingPart,
                          quantity: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Unit Price *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={editingPart.unit_price}
                      onChange={(e) =>
                        setEditingPart({
                          ...editingPart,
                          unit_price: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Reorder Point *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={editingPart.reorder_point}
                    onChange={(e) =>
                      setEditingPart({
                        ...editingPart,
                        reorder_point: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingPart(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Parts;
