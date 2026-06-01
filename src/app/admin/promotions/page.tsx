"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
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
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { Promotion } from "@/types";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

type PromoAnalytics = {
  claimed: number;
  redeemed: number;
};

const PromotionsPage = () => {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, PromoAnalytics>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    discount: "",
    max_redemptions_per_user: 1,
    max_total_redemptions: "",
    end_date: "",
    active: true,
  });

  const fetchPromos = useCallback(async () => {
    setLoading(true);
    const [{ data, error }, claimsResult] = await Promise.all([
      supabase
        .from("promotions")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("promotion_claims").select("promotion_id, redeemed_count"),
    ]);

    if (error) console.error("Error fetching promos:", error);
    else setPromos(data || []);
    if (!claimsResult.error) {
      const nextAnalytics: Record<string, PromoAnalytics> = {};
      (claimsResult.data || []).forEach((claim) => {
        if (!nextAnalytics[claim.promotion_id]) {
          nextAnalytics[claim.promotion_id] = { claimed: 0, redeemed: 0 };
        }
        nextAnalytics[claim.promotion_id].claimed += 1;
        nextAnalytics[claim.promotion_id].redeemed +=
          Number(claim.redeemed_count) || 0;
      });
      setAnalytics(nextAnalytics);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchPromos();
    };
    init();
  }, [fetchPromos]);

  const handleOpenModal = (promo: Promotion | null = null) => {
    if (promo) {
      setEditingPromo(promo);
      setFormData({
        name: promo.name,
        code: promo.code,
        discount: promo.discount,
        max_redemptions_per_user: promo.max_redemptions_per_user || 1,
        max_total_redemptions: promo.max_total_redemptions?.toString() || "",
        end_date: promo.end_date || "",
        active: promo.active,
      });
    } else {
      setEditingPromo(null);
      setFormData({
        name: "",
        code: "",
        discount: "",
        max_redemptions_per_user: 1,
        max_total_redemptions: "",
        end_date: "",
        active: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      name: formData.name,
      code: formData.code,
      discount: formData.discount,
      max_redemptions_per_user: Math.max(
        1,
        Number(formData.max_redemptions_per_user) || 1,
      ),
      max_total_redemptions: formData.max_total_redemptions
        ? Math.max(1, Number(formData.max_total_redemptions) || 1)
        : null,
      end_date: formData.end_date || null,
      active: formData.active,
    };

    if (editingPromo) {
      const { error } = await supabase
        .from("promotions")
        .update(payload)
        .eq("id", editingPromo.id);
      if (error) console.error("Error updating:", error);
    } else {
      const { error } = await supabase.from("promotions").insert([payload]);
      if (error) console.error("Error inserting:", error);
    }

    await fetchPromos();
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa khuyến mãi này?")) {
      const { error } = await supabase.from("promotions").delete().eq("id", id);
      if (error) console.error("Error deleting:", error);
      else fetchPromos();
    }
  };

  const handleToggleActive = async (promo: Promotion) => {
    const { error } = await supabase
      .from("promotions")
      .update({ active: !promo.active })
      .eq("id", promo.id);
    if (error) console.error("Error toggling active:", error);
    else fetchPromos();
  };

  const activePromosCount = promos.filter((p) => p.active).length;
  const totalUsage = promos.reduce((sum, p) => sum + (p.usage_count || 0), 0);
  const totalClaims = Object.values(analytics).reduce(
    (sum, item) => sum + item.claimed,
    0,
  );
  const totalRedeemed = Object.values(analytics).reduce(
    (sum, item) => sum + item.redeemed,
    0,
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Khuyến mãi & Ưu đãi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tạo mã giảm giá và quản lý các chương trình triân khách hàng.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPromos}
            className="h-10 px-4 rounded-xl border-border bg-card hover:bg-muted transition-colors"
          >
            <RefreshCw
              className={cn("mr-2 h-4 w-4", loading && "animate-spin")}
            />{" "}
            Làm mới
          </Button>
          <Button
            onClick={() => handleOpenModal()}
            className="h-10 px-4 rounded-xl shadow-lg shadow-primary/20"
          >
            <Plus className="mr-2 h-4 w-4" /> Tạo chương trình mới
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            title: "Chương trình đang chạy",
            value: activePromosCount.toString(),
            icon: TrendingUp,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-500/10",
          },
          {
            title: "Mã đã nhận",
            value: totalClaims.toString(),
            icon: Zap,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-500/10",
          },
          {
            title: "Đã áp dụng",
            value: `${totalRedeemed}/${totalUsage}`,
            icon: Sparkles,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-50 dark:bg-amber-500/10",
          },
        ].map((stat, i) => (
          <Card
            key={i}
            className="border-border/50 shadow-sm overflow-hidden rounded-[24px] bg-card"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                {stat.title}
              </CardTitle>
              <div className={cn("p-2 rounded-xl", stat.bg)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-foreground">
                {stat.value}
              </div>
              <p className="text-[10px] font-bold text-muted-foreground/50 mt-1 uppercase tracking-wider">
                Cập nhật thời gian thực
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden rounded-[24px] bg-card">
        <CardHeader className="p-6 md:p-8 bg-card border-b border-border/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg text-foreground">
                Danh sách khuyến mãi
              </CardTitle>
              <CardDescription>
                Quản lý hiệu lực và theo dõi lượt sử dụng mã.
              </CardDescription>
            </div>
            <div className="relative w-full md:w-80 group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Tìm mã hoặc tên chương trình..."
                className="pl-10 bg-muted/40 border-transparent focus:bg-background focus:border-border focus:ring-4 focus:ring-primary/5 h-11 rounded-xl transition-all text-foreground"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="pl-8 py-4 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">
                    Tên chương trình
                  </TableHead>
                  <TableHead className="py-4 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">
                    Mã định danh
                  </TableHead>
                  <TableHead className="py-4 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">
                    Mức giảm
                  </TableHead>
                  <TableHead className="py-4 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">
                    Trạng thái
                  </TableHead>
                  <TableHead className="py-4 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">
                    Ngày hết hạn
                  </TableHead>
                  <TableHead className="text-right pr-8 py-4 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : promos.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-40 text-center text-muted-foreground italic"
                    >
                      Chưa có chương trình khuyến mãi nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  promos.map((promo) => (
                    <TableRow
                      key={promo.id}
                      className="group hover:bg-muted/30 transition-all border-border/50"
                    >
                      <TableCell className="pl-8 py-5">
                        <p className="font-bold text-foreground">
                          {promo.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mt-0.5 uppercase tracking-wider">
                          <BarChart3 className="h-3 w-3" />
                          {analytics[promo.id]?.claimed || 0} nhận ·{" "}
                          {analytics[promo.id]?.redeemed || 0} dùng ·{" "}
                          {promo.max_redemptions_per_user || 1} lượt/user
                        </p>
                      </TableCell>
                      <TableCell className="py-5">
                        <code className="bg-foreground text-background px-2.5 py-1 rounded-lg text-xs font-black tracking-wider shadow-sm select-all">
                          {promo.code}
                        </code>
                      </TableCell>
                      <TableCell className="py-5 font-black text-primary italic">
                        {promo.discount}
                      </TableCell>
                      <TableCell className="py-5">
                        <Badge
                          className={cn(
                            "font-bold text-[10px] px-2.5 py-0.5 border-none",
                            promo.active
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {promo.active ? "Đang chạy" : "Đã dừng"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="flex items-center text-xs font-bold text-muted-foreground">
                          <Calendar className="mr-2 h-3.5 w-3.5 text-muted-foreground/50" />{" "}
                          {promo.end_date || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8 py-5">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-xl hover:bg-card hover:shadow-md border border-transparent hover:border-border transition-all"
                            >
                              <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-52 p-2 rounded-2xl shadow-2xl border-border bg-card"
                          >
                            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-3 py-2">
                              Quản lý mã
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleOpenModal(promo)}
                              className="rounded-xl px-3 py-2.5 text-sm font-medium cursor-pointer focus:bg-primary focus:text-primary-foreground"
                            >
                              <Pencil className="mr-3 h-4 w-4 opacity-50" />{" "}
                              Chỉnh sửa mã
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleActive(promo)}
                              className="rounded-xl px-3 py-2.5 text-sm font-medium cursor-pointer focus:bg-primary focus:text-primary-foreground"
                            >
                              {promo.active ? (
                                <XCircle className="mr-3 h-4 w-4 opacity-50" />
                              ) : (
                                <CheckCircle2 className="mr-3 h-4 w-4 opacity-50" />
                              )}
                              {promo.active ? "Tạm dừng mã" : "Kích hoạt lại"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1 bg-border/50" />
                            <DropdownMenuItem
                              onClick={() => handleDelete(promo.id)}
                              className="rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 focus:bg-rose-500/10 focus:text-rose-600 dark:text-rose-400 dark:focus:text-rose-300 cursor-pointer"
                            >
                              <Trash2 className="mr-3 h-4 w-4 opacity-50" /> Xóa
                              vĩnh viễn
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
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl rounded-[32px] p-0 overflow-hidden border-none bg-card shadow-2xl">
          <form onSubmit={handleSubmit}>
            <div className="border-b border-border/50 bg-card p-8 text-foreground relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="relative z-10">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black italic tracking-tight">
                    {editingPromo
                      ? "Cập nhật khuyến mãi"
                      : "Tạo khuyến mãi mới"}
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground mt-1 font-medium">
                    Thiết lập mã ưu đãi và thời hạn áp dụng cho khách hàng.
                  </DialogDescription>
                </DialogHeader>
              </div>
            </div>

            <div className="p-8 space-y-6 bg-card">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Tên chương trình
                </Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="rounded-2xl border-border bg-muted/20 h-12 px-4 focus-visible:ring-primary/10 transition-all text-foreground"
                  placeholder="VD: Giảm giá khai trương"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Mã giảm giá (Code)
                  </Label>
                  <Input
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    className="rounded-2xl border-border bg-muted/20 h-12 px-4 focus-visible:ring-primary/10 transition-all font-mono font-bold text-foreground"
                    placeholder="VD: HELLO2026"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Mức giảm (Discount)
                  </Label>
                  <Input
                    required
                    value={formData.discount}
                    onChange={(e) =>
                      setFormData({ ...formData, discount: e.target.value })
                    }
                    className="rounded-2xl border-border bg-muted/20 h-12 px-4 focus-visible:ring-primary/10 transition-all text-foreground"
                    placeholder="VD: 20% hoặc BOGO"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Lượt dùng / user
                  </Label>
                  <Input
                    required
                    type="number"
                    min={1}
                    value={formData.max_redemptions_per_user}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_redemptions_per_user: Number(e.target.value),
                      })
                    }
                    className="rounded-2xl border-border bg-muted/20 h-12 px-4 focus-visible:ring-primary/10 transition-all text-foreground"
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Tổng lượt tối đa
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.max_total_redemptions}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_total_redemptions: e.target.value,
                      })
                    }
                    className="rounded-2xl border-border bg-muted/20 h-12 px-4 focus-visible:ring-primary/10 transition-all text-foreground"
                    placeholder="Để trống nếu không giới hạn"
                  />
                </div>
              </div>

              <div className="space-y-2 flex flex-col">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Ngày kết thúc
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "rounded-2xl border-border bg-muted/20 h-12 px-4 justify-start text-left font-normal transition-all hover:bg-muted/40",
                        !formData.end_date && "text-muted-foreground",
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {formData.end_date ? (
                        formData.end_date
                      ) : (
                        <span>Chọn ngày...</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={
                        formData.end_date
                          ? new Date(formData.end_date)
                          : undefined
                      }
                      onSelect={(date) => {
                        if (date) {
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(
                            2,
                            "0",
                          );
                          const day = String(date.getDate()).padStart(2, "0");
                          setFormData({
                            ...formData,
                            end_date: `${year}-${month}-${day}`,
                          });
                        } else {
                          setFormData({ ...formData, end_date: "" });
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="px-8 py-6 bg-muted/10 flex gap-3 border-t border-border/50">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 h-12 rounded-2xl font-bold"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-[2] h-12 rounded-2xl font-black text-base shadow-lg shadow-primary/20"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {editingPromo ? "Lưu thay đổi" : "Xác nhận tạo"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromotionsPage;
