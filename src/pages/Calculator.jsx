
import { useMemo, useState, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  RotateCcw,
  Infinity,
  PackageCheck,
  Percent,
} from "lucide-react";
import { MdOutlineInventory2, MdPointOfSale } from "react-icons/md";

import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

export default function Calculator() {
  const [search, setSearch] = useState("");

  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem("myPosCart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  const [paid, setPaid] = useState("");
  const [discountType, setDiscountType] = useState("flat");
  const [discountValue, setDiscountValue] = useState("");

  const [unlimitedProducts, setUnlimitedProducts] = useState([]);
  const [inventoryProducts, setInventoryProducts] = useState([]);

  const [productsLoading, setProductsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Prevents accidental double sale
  const saleLock = useRef(false);

  // ===============================
  // FIREBASE PRODUCTS REALTIME
  // ===============================

  useEffect(() => {
    const productsRef = collection(db, "products");

    const unsubscribe = onSnapshot(
      productsRef,
      (snapshot) => {
        const formatted = snapshot.docs.map((productDoc) => {
          const p = productDoc.data();

          return {
            id: productDoc.id,
            name: p.name || "",
            price: parseFloat(p.sell) || 0,
            image:
              p.image ||
              "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=300",
            isUnlimited: Boolean(p.isUnlimited),
            stock: p.stock,
          };
        });

        setUnlimitedProducts(
          formatted.filter((p) => p.isUnlimited)
        );

        setInventoryProducts(
          formatted.filter((p) => !p.isUnlimited)
        );

        setProductsLoading(false);
      },
      (error) => {
        console.error("Products loading error:", error);
        setProductsLoading(false);
        alert("Products load করতে সমস্যা হয়েছে!");
      }
    );

    return () => unsubscribe();
  }, []);

  // ===============================
  // SAVE CART LOCALLY
  // ===============================

  useEffect(() => {
    try {
      localStorage.setItem("myPosCart", JSON.stringify(cart));
    } catch (error) {
      console.warn("Unable to save cart:", error);
    }
  }, [cart]);

  // ===============================
  // ADD PRODUCT
  // ===============================

  const addProduct = (product) => {
    if (saving || productsLoading) return;

    if (
      !product.isUnlimited &&
      (product.stock === undefined ||
        product.stock === null ||
        product.stock === "" ||
        Number(product.stock) <= 0)
    ) {
      alert(`${product.name} is out of stock!`);
      return;
    }

    setCart((prevCart) => {
      const exist = prevCart.find(
        (item) => item.id === product.id
      );

      if (exist) {
        if (
          !product.isUnlimited &&
          exist.qty >= Number(product.stock)
        ) {
          alert("Cannot add more. Stock limit reached!");
          return prevCart;
        }

        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }

      return [...prevCart, { ...product, qty: 1 }];
    });
  };

  // ===============================
  // INCREASE QUANTITY
  // ===============================

  const increase = (id) => {
    if (saving) return;

    const allProducts = [
      ...unlimitedProducts,
      ...inventoryProducts,
    ];

    const product = allProducts.find((p) => p.id === id);
    const cartItem = cart.find((item) => item.id === id);

    if (!product || !cartItem) return;

    if (
      !product.isUnlimited &&
      cartItem.qty >= Number(product.stock || 0)
    ) {
      alert("Stock limit reached!");
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id
          ? { ...item, qty: item.qty + 1 }
          : item
      )
    );
  };

  // ===============================
  // DECREASE QUANTITY
  // ===============================

  const decrease = (id) => {
    if (saving) return;

    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.id === id
            ? { ...item, qty: item.qty - 1 }
            : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  // ===============================
  // REMOVE PRODUCT
  // ===============================

  const remove = (id) => {
    if (saving) return;

    setCart((prevCart) =>
      prevCart.filter((item) => item.id !== id)
    );
  };

  // ===============================
  // CALCULATIONS
  // ===============================

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum + Number(item.price) * Number(item.qty),
        0
      ),
    [cart]
  );

  const discountAmount = useMemo(() => {
    const val = parseFloat(discountValue) || 0;

    if (val <= 0) return 0;

    if (discountType === "percent") {
      return (subtotal * Math.min(val, 100)) / 100;
    }

    return Math.min(val, subtotal);
  }, [subtotal, discountValue, discountType]);

  const total = Math.max(0, subtotal - discountAmount);
  const change = Number(paid || 0) - total;

  // ===============================
  // COMPLETE SALE - FIRESTORE
  // ===============================

  const handleCompleteSale = async () => {
    if (saleLock.current || saving) return;

    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    if (productsLoading) {
      alert("Products are still loading. Please wait!");
      return;
    }

    // Validate cart
    const invalidItem = cart.find(
      (item) =>
        !item.id ||
        !Number.isFinite(Number(item.qty)) ||
        Number(item.qty) <= 0
    );

    if (invalidItem) {
      alert("Invalid product in cart!");
      return;
    }

    saleLock.current = true;
    setSaving(true);

    try {
      const now = new Date();

      // Local date (avoids UTC date shifting)
      const isoDateOnly = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
      ].join("-");

      const formattedDate = `${now.toLocaleDateString()} at ${now.toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      )}`;

      // Combine duplicate product IDs, if any
      const combinedItems = Object.values(
        cart.reduce((acc, item) => {
          if (!acc[item.id]) {
            acc[item.id] = {
              productId: item.id,
              name: item.name,
              price: Number(item.price),
              qty: 0,
              isUnlimited: Boolean(item.isUnlimited),
            };
          }

          acc[item.id].qty += Number(item.qty);

          return acc;
        }, {})
      );

      const saleItems = combinedItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        qty: item.qty,
      }));

      // Create unique Firestore document reference
      const saleRef = doc(collection(db, "transactions"));

      const transactionsRef = collection(db, "transactions");

      await runTransaction(db, async (transaction) => {
        const productSnapshots = [];

        // IMPORTANT: Read all product documents first
        for (const item of combinedItems) {
          const productRef = doc(db, "products", item.productId);
          const productSnapshot = await transaction.get(productRef);

          if (!productSnapshot.exists()) {
            throw new Error(
              `${item.name} no longer exists in inventory!`
            );
          }

          productSnapshots.push({
            item,
            productRef,
            productData: productSnapshot.data(),
          });
        }

        // Validate stock and prepare updates
        const stockUpdates = [];

        for (const product of productSnapshots) {
          const { item, productRef, productData } = product;

          if (productData.isUnlimited) {
            continue;
          }

          const currentStock = Number(productData.stock);

          if (
            !Number.isFinite(currentStock) ||
            currentStock < item.qty
          ) {
            throw new Error(
              `${item.name}: Not enough stock! Available: ${
                Number.isFinite(currentStock) ? currentStock : 0
              }`
            );
          }

          stockUpdates.push({
            productRef,
            newStock: currentStock - item.qty,
          });
        }

        // All reads are complete. Now perform writes.
        for (const update of stockUpdates) {
          transaction.update(update.productRef, {
            stock: update.newStock,
          });
        }

        // Save sale history in transactions collection
        transaction.set(saleRef, {
          isOrderGroup: true,
          items: saleItems,
          subtotal: Number(subtotal),
          discount: Number(discountAmount),
          amount: Number(total),
          type: "income",
          date: formattedDate,
          dateOnly: isoDateOnly,
          createdAt: serverTimestamp(),
        });
      });

      // Clear cart only after successful Firestore transaction
      setCart([]);
      setPaid("");
      setDiscountValue("");

      localStorage.removeItem("myPosCart");

      alert(
        "Order completed successfully and saved in Firebase!"
      );
    } catch (error) {
      console.error("Sale error:", error);

      alert(
        error.message ||
          "Sale failed! Please check your internet connection and try again."
      );
    } finally {
      saleLock.current = false;
      setSaving(false);
    }
  };

  // ===============================
  // RESET CART
  // ===============================

  const resetCart = () => {
    if (saving) return;

    setCart([]);
    setPaid("");
    setDiscountValue("");
    localStorage.removeItem("myPosCart");
  };

  // ===============================
  // UI
  // ===============================

  return (
    <div className="w-full min-h-screen p-2 sm:p-6 text-gray-800 max-w-full overflow-x-hidden">
      <div className="max-w-full mx-auto">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#0b5d2a] mb-3 sm:mb-4 px-1">
          Tea Garden POS
        </h1>

        <div className="flex flex-col gap-4 sm:gap-6 w-full">

          {/* PRODUCT LIST SECTION */}

          <div className="bg-white/75 border border-white/80 rounded-2xl sm:rounded-3xl shadow-xl p-3 sm:p-6 w-full">
            <div className="relative mb-3 sm:mb-5">
              <Search
                className="absolute left-3 top-3 text-gray-400"
                size={18}
              />

              <input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/80 border border-white rounded-xl pl-9 pr-3 py-2.5 sm:py-3 text-xs sm:text-base text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 shadow-sm"
              />
            </div>

            {/* Unlimited Products */}

            {unlimitedProducts.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <PackageCheck
                    size={20}
                    className="text-emerald-700"
                  />

                  <p className="text-[11px] sm:text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    Always Available (Unlimited Stock)
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {unlimitedProducts
                    .filter((item) =>
                      item.name
                        .toLowerCase()
                        .includes(search.toLowerCase())
                    )
                    .map((product) => (
                      <div
                        key={product.id}
                        onClick={() => addProduct(product)}
                        className="flex items-center gap-2 backdrop-blur-sm bg-white/60 border border-white/80 rounded-xl p-2 cursor-pointer hover:bg-emerald-500/15 hover:border-emerald-500/30 transition-all duration-300 w-full group shadow-sm min-w-0"
                      >
                        <img
                          src={product.image}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover shrink-0 border border-white/60 bg-gray-100"
                          onError={(e) => {
                            e.target.src =
                              "/assets/products/rong cha.jpg";
                          }}
                        />

                        <div className="overflow-hidden flex-1 min-w-0">
                          <h3 className="font-semibold text-[11px] sm:text-xs text-gray-800 group-hover:text-emerald-800 truncate flex items-center gap-1">
                            {product.name}
                            <Infinity
                              size={15}
                              className="text-emerald-700 shrink-0"
                            />
                          </h3>

                          <p className="text-emerald-700 font-bold text-[10px] sm:text-[11px]">
                            ৳ {product.price}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Inventory Products */}

            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <MdOutlineInventory2
                  size={20}
                  className="text-teal-700"
                />

                <p className="text-[11px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Inventory Items (Stock Managed)
                </p>
              </div>

              {productsLoading ? (
                <p className="text-xs text-gray-500 px-1 py-2">
                  Loading products from Firebase...
                </p>
              ) : inventoryProducts.length === 0 ? (
                <p className="text-xs text-gray-500 px-1 py-2">
                  No stock-managed products available.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {inventoryProducts
                    .filter((item) =>
                      item.name
                        .toLowerCase()
                        .includes(search.toLowerCase())
                    )
                    .map((product) => {
                      const isOutOfStock =
                        product.stock === "" ||
                        product.stock === null ||
                        product.stock === undefined ||
                        Number(product.stock) <= 0;

                      return (
                        <div
                          key={product.id}
                          onClick={() =>
                            !isOutOfStock && addProduct(product)
                          }
                          className={`flex items-center gap-2 backdrop-blur-sm border rounded-xl p-2 transition-all duration-300 w-full group shadow-sm min-w-0 ${
                            isOutOfStock
                              ? "opacity-60 bg-rose-50/80 border-rose-200 cursor-not-allowed"
                              : "bg-white/60 border-white/80 hover:bg-emerald-500/15 hover:border-emerald-500/30 cursor-pointer"
                          }`}
                        >
                          <img
                            src={product.image}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover shrink-0 border border-white/60 bg-gray-100"
                            onError={(e) => {
                              e.target.src =
                                "/assets/products/rong cha.jpg";
                            }}
                          />

                          <div className="overflow-hidden flex-1 min-w-0">
                            <h3
                              className={`font-semibold text-[11px] sm:text-xs truncate ${
                                isOutOfStock
                                  ? "text-rose-700 font-bold"
                                  : "text-gray-800 group-hover:text-emerald-800"
                              }`}
                            >
                              {product.name}
                            </h3>

                            <div className="flex items-center justify-between gap-1">
                              <p className="text-emerald-700 font-bold text-[10px] sm:text-[11px]">
                                ৳ {product.price}
                              </p>

                              <span
                                className={`text-[9px] px-1 rounded truncate ${
                                  isOutOfStock
                                    ? "bg-rose-100 text-rose-700 font-bold"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                Stock: {product.stock || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* CART SECTION */}

          <div className="bg-white/75 border border-white/80 rounded-2xl sm:rounded-3xl shadow-xl p-3 sm:p-6 w-full">
            <div className="flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-bold flex gap-2 text-gray-800 items-center">
                <ShoppingCart
                  className="text-emerald-700"
                  size={20}
                />
                Order
              </h2>

              <button
                onClick={resetCart}
                disabled={saving}
                className="p-1.5 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-50"
                title="Reset Cart"
              >
                <RotateCcw
                  className="text-rose-600"
                  size={16}
                />
              </button>
            </div>

            <div className="mt-3 sm:mt-4 space-y-2 max-h-[350px] overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-center text-gray-500 py-6 text-xs">
                  No Product Added
                </p>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white/60 border border-white/80 rounded-xl p-2 sm:p-2.5 flex justify-between items-center gap-2 w-full shadow-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={item.image}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-md object-cover border border-white/60 bg-gray-100 shrink-0"
                        onError={(e) => {
                          e.target.src =
                            "/assets/products/rong cha.jpg";
                        }}
                      />

                      <div className="min-w-0">
                        <h4 className="font-semibold text-[11px] sm:text-xs text-gray-800 truncate">
                          {item.name}
                        </h4>

                        <p className="text-[10px] sm:text-[11px] text-gray-500">
                          ৳ {item.price}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <button
                          onClick={() => decrease(item.id)}
                          disabled={saving}
                          className="bg-gray-100 border border-gray-200 p-1 rounded hover:bg-gray-200 transition-all text-gray-700 disabled:opacity-50"
                        >
                          <Minus size={10} />
                        </button>

                        <span className="font-bold text-xs w-4 text-center text-gray-800">
                          {item.qty}
                        </span>

                        <button
                          onClick={() => increase(item.id)}
                          disabled={saving}
                          className="bg-emerald-600 hover:bg-emerald-700 border border-emerald-500/30 text-white p-1 rounded transition-all disabled:opacity-50"
                        >
                          <Plus size={10} />
                        </button>
                      </div>

                      <button
                        onClick={() => remove(item.id)}
                        disabled={saving}
                        className="text-gray-400 hover:text-rose-600 p-1 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <hr className="my-3 sm:my-4 border-gray-200" />

            <div className="space-y-2.5 sm:space-y-3">

              {/* Discount Controls */}

              <div className="bg-white/60 border border-white/80 rounded-xl p-2.5 sm:p-3 space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <label className="block font-medium text-xs sm:text-sm text-gray-700 flex items-center gap-1">
                    <Percent
                      size={14}
                      className="text-emerald-700"
                    />
                    Discount
                  </label>

                  <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-[10px] sm:text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setDiscountType("flat")}
                      className={`px-2 py-1 rounded-md transition-all ${
                        discountType === "flat"
                          ? "bg-white text-emerald-700 shadow-sm font-bold"
                          : "text-gray-600"
                      }`}
                    >
                      Flat (৳)
                    </button>

                    <button
                      type="button"
                      onClick={() => setDiscountType("percent")}
                      className={`px-2 py-1 rounded-md transition-all ${
                        discountType === "percent"
                          ? "bg-white text-emerald-700 shadow-sm font-bold"
                          : "text-gray-600"
                      }`}
                    >
                      Percent (%)
                    </button>
                  </div>
                </div>

                <input
                  type="number"
                  min="0"
                  value={discountValue}
                  onChange={(e) =>
                    setDiscountValue(e.target.value)
                  }
                  placeholder={
                    discountType === "flat"
                      ? "Enter flat discount amount"
                      : "Enter percentage (e.g. 10)"
                  }
                  className="w-full bg-white/80 border border-white rounded-lg p-2 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 shadow-sm"
                />
              </div>

              {/* Totals Display */}

              <div className="space-y-1 text-xs sm:text-sm text-gray-700 px-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-medium text-gray-900">
                    ৳ {subtotal}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount Applied:</span>
                    <span className="font-medium">
                      - ৳ {discountAmount}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-lg sm:text-xl font-bold text-gray-800 pt-1 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-emerald-700">
                    ৳ {total}
                  </span>
                </div>
              </div>

              <label className="block font-medium text-xs sm:text-sm text-gray-700">
                Customer Paid
              </label>

              <input
                type="number"
                min="0"
                value={paid}
                onChange={(e) => setPaid(e.target.value)}
                placeholder="0000"
                className="w-full bg-white/80 border border-white rounded-xl p-2.5 sm:p-3 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 shadow-sm"
              />

              <div className="bg-white/60 border border-white/80 rounded-xl p-3 sm:p-4 text-xs sm:text-sm space-y-1 shadow-sm">
                <p className="text-gray-700">
                  Customer দিলো:{" "}
                  <b className="text-gray-900">
                    ৳ {paid || 0}
                  </b>
                </p>

                <p className="text-gray-700">
                  মোট বিল:{" "}
                  <b className="text-gray-900">
                    ৳ {total}
                  </b>
                </p>

                <p className="text-emerald-700 font-bold text-base sm:text-lg">
                  ফেরত পাবে: ৳ {change > 0 ? change : 0}
                </p>

                {change < 0 && (
                  <p className="text-rose-600 font-bold text-xs sm:text-sm">
                    আরো দিতে হবে: ৳ {Math.abs(change)}
                  </p>
                )}
              </div>

              <button
                onClick={handleCompleteSale}
                disabled={saving || productsLoading || cart.length === 0}
                className="w-full bg-emerald-500/25 hover:bg-emerald-500/15 border border-emerald-500/30 text-emerald-900 py-2.5 sm:py-3 rounded-xl flex justify-center items-center gap-2 font-bold text-base sm:text-lg shadow-lg shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MdPointOfSale size={18} />
                {saving ? "Saving Sale..." : "Complete Sale"}
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
