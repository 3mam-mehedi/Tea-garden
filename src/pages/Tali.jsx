
import { useState, useEffect } from "react";

import {
  Plus,
  Edit2,
  Trash2,
  Wallet,
  Trash,
  FileText,
  Infinity,
  PackageCheck,
} from "lucide-react";

import {
  GiPayMoney,
  GiReceiveMoney,
  GiTakeMyMoney,
} from "react-icons/gi";

import { MdOutlineInventory2 } from "react-icons/md";

import { db } from "../firebase";

import {
  collection,
  doc,
  onSnapshot,
  runTransaction,
  getDocs,
  writeBatch,
} from "firebase/firestore";

export default function Tali() {
  const [transactions, setTransactions] = useState([]);

  const [input, setInput] = useState({
    title: "",
    quantity: "1",
    amount: "",
    type: "income",
  });

  const [selectedProductPrice, setSelectedProductPrice] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [unlimitedProducts, setUnlimitedProducts] = useState([]);
  const [inventoryProducts, setInventoryProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);

  const productsRef = collection(db, "products");
  const transactionsRef = collection(db, "transactions");

  // ==========================================
  // FIREBASE REALTIME DATA LOAD
  // ==========================================

  useEffect(() => {
    let unsubscribeProducts;
    let unsubscribeTransactions;
    let cancelled = false;

    unsubscribeProducts = onSnapshot(
      productsRef,
      (snapshot) => {
        if (cancelled) return;

        const products = snapshot.docs.map((item) => {
          const data = item.data();

          return {
            ...data,
            id: item.id,
            price: Number(data.sell) || 0,
            image: data.image || "/assets/products/rong cha.jpg",
          };
        });

        setUnlimitedProducts(
          products.filter((p) => p.isUnlimited)
        );

        setInventoryProducts(
          products.filter((p) => !p.isUnlimited)
        );
      },
      (error) => {
        console.error("Products Error:", error);
        setLoading(false);
        alert("Products Load Error: " + error.message);
      }
    );

    unsubscribeTransactions = onSnapshot(
      transactionsRef,
      (snapshot) => {
        if (cancelled) return;

        const data = snapshot.docs.map((item) => ({
          ...item.data(),
          id: item.id,
        }));

        data.sort((a, b) => {
          const dateA = a.dateOnly || "";
          const dateB = b.dateOnly || "";

          if (dateA !== dateB) {
            return dateB.localeCompare(dateA);
          }

          return (b.date || "").localeCompare(a.date || "");
        });

        setTransactions(data);
        setLoading(false);
      },
      (error) => {
        console.error("Transactions Error:", error);
        setLoading(false);
        alert("Transactions Load Error: " + error.message);
      }
    );

    return () => {
      cancelled = true;
      unsubscribeProducts?.();
      unsubscribeTransactions?.();
    };
  }, []);

  // ==========================================
  // PRODUCT HELPERS
  // ==========================================

  const getAllProducts = () => [
    ...unlimitedProducts,
    ...inventoryProducts,
  ];

  const getProductByName = (name) => {
    return getAllProducts().find(
      (p) =>
        p.name?.trim().toLowerCase() ===
        name?.trim().toLowerCase()
    );
  };

  const getProductIdByName = (name) => {
    return getProductByName(name)?.id || null;
  };

  // ==========================================
  // STOCK UPDATE HELPER
  // Positive qty = Stock increase
  // Negative qty = Stock decrease
  // ==========================================

  const updateStockInTransaction = async (
    transaction,
    stockChanges
  ) => {
    const combined = {};

    stockChanges.forEach((item) => {
      if (!item.productId) return;

      combined[item.productId] =
        (combined[item.productId] || 0) +
        Number(item.qty || 0);
    });

    const updates = [];

    // সব Product আগে Read
    for (const [productId, qty] of Object.entries(combined)) {
      if (qty === 0) continue;

      const productRef = doc(db, "products", productId);
      const productSnap = await transaction.get(productRef);

      if (!productSnap.exists()) continue;

      const product = productSnap.data();

      if (product.isUnlimited) continue;

      const currentStock = Number(product.stock) || 0;
      const newStock = currentStock + qty;

      if (newStock < 0) {
        throw new Error(
          `${product.name} এর পর্যাপ্ত Stock নেই। বর্তমানে Stock: ${currentStock}`
        );
      }

      updates.push({
        ref: productRef,
        stock: newStock,
      });
    }

    // সব Read শেষ হলে Write
    updates.forEach((item) => {
      transaction.update(item.ref, {
        stock: item.stock,
      });
    });
  };

  // ==========================================
  // GET TRANSACTION STOCK CHANGES
  // ==========================================

  const getIncomeStockChanges = (tx, direction) => {
    if (tx.type !== "income") return [];

    const items = tx.isOrderGroup
      ? tx.items || []
      : [
          {
            name: tx.title,
            productId: tx.productId || getProductIdByName(tx.title),
            qty: Number(tx.quantity) || 1,
          },
        ];

    return items
      .map((item) => ({
        productId:
          item.productId || getProductIdByName(item.name),

        qty: (Number(item.qty) || 1) * direction,
      }))
      .filter((item) => item.productId);
  };

  // ==========================================
  // RESET INPUT
  // ==========================================

  const resetInput = () => {
    setEditingId(null);

    setInput({
      title: "",
      quantity: "1",
      amount: "",
      type: "income",
    });

    setSelectedProductPrice(null);
    setSelectedProductId(null);
  };

  // ==========================================
  // ADD / EDIT TRANSACTION
  // ==========================================

  const addTransaction = async () => {
    if (saving) return;

    if (!input.title.trim() || input.amount === "") {
      alert("Product Name এবং Amount দিতে হবে।");
      return;
    }

    const qtyValue = Number(input.quantity);
    const amountVal = Number(input.amount);

    if (
      !Number.isInteger(qtyValue) ||
      qtyValue <= 0 ||
      !Number.isFinite(amountVal) ||
      amountVal < 0
    ) {
      alert("সঠিক Quantity এবং Amount দাও।");
      return;
    }

    const isIncome = input.type === "income";

    const matchedProduct = getProductByName(input.title);

    const productId =
      selectedProductId || matchedProduct?.id || null;

    if (isIncome && !productId) {
      alert("Income/Sale-এর জন্য সঠিক Product Select করো।");
      return;
    }

    const now = new Date();

    const dateOnly = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");

    const formattedDate =
      `${now.toLocaleDateString()} at ${
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      }`;

    setSaving(true);

    try {
      if (editingId !== null) {
        const transactionRef = doc(
          db,
          "transactions",
          editingId
        );

        const stockChanges = [];

        // পুরোনো Income-এর Stock ফেরত
        const oldTx = transactions.find(
          (t) => t.id === editingId
        );

        if (!oldTx) {
          throw new Error("পুরোনো Transaction পাওয়া যায়নি।");
        }

        if (oldTx.isOrderGroup) {
          throw new Error("POS orders cannot be edited.");
        }

        stockChanges.push(
          ...getIncomeStockChanges(oldTx, 1)
        );

        // নতুন Income হলে Stock কমবে
        if (isIncome && productId) {
          stockChanges.push({
            productId,
            qty: -qtyValue,
          });
        }

        await runTransaction(db, async (transaction) => {
          const oldSnap = await transaction.get(transactionRef);

          if (!oldSnap.exists()) {
            throw new Error("Transaction পাওয়া যায়নি।");
          }

          await updateStockInTransaction(
            transaction,
            stockChanges
          );

          transaction.update(transactionRef, {
            isOrderGroup: false,
            title: input.title.trim(),
            productId: isIncome ? productId : null,
            quantity: qtyValue.toString(),
            amount: amountVal,
            type: input.type,
            date: formattedDate,
            dateOnly,
          });
        });

        resetInput();
      } else {
        const newRef = doc(transactionsRef);

        const stockChanges =
          isIncome && productId
            ? [{ productId, qty: -qtyValue }]
            : [];

        await runTransaction(db, async (transaction) => {
          await updateStockInTransaction(
            transaction,
            stockChanges
          );

          transaction.set(newRef, {
            isOrderGroup: false,
            title: input.title.trim(),
            productId: isIncome ? productId : null,
            quantity: qtyValue.toString(),
            amount: amountVal,
            type: input.type,
            date: formattedDate,
            dateOnly,
          });
        });

        resetInput();
      }
    } catch (error) {
      console.error("Save Transaction Error:", error);
      alert(error.message || "Transaction Save করা যায়নি।");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // EDIT TRANSACTION
  // ==========================================

  const startEdit = (t) => {
    if (t.isOrderGroup) {
      alert("POS orders can be deleted and re-created.");
      return;
    }

    setEditingId(t.id);

    setInput({
      title: t.title || "",
      quantity: t.quantity || "1",
      amount: String(t.amount ?? ""),
      type: t.type || "income",
    });

    const productId =
      t.productId || getProductIdByName(t.title);

    setSelectedProductId(productId);

    const product = getAllProducts().find(
      (p) => p.id === productId
    );

    setSelectedProductPrice(
      product ? product.price : null
    );
  };

  // ==========================================
  // DELETE TRANSACTION
  // ==========================================

  const deleteTransaction = async (id) => {
    if (saving) return;

    const txToDelete = transactions.find(
      (t) => t.id === id
    );

    if (!txToDelete) return;

    const confirmed = window.confirm(
      "এই Transaction Delete করতে চাও?"
    );

    if (!confirmed) return;

    setSaving(true);

    try {
      const transactionRef = doc(
        db,
        "transactions",
        id
      );

      const stockChanges = getIncomeStockChanges(
        txToDelete,
        1
      );

      await runTransaction(db, async (transaction) => {
        const txSnap = await transaction.get(transactionRef);

        if (!txSnap.exists()) {
          throw new Error("Transaction পাওয়া যায়নি।");
        }

        await updateStockInTransaction(
          transaction,
          stockChanges
        );

        transaction.delete(transactionRef);
      });

      if (editingId === id) {
        resetInput();
      }
    } catch (error) {
      console.error("Delete Error:", error);
      alert(error.message || "Delete করা যায়নি।");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // CLEAR ALL TRANSACTIONS
  // History Delete হবে, Stock পরিবর্তন হবে না
  // ==========================================

  const clearAllTransactions = async () => {
    if (clearing || saving) return;

    const confirmed = window.confirm(
      "সতর্কতা! Firebase-এর সব Sales, Income এবং Expense History স্থায়ীভাবে Delete হবে। Products এবং Stock অক্ষত থাকবে। তুমি কি নিশ্চিত?"
    );

    if (!confirmed) return;

    setClearing(true);

    try {
      const snapshot = await getDocs(transactionsRef);

      if (snapshot.empty) {
        alert("কোনো Transaction নেই।");
        return;
      }

      const allDocs = snapshot.docs;

      // Firestore Batch-এ সর্বোচ্চ 500 writes
      for (let i = 0; i < allDocs.length; i += 500) {
        const batch = writeBatch(db);

        const chunk = allDocs.slice(i, i + 500);

        chunk.forEach((item) => {
          batch.delete(item.ref);
        });

        await batch.commit();
      }

      resetInput();

      alert(
        "পুরোনো সব Transaction Delete হয়েছে। Products এবং Stock অপরিবর্তিত আছে।"
      );
    } catch (error) {
      console.error("Clear All Error:", error);

      alert(
        "সব Transaction Delete করা যায়নি: " + error.message
      );
    } finally {
      setClearing(false);
    }
  };

  // ==========================================
  // PRODUCT SELECT
  // ==========================================

  const handleSelectItem = (name, price) => {
    const product = getProductByName(name);

    setSelectedProductPrice(price);
    setSelectedProductId(product?.id || null);

    const qty = Number(input.quantity) || 1;

    setInput({
      title: name,
      quantity: qty.toString(),
      amount: (price * qty).toString(),
      type: "income",
    });
  };

  // ==========================================
  // QUANTITY CHANGE
  // ==========================================

  const handleQuantityChange = (e) => {
    const qty = e.target.value;

    let newAmount = input.amount;

    if (selectedProductPrice !== null && qty !== "") {
      const parsedQty = Number(qty);

      if (Number.isFinite(parsedQty)) {
        newAmount = (
          selectedProductPrice * parsedQty
        ).toString();
      }
    }

    setInput({
      ...input,
      quantity: qty,
      amount: newAmount,
    });
  };

  // ==========================================
  // TITLE CHANGE
  // ==========================================

  const handleTitleChange = (e) => {
    const titleVal = e.target.value;
    const matchedItem = getProductByName(titleVal);

    if (matchedItem) {
      setSelectedProductPrice(matchedItem.price);
      setSelectedProductId(matchedItem.id);

      const qty = Number(input.quantity) || 1;

      setInput({
        ...input,
        title: titleVal,
        amount: (
          matchedItem.price * qty
        ).toString(),
      });
    } else {
      setSelectedProductPrice(null);
      setSelectedProductId(null);

      setInput({
        ...input,
        title: titleVal,
      });
    }
  };

  // ==========================================
  // TOTAL CALCULATION
  // ==========================================

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce(
      (acc, t) => acc + (Number(t.amount) || 0),
      0
    );

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce(
      (acc, t) => acc + (Number(t.amount) || 0),
      0
    );

  const netBalance = totalIncome - totalExpense;

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-emerald-800 font-bold">
        Loading Firebase Data...
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="min-h-[50vh] p-2 sm:p-6 w-full text-gray-800 max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto">

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0b5d2a]">
            Daily Tali & Accounts
          </h1>
        </div>

        {/* Dashboard */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">

          <div className="bg-emerald-500/15 border border-emerald-500/30 text-gray-800 p-3 sm:p-6 rounded-2xl shadow-xl">
            <p className="text-xs sm:text-sm text-emerald-900 font-medium">
              Total Income
            </p>

            <h2 className="text-xl sm:text-3xl font-extrabold text-emerald-700">
              ৳ {totalIncome}
            </h2>
          </div>

          <div className="bg-rose-500/15 border border-rose-500/30 text-gray-800 p-3 sm:p-6 rounded-2xl shadow-xl">
            <p className="text-xs sm:text-sm text-rose-900 font-medium">
              Total Expense
            </p>

            <h2 className="text-xl sm:text-3xl font-extrabold text-rose-700">
              ৳ {totalExpense}
            </h2>
          </div>

          <div className="bg-sky-500/15 border border-sky-500/30 text-gray-800 p-3 sm:p-6 rounded-2xl shadow-xl flex flex-col justify-center">
            <p className="text-xs sm:text-sm text-sky-900 font-medium flex items-center gap-1">
              <Wallet size={14} />
              Remaining Balance
            </p>

            <h2
              className={`text-xl sm:text-3xl font-extrabold ${
                netBalance >= 0
                  ? "text-sky-700"
                  : "text-rose-700"
              }`}
            >
              ৳ {netBalance}
            </h2>
          </div>

        </div>

        {/* Unlimited Stock Items */}

        {unlimitedProducts.length > 0 && (
          <div className="bg-white/75 border border-white/80 p-3 sm:p-4 rounded-2xl shadow-xl mb-4">

            <div className="flex items-center gap-2 mb-2.5 px-1">
              <PackageCheck
                size={20}
                className="text-emerald-700"
              />

              <p className="text-[11px] sm:text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Always Available (Unlimited Stock)
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">

              {unlimitedProducts.map((item) => (
                <div
                  key={item.id}
                  onClick={() =>
                    handleSelectItem(item.name, item.price)
                  }
                  className="flex items-center gap-2 p-2 rounded-xl border border-white/80 bg-white/60 hover:bg-emerald-500/15 hover:border-emerald-500/30 transition-all cursor-pointer group shadow-sm"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-7 h-7 sm:w-8 sm:h-8 object-cover rounded-lg border border-white/60 bg-gray-100 shrink-0"
                  />

                  <div className="overflow-hidden min-w-0">
                    <span className="font-semibold text-[11px] sm:text-xs text-gray-800 group-hover:text-emerald-800 block truncate flex items-center gap-1">
                      {item.name}
                      <Infinity
                        size={15}
                        className="text-emerald-700 shrink-0"
                      />
                    </span>

                    <span className="text-[10px] text-emerald-700 font-bold">
                      ৳{item.price}
                    </span>
                  </div>
                </div>
              ))}

            </div>
          </div>
        )}

        {/* Inventory Items */}

        <div className="bg-white/75 border border-white/80 p-3 sm:p-4 rounded-2xl shadow-xl mb-4 sm:mb-6">

          <div className="flex items-center gap-2 mb-2.5 px-1">
            <MdOutlineInventory2
              size={20}
              className="text-teal-700"
            />

            <p className="text-[11px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">
              Inventory Items (Stock Managed)
            </p>
          </div>

          {inventoryProducts.length === 0 ? (
            <p className="text-xs text-gray-500 px-1 py-2">
              No stock-managed products available.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-60 overflow-y-auto">

              {inventoryProducts.map((p) => {
                const isOutOfStock =
                  Number(p.stock) <= 0 ||
                  p.stock === "" ||
                  p.stock === null ||
                  p.stock === undefined;

                return (
                  <div
                    key={p.id}
                    onClick={() =>
                      !isOutOfStock &&
                      handleSelectItem(p.name, p.price)
                    }
                    className={`flex items-center gap-2 p-2 rounded-xl border transition-all shadow-sm ${
                      isOutOfStock
                        ? "opacity-60 bg-rose-50/80 border-rose-200 cursor-not-allowed"
                        : "border-white/80 bg-white/60 hover:bg-emerald-500/15 hover:border-emerald-500/30 cursor-pointer group"
                    }`}
                  >
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-7 h-7 sm:w-8 sm:h-8 object-cover rounded-lg border border-white/60 bg-gray-100 shrink-0"
                    />

                    <div className="overflow-hidden min-w-0">
                      <span
                        className={`font-semibold text-[11px] sm:text-xs block truncate ${
                          isOutOfStock
                            ? "text-rose-700 font-bold"
                            : "text-gray-800 group-hover:text-emerald-800"
                        }`}
                      >
                        {p.name}
                      </span>

                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-emerald-700 font-bold">
                          ৳{p.price}
                        </span>

                        <span
                          className={`text-[9px] px-1 rounded ${
                            isOutOfStock
                              ? "bg-rose-100 text-rose-700 font-bold"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          Stock: {p.stock || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

            </div>
          )}
        </div>

        {/* Direct Entry Form */}

        <div className="bg-white/75 border border-white/80 p-3 sm:p-4 rounded-2xl shadow-xl mb-4 sm:mb-6">

          <h3 className="text-xs sm:text-sm font-bold text-emerald-900 mb-2">
            {editingId !== null
              ? "Edit Entry"
              : "Direct Sale / Expense Entry"}
          </h3>

          <div className="flex flex-col sm:flex-row gap-2 mb-3">

            <input
              type="text"
              placeholder="Description / Product Name"
              value={input.title}
              onChange={handleTitleChange}
              className="flex-1 bg-white/80 border border-white p-2.5 rounded-xl text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 shadow-sm"
            />

            <div className="grid grid-cols-2 gap-2 sm:flex sm:w-auto">

              <input
                type="number"
                min="1"
                placeholder="Qty"
                value={input.quantity}
                onChange={handleQuantityChange}
                className="w-full sm:w-20 bg-white/80 border border-white p-2.5 rounded-xl text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 shadow-sm"
              />

              <input
                type="number"
                min="0"
                placeholder="Amount"
                value={input.amount}
                onChange={(e) =>
                  setInput({
                    ...input,
                    amount: e.target.value,
                  })
                }
                className="w-full sm:w-32 bg-white/80 border border-white p-2.5 rounded-xl text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 shadow-sm"
              />

            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">

            <select
              value={input.type}
              onChange={(e) =>
                setInput({
                  ...input,
                  type: e.target.value,
                })
              }
              className="bg-white/80 border border-white p-2.5 rounded-xl flex-1 text-xs sm:text-sm text-gray-800 focus:outline-none shadow-sm"
            >
              <option value="income">Income (Sell)</option>
              <option value="expense">Expense</option>
            </select>

            <div className="flex gap-2">

              <button
                onClick={addTransaction}
                disabled={saving || clearing}
                className="flex-1 sm:flex-none bg-emerald-500/15 hover:bg-emerald-500/25 disabled:opacity-50 border border-emerald-500/30 text-emerald-900 px-6 sm:px-8 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/10 text-xs sm:text-sm cursor-pointer transition-all"
              >
                <Plus size={16} className="text-emerald-900" />

                {saving
                  ? "Saving..."
                  : editingId !== null
                    ? "Update"
                    : "Add Entry"}
              </button>

              {editingId !== null && (
                <button
                  onClick={resetInput}
                  className="bg-gray-200 hover:bg-gray-300 border border-white text-gray-700 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all"
                >
                  Cancel
                </button>
              )}

            </div>
          </div>
        </div>

        {/* Transactions History */}

        <div className="bg-white/75 border border-white/80 rounded-2xl shadow-xl overflow-hidden mb-6">

          <div className="flex justify-between items-center p-3 border-b border-gray-200 bg-white/60">

            <h3 className="font-bold text-xs sm:text-sm text-emerald-900">
              Separate Sales Orders History
            </h3>

            <div className="flex gap-1.5 sm:gap-2">

              <button
                onClick={() => window.print()}
                className="flex items-center gap-1 text-[11px] sm:text-xs bg-sky-500/15 border border-sky-500/30 text-sky-700 px-2.5 py-1.5 rounded-xl font-semibold shadow-sm"
              >
                <FileText size={13} />
                Print
              </button>

              <button
                onClick={clearAllTransactions}
                disabled={clearing || saving}
                className="flex items-center gap-1 text-[11px] sm:text-xs bg-rose-500/15 border border-rose-500/30 disabled:opacity-50 border-rose-500/30 text-rose-700 px-2.5 py-1.5 rounded-xl font-semibold shadow-sm"
              >
                <Trash size={13} />
                {clearing ? "Clearing..." : "Clear"}
              </button>

            </div>
          </div>

          {transactions.length === 0 ? (
            <p className="text-center text-gray-500 py-6 text-xs">
              No transactions yet
            </p>
          ) : (
            transactions.map((t) => (
              <div
                key={t.id}
                className="p-3 border-b border-gray-100 last:border-none hover:bg-white/50 transition-colors"
              >

                {t.isOrderGroup ? (
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">

                    <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">

                      <GiTakeMyMoney
                        className="text-emerald-700 mt-0.5 sm:mt-1 shrink-0"
                        size={28}
                      />

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-1.5 mb-1">

                          <span className="font-bold text-xs sm:text-sm text-emerald-800">
                            POS Order Sale
                          </span>

                          <span className="text-[9px] sm:text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-medium">
                            {t.date}
                          </span>

                        </div>

                        <div className="flex flex-wrap gap-1 mt-1">

                          {(t.items || []).map((item, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] sm:text-[11px] bg-white/80 border border-white px-2 py-0.5 rounded-lg text-gray-700 shadow-sm"
                            >
                              {item.name}{" "}
                              <b className="text-gray-900">
                                ({item.qty})
                              </b>
                            </span>
                          ))}

                        </div>

                        {(t.discount > 0 || t.subtotal) && (
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] sm:text-[11px]">

                            {t.subtotal && (
                              <span className="text-gray-500">
                                Subtotal: ৳ {t.subtotal}
                              </span>
                            )}

                            {t.discount > 0 && (
                              <span className="text-rose-600 font-medium">
                                Discount: - ৳ {t.discount}
                              </span>
                            )}

                          </div>
                        )}

                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">

                      <div className="text-left sm:text-right">

                        <span className="font-bold text-xs sm:text-base text-emerald-700 block">
                          + ৳ {t.amount}
                        </span>

                        <span className="text-[9px] sm:text-[10px] text-gray-500">
                          Total Bill
                        </span>

                      </div>

                      <button
                        onClick={() => deleteTransaction(t.id)}
                        disabled={saving || clearing}
                        className="text-rose-600 hover:text-rose-400 disabled:opacity-50 p-1.5 rounded-lg hover:bg-rose-50 transition-all shrink-0"
                        title="Delete Order"
                      >
                        <Trash2 size={16} />
                      </button>

                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">

                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">

                      {t.type === "income" ? (
                        <GiReceiveMoney
                          className="text-emerald-600 shrink-0"
                          size={24}
                        />
                      ) : (
                        <GiPayMoney
                          className="text-rose-600 shrink-0"
                          size={24}
                        />
                      )}

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-1.5">

                          <p className="font-bold text-xs sm:text-sm text-gray-800 truncate">
                            {t.title}
                          </p>

                          {t.quantity && (
                            <span className="text-[9px] sm:text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-medium">
                              Qty: {t.quantity}
                            </span>
                          )}

                        </div>

                        <p className="text-[9px] sm:text-[10px] text-gray-500 truncate">
                          {t.date}
                        </p>

                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">

                      <span
                        className={`font-bold text-xs sm:text-sm ${
                          t.type === "income"
                            ? "text-emerald-700"
                            : "text-rose-700"
                        }`}
                      >
                        {t.type === "income" ? "+" : "-"} ৳{" "}
                        {t.amount}
                      </span>

                      <div className="flex items-center gap-1">

                        <button
                          onClick={() => startEdit(t)}
                          disabled={saving || clearing}
                          className="text-gray-500 hover:text-sky-600 disabled:opacity-50 p-1"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          onClick={() => deleteTransaction(t.id)}
                          disabled={saving || clearing}
                          className="text-rose-600 hover:text-rose-400 disabled:opacity-50 p-1"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>

                      </div>
                    </div>
                  </div>
                )}

              </div>
            ))
          )}

        </div>
      </div>
    </div>
  );
}
