"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/images";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { Category, Product } from "@/types";
import {
  Check,
  Coffee,
  Download,
  Image as ImageIcon,
  Info,
  Layers,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Tag as TagIcon,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";

const PRODUCT_IMAGE_BUCKET = "product-images";
const DEFAULT_CATEGORIES: Category[] = [
  "Cà phê",
  "Cold brew",
  "Signature",
  "Matcha",
  "Cacao",
  "Trà",
  "Món khác",
];

type ImportedMenuDraft = {
  id: string;
  selected: boolean;
  name: string;
  description: string | null;
  price_s: number | null;
  price_m: number | null;
  category: Category;
  sub_category: string | null;
  is_best_seller: boolean;
  confidence: number;
};

const MenuPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [menuImageFile, setMenuImageFile] = useState<File | null>(null);
  const [menuImagePreviewUrl, setMenuImagePreviewUrl] = useState("");
  const [importingMenu, setImportingMenu] = useState(false);
  const [savingImportedItems, setSavingImportedItems] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedItems, setImportedItems] = useState<ImportedMenuDraft[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("Tất cả");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price_s: "",
    price_m: "",
    category: "Cà phê" as Category,
    image_url: "",
    is_best_seller: false,
  });

  const visibleCategories = React.useMemo(() => {
    const productCategories = products.map((product) => product.category);
    return Array.from(
      new Set(["Tất cả", ...DEFAULT_CATEGORIES, ...productCategories]),
    );
  }, [products]);

  const fetchProducts = React.useCallback(async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching products:", error);
    else setProducts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchProducts();
    };
    init();
  }, [fetchProducts]);

  const handleOpenModal = (product: Product | null = null) => {
    if (imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || "",
        price_s: product.price_s?.toString() || "",
        price_m: product.price_m?.toString() || "",
        category: product.category,
        image_url: product.image_url || "",
        is_best_seller: product.is_best_seller,
      });
      setSelectedImageFile(null);
      setImagePreviewUrl(product.image_url || "");
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        description: "",
        price_s: "",
        price_m: "",
        category: "Cà phê",
        image_url: "",
        is_best_seller: false,
      });
      setSelectedImageFile(null);
      setImagePreviewUrl("");
    }
    setImageUploadError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setIsModalOpen(false);
    setEditingProduct(null);
    setImageUploadError(null);
    setUploadingImage(false);
    setSelectedImageFile(null);
    setImagePreviewUrl("");
  };

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setImageUploadError("Vui lòng chọn tệp hình ảnh hợp lệ.");
      return;
    }

    if (imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setImageUploadError(null);
    setSelectedImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const clearSelectedImage = () => {
    if (imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setSelectedImageFile(null);
    setImagePreviewUrl("");
    setFormData((current) => ({
      ...current,
      image_url: "",
    }));
    setImageUploadError(null);
  };

  const uploadSelectedImage = async () => {
    if (!selectedImageFile) return formData.image_url;

    setUploadingImage(true);
    setImageUploadError(null);

    const file = selectedImageFile;
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeName =
      file.name
        .replace(/\.[^/.]+$/, "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase() || "product";
    const uniqueId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const filePath = `menu/${uniqueId}-${safeName}.${extension}`;

    const { error } = await supabase.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      setImageUploadError(`Không thể upload ảnh: ${error.message}`);
      setUploadingImage(false);
      throw error;
    }

    const { data } = supabase.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .getPublicUrl(filePath);

    setUploadingImage(false);
    return data.publicUrl;
  };

  const handleMenuImageSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setImportError("Vui lòng chọn tệp hình ảnh menu hợp lệ.");
      return;
    }

    if (menuImagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(menuImagePreviewUrl);
    }

    setMenuImageFile(file);
    setMenuImagePreviewUrl(URL.createObjectURL(file));
    setImportedItems([]);
    setImportError(null);
  };

  const handleCloseImportModal = () => {
    if (menuImagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(menuImagePreviewUrl);
    }

    setIsImportModalOpen(false);
    setMenuImageFile(null);
    setMenuImagePreviewUrl("");
    setImportedItems([]);
    setImportError(null);
    setImportingMenu(false);
    setSavingImportedItems(false);
  };

  const handleImportMenuImage = async () => {
    if (!menuImageFile) {
      setImportError("Vui lòng chọn ảnh menu trước.");
      return;
    }

    setImportingMenu(true);
    setImportError(null);

    const payload = new FormData();
    payload.append("image", menuImageFile);

    const response = await fetch("/api/admin/menu/import-image", {
      method: "POST",
      body: payload,
    });
    const result = await response.json();

    if (!response.ok) {
      setImportError(result.error || "Không thể nhận diện menu từ ảnh.");
      setImportingMenu(false);
      return;
    }

    const drafts: ImportedMenuDraft[] = (
      result.items as Omit<ImportedMenuDraft, "id" | "selected">[] | undefined
    || []).map((item, index) => ({
      ...item,
      id: `${Date.now()}-${index}`,
      selected: true,
    }));

    setImportedItems(drafts);
    setImportingMenu(false);

    if (drafts.length === 0) {
      setImportError("Không tìm thấy món nào rõ ràng trong ảnh menu.");
    }
  };

  const updateImportedItem = (
    id: string,
    changes: Partial<Omit<ImportedMenuDraft, "id">>,
  ) => {
    setImportedItems((items) =>
      items.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    );
  };

  const handleSaveImportedItems = async () => {
    const itemsToSave = importedItems.filter(
      (item) => item.selected && item.name.trim(),
    );

    if (itemsToSave.length === 0) {
      setImportError("Vui lòng chọn ít nhất một món để lưu.");
      return;
    }

    setSavingImportedItems(true);
    setImportError(null);

    const { error } = await supabase.from("products").insert(
      itemsToSave.map((item) => ({
        name: item.name.trim(),
        description: item.description || null,
        price_s: item.price_s,
        price_m: item.price_m,
        category: item.category,
        sub_category: item.sub_category || null,
        image_url: null,
        is_best_seller: item.is_best_seller,
      })),
    );

    if (error) {
      setImportError(`Không thể lưu menu: ${error.message}`);
      setSavingImportedItems(false);
      return;
    }

    await fetchProducts();
    handleCloseImportModal();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let imageUrl = formData.image_url;

    try {
      imageUrl = await uploadSelectedImage();
    } catch {
      setLoading(false);
      return;
    }

    const payload = {
      ...formData,
      image_url: imageUrl || "",
      price_s: formData.price_s ? parseFloat(formData.price_s) : null,
      price_m: formData.price_m ? parseFloat(formData.price_m) : null,
    };

    if (editingProduct) {
      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editingProduct.id);
      if (error) console.error("Error updating:", error);
    } else {
      const { error } = await supabase.from("products").insert([payload]);
      if (error) console.error("Error inserting:", error);
    }

    await fetchProducts();
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa món này?")) {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) console.error("Error deleting:", error);
      else fetchProducts();
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      activeCategory === "Tất cả" || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Quản lý thực đơn
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý danh sách món uống và giá cả hiệu quả.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportModalOpen(true)}
            className="border-border bg-card h-10 px-4 rounded-xl hover:bg-muted transition-colors"
          >
            <ImageIcon className="mr-2 h-4 w-4" /> Nhập từ ảnh menu
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex border-border bg-card h-10 px-4 rounded-xl hover:bg-muted transition-colors"
          >
            <Download className="mr-2 h-4 w-4" /> Xuất file CSV
          </Button>
          <Button
            onClick={() => handleOpenModal()}
            className="h-10 px-4 rounded-xl shadow-lg shadow-primary/20"
          >
            <Plus className="mr-2 h-4 w-4" /> Thêm món mới
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {visibleCategories.map((c) => (
            <Button
              key={c}
              variant={activeCategory === c ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveCategory(c)}
              className={cn(
                "h-9 rounded-full px-5 text-xs font-bold transition-all whitespace-nowrap",
                activeCategory === c
                  ? "shadow-md shadow-primary/10"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {c}
            </Button>
          ))}
        </div>

        <Card className="border-border/50 shadow-sm overflow-hidden rounded-[24px] bg-card">
          <CardHeader className="p-6 md:p-8 bg-card border-b border-border/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-lg text-foreground">
                  Danh sách sản phẩm
                </CardTitle>
                <CardDescription>
                  Đang hiển thị {filteredProducts.length} món trong danh mục{" "}
                  {activeCategory}.
                </CardDescription>
              </div>
              <div className="relative w-full md:w-80 group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Tìm kiếm sản phẩm..."
                  className="pl-10 bg-muted/40 border-transparent focus:bg-background focus:border-border focus:ring-4 focus:ring-primary/5 h-11 rounded-xl transition-all text-foreground"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="w-[80px] pl-8 py-4 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">
                      Ảnh
                    </TableHead>
                    <TableHead className="py-4 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">
                      Chi tiết
                    </TableHead>
                    <TableHead className="py-4 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">
                      Danh mục
                    </TableHead>
                    <TableHead className="py-4 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">
                      Giá (S/M)
                    </TableHead>
                    <TableHead className="py-4 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">
                      Trạng thái
                    </TableHead>
                    <TableHead className="text-right pr-8 py-4 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-10 h-10 border-3 border-primary/10 border-t-primary rounded-full animate-spin"></div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            Đang đồng bộ dữ liệu...
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 opacity-40">
                          <Layers className="h-12 w-12 text-muted-foreground" />
                          <p className="text-sm font-medium text-muted-foreground italic">
                            Không tìm thấy sản phẩm phù hợp.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow
                        key={product.id}
                        className="group hover:bg-muted/30 transition-all border-border/50"
                      >
                        <TableCell className="pl-8 py-4">
                          <div className="h-14 w-14 overflow-hidden rounded-2xl border-2 border-border/50 bg-muted/20 group-hover:border-primary/30 transition-all shadow-sm">
                            <Image
                              src={product.image_url || DEFAULT_PRODUCT_IMAGE}
                              alt={product.name}
                              width={56}
                              height={56}
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-115"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div>
                            <p className="font-bold text-foreground group-hover:text-primary transition-colors">
                              {product.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1 max-w-[200px]">
                              {product.description || "Chưa có mô tả"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge
                            variant="secondary"
                            className="bg-muted text-muted-foreground border-none font-bold text-[10px] px-2.5 py-0.5 rounded-lg"
                          >
                            {product.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-foreground text-sm">
                              {product.price_s || "-"}
                            </span>
                            <span className="text-muted-foreground/30 text-xs">
                              /
                            </span>
                            <span className="font-bold text-muted-foreground text-sm">
                              {product.price_m || "-"}
                            </span>
                            <span className="text-[10px] font-bold text-muted-foreground/50 ml-0.5">
                              k
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          {product.is_best_seller ? (
                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full w-fit border border-emerald-100 dark:border-emerald-500/20 shadow-sm shadow-emerald-500/5">
                              <Check className="h-3 w-3 stroke-[3]" />
                              <span className="text-[10px] font-black uppercase tracking-wider">
                                Bán chạy
                              </span>
                            </div>
                          ) : (
                            <div className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest ml-1">
                              Cơ bản
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-8 py-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-xl hover:bg-card hover:shadow-md border border-transparent hover:border-border transition-all active:scale-90"
                              >
                                <MoreHorizontal className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-56 p-2 rounded-2xl shadow-2xl border-border bg-card animate-in fade-in zoom-in-95 duration-200"
                            >
                              <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 py-2">
                                Thao tác quản lý
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => handleOpenModal(product)}
                                className="rounded-xl px-3 py-2.5 text-sm font-medium focus:bg-primary focus:text-primary-foreground cursor-pointer transition-colors group/item"
                              >
                                <Pencil className="mr-3 h-4 w-4 opacity-50 group-focus/item:opacity-100" />{" "}
                                Chỉnh sửa chi tiết
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1 bg-border/50" />
                              <DropdownMenuItem
                                onClick={() => handleDelete(product.id)}
                                className="rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 focus:bg-rose-500/10 focus:text-rose-600 dark:text-rose-400 dark:focus:text-rose-300 cursor-pointer transition-colors group/item"
                              >
                                <Trash2 className="mr-3 h-4 w-4 opacity-50 group-focus/item:opacity-100" />{" "}
                                Xóa vĩnh viễn
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="p-6 border-t border-border/50 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest px-8">
              <p>Đang đồng bộ dữ liệu • {filteredProducts.length} món</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="h-8 rounded-lg text-[10px] border-border bg-card text-muted-foreground"
                >
                  Trang trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="h-8 rounded-lg text-[10px] border-border bg-card text-muted-foreground"
                >
                  Trang sau
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl rounded-[32px] p-0 overflow-hidden border-none shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] bg-card">
          <form onSubmit={handleSubmit}>
            <div className="border-b border-border/50 bg-card p-10 text-foreground relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="relative z-10">
                <DialogHeader>
                  <DialogTitle className="text-3xl font-black italic tracking-tight">
                    {editingProduct ? "Cập nhật món" : "Thêm món mới"}
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground mt-2 font-medium">
                    Đảm bảo chất lượng thực đơn với mô tả chi tiết và chiến lược
                    giá hợp lý.
                  </DialogDescription>
                </DialogHeader>
              </div>
            </div>

            <div className="p-10 space-y-8 bg-card max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-muted-foreground ml-1">
                    <Info className="h-3.5 w-3.5" />
                    <label className="text-[10px] font-black uppercase tracking-[0.2em]">
                      Tên món uống
                    </label>
                  </div>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="rounded-2xl border-border bg-muted/20 h-14 px-5 focus-visible:ring-primary/10 focus-visible:bg-background focus-visible:border-border transition-all text-base font-medium text-foreground"
                    placeholder="VD: Cà phê kem muối"
                  />
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-muted-foreground ml-1">
                    <Layers className="h-3.5 w-3.5" />
                    <label className="text-[10px] font-black uppercase tracking-[0.2em]">
                      Danh mục món
                    </label>
                  </div>
                  <select
                    className="flex h-14 w-full rounded-2xl border border-border bg-muted/20 px-5 text-sm font-medium shadow-sm transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/5 focus-visible:bg-background focus-visible:border-border text-foreground"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as Category,
                      })
                    }
                  >
                    {DEFAULT_CATEGORIES.map((c) => (
                      <option
                        key={c}
                        value={c}
                        className="bg-card text-foreground"
                      >
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-muted-foreground ml-1">
                    <TagIcon className="h-3.5 w-3.5" />
                    <label className="text-[10px] font-black uppercase tracking-[0.2em]">
                      Giá Size Nhỏ (k)
                    </label>
                  </div>
                  <Input
                    type="number"
                    value={formData.price_s}
                    onChange={(e) =>
                      setFormData({ ...formData, price_s: e.target.value })
                    }
                    className="rounded-2xl border-border bg-muted/20 h-14 px-5 focus-visible:ring-primary/10 focus-visible:bg-background focus-visible:border-border transition-all text-base font-bold text-foreground"
                    placeholder="25"
                  />
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-muted-foreground ml-1">
                    <TagIcon className="h-3.5 w-3.5" />
                    <label className="text-[10px] font-black uppercase tracking-[0.2em]">
                      Giá Size Vừa (k)
                    </label>
                  </div>
                  <Input
                    type="number"
                    value={formData.price_m}
                    onChange={(e) =>
                      setFormData({ ...formData, price_m: e.target.value })
                    }
                    className="rounded-2xl border-border bg-muted/20 h-14 px-5 focus-visible:ring-primary/10 focus-visible:bg-background focus-visible:border-border transition-all text-base font-bold text-foreground"
                    placeholder="35"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-muted-foreground ml-1">
                  <Info className="h-3.5 w-3.5" />
                  <label className="text-[10px] font-black uppercase tracking-[0.2em]">
                    Mô tả / Thành phần
                  </label>
                </div>
                <textarea
                  className="flex min-h-[120px] w-full rounded-2xl border border-border bg-muted/20 px-5 py-4 text-sm font-medium shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/5 focus-visible:bg-background focus-visible:border-border transition-all resize-none text-foreground"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Mô tả hương vị độc đáo và thành phần cao cấp..."
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground ml-1">
                  <ImageIcon className="h-3.5 w-3.5" />
                  <label className="text-[10px] font-black uppercase tracking-[0.2em]">
                    Ảnh món
                  </label>
                </div>
                <div className="grid gap-4 md:grid-cols-[160px_1fr]">
                  <div className="relative aspect-square overflow-hidden rounded-3xl border border-border bg-muted/20">
                    {imagePreviewUrl ? (
                      <Image
                        src={imagePreviewUrl}
                        alt={formData.name || "Ảnh món"}
                        fill
                        unoptimized={imagePreviewUrl.startsWith("blob:")}
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground/40">
                        <ImageIcon className="h-10 w-10" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          Chưa có ảnh
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center gap-3">
                    <input
                      id="product-image-upload"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (file) {
                          handleImageSelect(file);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 w-full rounded-2xl border-border bg-muted/20 font-bold"
                      disabled={uploadingImage}
                      onClick={() =>
                        document.getElementById("product-image-upload")?.click()
                      }
                    >
                      {uploadingImage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      Chọn ảnh từ máy
                    </Button>
                    {imagePreviewUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-10 w-full rounded-xl text-xs font-bold text-muted-foreground hover:text-rose-500"
                        onClick={clearSelectedImage}
                        disabled={uploadingImage}
                      >
                        <X className="h-4 w-4" />
                        Xóa ảnh khỏi món này
                      </Button>
                    )}

                    {imageUploadError && (
                      <p className="text-xs font-medium text-rose-500">
                        {imageUploadError}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  "group flex items-center justify-between p-6 rounded-[24px] border transition-all cursor-pointer select-none",
                  formData.is_best_seller
                    ? "bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/10"
                    : "bg-muted/20 border-border hover:border-primary/30",
                )}
                onClick={() =>
                  setFormData({
                    ...formData,
                    is_best_seller: !formData.is_best_seller,
                  })
                }
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500",
                      formData.is_best_seller
                        ? "bg-emerald-500 text-white scale-110 rotate-3"
                        : "bg-card text-muted-foreground/30 border border-border group-hover:scale-105",
                    )}
                  >
                    <Check
                      className={cn(
                        "h-6 w-6 transition-transform",
                        formData.is_best_seller ? "scale-100" : "scale-0",
                      )}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-black text-foreground">
                      Món bán chạy nhất
                    </p>
                    <p className="text-[11px] font-medium text-muted-foreground mt-0.5 italic">
                      Làm nổi bật món này trong phần gợi ý khách hàng.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-10 py-8 bg-muted/10 flex gap-4 border-t border-border/50">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCloseModal}
                className="flex-1 h-14 rounded-2xl font-bold text-muted-foreground hover:bg-card hover:shadow-sm border border-transparent hover:border-border transition-all"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={uploadingImage}
                className="flex-[2] h-14 rounded-2xl font-black text-base shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all"
              >
                {editingProduct ? "Cập nhật món" : "Xác nhận thêm"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isImportModalOpen}
        onOpenChange={(open) => {
          if (open) setIsImportModalOpen(true);
          else handleCloseImportModal();
        }}
      >
        <DialogContent className="max-w-5xl rounded-[32px] p-0 overflow-hidden border-none shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] bg-card">
          <div className="border-b border-border/50 bg-card p-8 text-foreground relative overflow-hidden">
            <div className="absolute top-0 right-0 w-56 h-56 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="relative z-10">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black italic tracking-tight">
                  Nhập menu từ ảnh
                </DialogTitle>
                <DialogDescription className="text-muted-foreground mt-1 font-medium">
                  Chọn ảnh menu, kiểm tra danh sách được nhận diện, rồi lưu vào thực đơn.
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          <div className="grid max-h-[72vh] gap-6 overflow-y-auto p-6 lg:grid-cols-[320px_1fr]">
            <div className="space-y-4">
              <input
                id="menu-image-import"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) handleMenuImageSelect(file);
                }}
              />
              <div className="relative aspect-[3/4] overflow-hidden rounded-3xl border border-border bg-muted/20">
                {menuImagePreviewUrl ? (
                  <Image
                    src={menuImagePreviewUrl}
                    alt="Ảnh menu cần nhận diện"
                    fill
                    unoptimized={menuImagePreviewUrl.startsWith("blob:")}
                    className="object-contain"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-center text-muted-foreground/50">
                    <ImageIcon className="h-12 w-12" />
                    <p className="max-w-[200px] text-xs font-bold uppercase tracking-widest">
                      Chưa chọn ảnh menu
                    </p>
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-12 w-full rounded-2xl border-border bg-muted/20 font-bold"
                onClick={() => document.getElementById("menu-image-import")?.click()}
                disabled={importingMenu || savingImportedItems}
              >
                <Upload className="h-4 w-4" />
                Chọn ảnh menu từ máy
              </Button>
              <Button
                type="button"
                className="h-12 w-full rounded-2xl font-black shadow-lg shadow-primary/20"
                onClick={handleImportMenuImage}
                disabled={!menuImageFile || importingMenu || savingImportedItems}
              >
                {importingMenu ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Coffee className="h-4 w-4" />
                )}
                Nhận diện menu
              </Button>
              {importError && (
                <p className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-medium text-rose-500">
                  {importError}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-foreground">
                    Danh sách món nhận diện
                  </h3>
                  <p className="text-xs font-medium text-muted-foreground">
                    {importedItems.length > 0
                      ? `Tìm thấy ${importedItems.length} món. Bỏ chọn hoặc chỉnh lại trước khi lưu.`
                      : "Kết quả sẽ xuất hiện sau khi nhận diện ảnh."}
                  </p>
                </div>
                <Button
                  type="button"
                  disabled={
                    importedItems.length === 0 ||
                    savingImportedItems ||
                    importingMenu
                  }
                  onClick={handleSaveImportedItems}
                  className="h-10 rounded-xl font-bold"
                >
                  {savingImportedItems ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Lưu món đã chọn
                </Button>
              </div>

              {importedItems.length === 0 ? (
                <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-muted/20 text-muted-foreground/50">
                  <Layers className="mb-3 h-12 w-12" />
                  <p className="text-sm font-medium italic">
                    Chưa có dữ liệu menu để xem trước.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {importedItems.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "grid gap-3 rounded-3xl border p-4 transition-all lg:grid-cols-[28px_1.4fr_120px_120px_140px]",
                        item.selected
                          ? "border-border bg-card"
                          : "border-border/50 bg-muted/20 opacity-60",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={(event) =>
                          updateImportedItem(item.id, {
                            selected: event.target.checked,
                          })
                        }
                        className="mt-4 h-4 w-4 accent-primary"
                      />
                      <div className="space-y-2">
                        <Input
                          value={item.name}
                          onChange={(event) =>
                            updateImportedItem(item.id, {
                              name: event.target.value,
                            })
                          }
                          className="h-10 rounded-xl bg-muted/20 text-sm font-bold"
                          placeholder="Tên món"
                        />
                        <Input
                          value={item.description || ""}
                          onChange={(event) =>
                            updateImportedItem(item.id, {
                              description: event.target.value || null,
                            })
                          }
                          className="h-10 rounded-xl bg-muted/20 text-xs"
                          placeholder="Mô tả"
                        />
                      </div>
                      <Input
                        type="number"
                        value={item.price_s ?? ""}
                        onChange={(event) =>
                          updateImportedItem(item.id, {
                            price_s: event.target.value
                              ? Number(event.target.value)
                              : null,
                          })
                        }
                        className="h-10 rounded-xl bg-muted/20 text-sm font-bold"
                        placeholder="Giá S"
                      />
                      <Input
                        type="number"
                        value={item.price_m ?? ""}
                        onChange={(event) =>
                          updateImportedItem(item.id, {
                            price_m: event.target.value
                              ? Number(event.target.value)
                              : null,
                          })
                        }
                        className="h-10 rounded-xl bg-muted/20 text-sm font-bold"
                        placeholder="Giá M"
                      />
                      <div className="space-y-2">
                        <select
                          value={item.category}
                          onChange={(event) =>
                            updateImportedItem(item.id, {
                              category: event.target.value as Category,
                            })
                          }
                          className="h-10 w-full rounded-xl border border-border bg-muted/20 px-3 text-xs font-bold text-foreground"
                        >
                          {DEFAULT_CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Tin cậy {Math.round(item.confidence * 100)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MenuPage;
