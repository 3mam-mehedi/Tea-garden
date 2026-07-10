import { useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  Search,
  Plus,
  Filter,
  Package,
  Boxes,
  TriangleAlert,
  CircleOff,
  Pencil,
  Trash2,
  Eye,
  Download,
  Upload,
  X,
  ImagePlus,
} from "lucide-react";

export default function Products() {
  const [search, setSearch] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [preview, setPreview] = useState("");

  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    buy: "",
    sell: "",
    stock: "",
    status: "In Stock",
    image: "",
  });

  const [products, setProducts] = useState([
    {
      id: 1,
      name: "Milk Tea",
      category: "Tea",
      buy: 25,
      sell: 40,
      stock: 120,
      status: "In Stock",
      image:
        "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=300",
    },
    {
      id: 2,
      name: "Black Tea",
      category: "Tea",
      buy: 18,
      sell: 30,
      stock: 80,
      status: "In Stock",
      image:
        "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300",
    },
    {
      id: 3,
      name: "Coffee",
      category: "Coffee",
      buy: 40,
      sell: 60,
      stock: 55,
      status: "In Stock",
      image:
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300",
    },
    {
      id: 4,
      name: "Chocolate Cake",
      category: "Bakery",
      buy: 55,
      sell: 80,
      stock: 8,
      status: "Low Stock",
      image:
        "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300",
    },
    {
      id: 5,
      name: "Toast Biscuit",
      category: "Bakery",
      buy: 10,
      sell: 20,
      stock: 0,
      status: "Out of Stock",
      image:
        "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=300",
    },
  ]);

  const filteredProducts = products.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(products);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Products");

    const excelBuffer = XLSX.write(wb, {
      bookType: "xlsx",
      type: "array",
    });

    const file = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(file, "Products.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    doc.text("Tea Garden Products", 14, 15);

    autoTable(doc, {
      startY: 25,
      head: [["Product", "Category", "Buy", "Sell", "Stock", "Status"]],
      body: products.map((item) => [
        item.name,
        item.category,
        item.buy,
        item.sell,
        item.stock,
        item.status,
      ]),
    });

    doc.save("Products.pdf");
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);

      const workbook = XLSX.read(data, {
        type: "array",
      });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      const result = XLSX.utils.sheet_to_json(sheet);

      setProducts(result);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);

    setPreview(url);

    setNewProduct({
      ...newProduct,
      image: url,
    });
  };

  const addProduct = () => {
    if (!newProduct.name) return;

    setProducts([
      ...products,
      {
        id: Date.now(),
        ...newProduct,
      },
    ]);

    setNewProduct({
      name: "",
      category: "",
      buy: "",
      sell: "",
      stock: "",
      status: "In Stock",
      image: "",
    });

    setPreview("");
    setShowModal(false);
  };
    return (
    <>
      <div className="min-h-screen bg-[#F5F8F6] p-8">

        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          id="importFile"
          className="hidden"
          onChange={handleImport}
        />

        {/* Header */}

        <div className="flex flex-col lg:flex-row justify-between items-center gap-5">

          <div>

            <h1 className="text-4xl font-bold text-[#184E2E]">
              Products
            </h1>

            <p className="text-gray-500 mt-2">
              Manage your tea shop products
            </p>

          </div>

          <div className="flex gap-3 flex-wrap">

            <label
              htmlFor="importFile"
              className="flex items-center gap-2 bg-white px-5 py-3 rounded-xl shadow cursor-pointer"
            >
              <Upload size={18} />
              Import
            </label>

            <div className="relative">

              <button
                onClick={() => setShowExport(!showExport)}
                className="flex items-center gap-2 bg-white px-5 py-3 rounded-xl shadow"
              >
                <Download size={18} />
                Export
              </button>

              {showExport && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border z-50">

                  <button
                    onClick={exportExcel}
                    className="w-full px-4 py-3 text-left hover:bg-gray-100"
                  >
                    📊 Export Excel
                  </button>

                  <button
                    onClick={exportPDF}
                    className="w-full px-4 py-3 text-left hover:bg-gray-100"
                  >
                    📄 Export PDF
                  </button>

                </div>
              )}

            </div>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-[#0B5D2A] text-white px-6 py-3 rounded-xl"
            >
              <Plus size={18} />
              Add Product
            </button>

          </div>

        </div>

        {/* Search */}

        <div className="bg-white rounded-2xl shadow p-5 mt-8">

          <div className="flex gap-4">

            <div className="flex-1 relative">

              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                placeholder="Search Product..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border outline-none focus:border-green-600"
              />

            </div>

            <button className="bg-[#0B5D2A] text-white px-6 rounded-xl flex items-center gap-2">
              <Filter size={18} />
              Filter
            </button>

          </div>

        </div>
               {/* Summary Cards */}

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">

          <div className="bg-white rounded-3xl p-6 shadow">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-500">Total Products</p>
                <h2 className="text-3xl font-bold mt-2">
                  {products.length}
                </h2>
              </div>

              <div className="bg-green-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center">
                <Package />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-500">Categories</p>
                <h2 className="text-3xl font-bold mt-2">
                  {new Set(products.map((p) => p.category)).size}
                </h2>
              </div>

              <div className="bg-blue-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center">
                <Boxes />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-500">Low Stock</p>
                <h2 className="text-3xl font-bold mt-2">
                  {products.filter((p) => Number(p.stock) <= 10 && Number(p.stock) > 0).length}
                </h2>
              </div>

              <div className="bg-orange-500 text-white w-14 h-14 rounded-2xl flex items-center justify-center">
                <TriangleAlert />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-500">Out of Stock</p>
                <h2 className="text-3xl font-bold mt-2">
                  {products.filter((p) => Number(p.stock) === 0).length}
                </h2>
              </div>

              <div className="bg-red-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center">
                <CircleOff />
              </div>
            </div>
          </div>

        </div>

        {/* Products Table */}

        <div className="mt-8 bg-white rounded-3xl shadow overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-[#0B5D2A] text-white">

                <tr>

                  <th className="px-6 py-4 text-left">Image</th>
                  <th className="px-6 py-4 text-left">Product</th>
                  <th className="px-6 py-4 text-left">Category</th>
                  <th className="px-6 py-4 text-center">Buy</th>
                  <th className="px-6 py-4 text-center">Sell</th>
                  <th className="px-6 py-4 text-center">Stock</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Action</th>

                </tr>

              </thead>

              <tbody>

                {filteredProducts.map((item) => (

                  <tr
                    key={item.id}
                    className="border-b hover:bg-green-50 duration-300"
                  >

                    <td className="px-6 py-4">

                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 rounded-2xl object-cover"
                      />

                    </td>

                    <td className="px-6 py-4 font-semibold">
                      {item.name}
                    </td>

                    <td className="px-6 py-4">
                      {item.category}
                    </td>

                    <td className="px-6 py-4 text-center">
                      ৳ {item.buy}
                    </td>

                    <td className="px-6 py-4 text-center text-green-700 font-bold">
                      ৳ {item.sell}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {item.stock}
                    </td>

                    <td className="px-6 py-4 text-center">

                      <span
                        className={`px-3 py-1 rounded-full text-sm
                        ${
                          item.status === "In Stock"
                            ? "bg-green-100 text-green-700"
                            : item.status === "Low Stock"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.status}
                      </span>

                    </td>

                    <td className="px-6 py-4">

                      <div className="flex justify-center gap-2">

                        <button className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600">
                          <Eye className="mx-auto" size={18} />
                        </button>

                        <button className="w-10 h-10 rounded-xl bg-green-100 text-green-700">
                          <Pencil className="mx-auto" size={18} />
                        </button>

                        <button className="w-10 h-10 rounded-xl bg-red-100 text-red-700">
                          <Trash2 className="mx-auto" size={18} />
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>
               {/* Add Product Modal */}

        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">

            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden">

              {/* Header */}

              <div className="flex items-center justify-between px-6 py-5 border-b">

                <h2 className="text-2xl font-bold text-[#184E2E]">
                  Add New Product
                </h2>

                <button
                  onClick={() => setShowModal(false)}
                  className="w-10 h-10 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center"
                >
                  <X size={20} />
                </button>

              </div>

              <div className="p-6 space-y-5">

                {/* Image */}

                <div className="flex justify-center">

                  <label className="cursor-pointer">

                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImage}
                    />

                    {preview ? (
                      <img
                        src={preview}
                        alt=""
                        className="w-36 h-36 rounded-2xl object-cover border-2 border-dashed border-green-600"
                      />
                    ) : (
                      <div className="w-36 h-36 rounded-2xl border-2 border-dashed border-green-500 flex flex-col items-center justify-center text-green-600">

                        <ImagePlus size={40} />
                        <p className="mt-2 text-sm">
                          Upload Image
                        </p>

                      </div>
                    )}

                  </label>

                </div>

                <div className="grid md:grid-cols-2 gap-4">

                  <input
                    type="text"
                    placeholder="Product Name"
                    value={newProduct.name}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        name: e.target.value,
                      })
                    }
                    className="border rounded-xl p-3"
                  />

                  <input
                    type="text"
                    placeholder="Category"
                    value={newProduct.category}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        category: e.target.value,
                      })
                    }
                    className="border rounded-xl p-3"
                  />

                  <input
                    type="number"
                    placeholder="Buy Price"
                    value={newProduct.buy}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        buy: e.target.value,
                      })
                    }
                    className="border rounded-xl p-3"
                  />

                  <input
                    type="number"
                    placeholder="Sell Price"
                    value={newProduct.sell}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        sell: e.target.value,
                      })
                    }
                    className="border rounded-xl p-3"
                  />

                  <input
                    type="number"
                    placeholder="Stock"
                    value={newProduct.stock}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        stock: e.target.value,
                      })
                    }
                    className="border rounded-xl p-3"
                  />

                  <select
                    value={newProduct.status}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        status: e.target.value,
                      })
                    }
                    className="border rounded-xl p-3"
                  >
                    <option>In Stock</option>
                    <option>Low Stock</option>
                    <option>Out of Stock</option>
                  </select>

                </div>

                <div className="flex justify-end gap-3 pt-3">

                  <button
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3 rounded-xl bg-gray-200"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={addProduct}
                    className="px-6 py-3 rounded-xl bg-[#0B5D2A] text-white"
                  >
                    Save Product
                  </button>

                </div>

              </div>

            </div>

          </div>
        )}

      </div>

    </>
  );
}  