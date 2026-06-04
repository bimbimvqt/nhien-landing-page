'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  GripVertical,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

import { toast } from 'sonner';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchAdminApi } from '@/lib/adminApi';
import { getProxiedImageUrl } from '@/lib/image-proxy';
import {
  DEFAULT_ABOUT_DESCRIPTION_1,
  DEFAULT_ABOUT_DESCRIPTION_2,
  DEFAULT_ABOUT_STATS,
  DEFAULT_ABOUT_TITLE,
} from '@/lib/storeSettings';
import type { AboutStat } from '@/types';

const ABOUT_IMAGE_BUCKET = 'product-images';

export default function AboutSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentSettings, setCurrentSettings] = useState<any>(null);


  // Form state
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [title, setTitle] = useState(DEFAULT_ABOUT_TITLE);
  const [description1, setDescription1] = useState(DEFAULT_ABOUT_DESCRIPTION_1);
  const [description2, setDescription2] = useState(DEFAULT_ABOUT_DESCRIPTION_2);
  const [stats, setStats] = useState<AboutStat[]>(DEFAULT_ABOUT_STATS);
  const [eyebrow, setEyebrow] = useState('Câu chuyện của chúng tôi');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {

      const res = await fetchAdminApi('/api/admin/store-settings');
      if (!res.ok) throw new Error('Không thể tải cài đặt');
      const data = await res.json();
      setCurrentSettings(data);
      setImageUrl(data.about_image_url || '');
      setTitle(data.about_title || DEFAULT_ABOUT_TITLE);
      setDescription1(data.about_description_1 || DEFAULT_ABOUT_DESCRIPTION_1);
      setDescription2(data.about_description_2 || DEFAULT_ABOUT_DESCRIPTION_2);
      if (Array.isArray(data.about_stats) && data.about_stats.length > 0) {
        setStats(data.about_stats);
      } else {
        setStats(DEFAULT_ABOUT_STATS);
      }
    } catch (err: any) {
      toast.error(err.message || 'Không thể tải cài đặt.');
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImageFile(file);
    const localUrl = URL.createObjectURL(file);
    setImagePreviewUrl(localUrl);
  };

  const handleUploadImage = async (): Promise<string | null> => {
    if (!selectedImageFile) return imageUrl || null;
    setUploading(true);
    try {

      const formData = new FormData();
      formData.append('file', selectedImageFile);
      formData.append('bucket', ABOUT_IMAGE_BUCKET);
      formData.append('folder', 'about');
      const res = await fetchAdminApi('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload thất bại');
      const data = await res.json();
      return data.url as string;
    } catch {
      toast.warning('⚠️ Upload ảnh không thành công (CDN không accessible từ môi trường dev). Nội dung khác vẫn được lưu. Bạn có thể dán URL ảnh thủ công.');
      return imageUrl || null;
    } finally {

      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSettings) return;
    setSaving(true);
    try {

      const uploadedUrl = await handleUploadImage();

      const payload = {
        ...currentSettings,
        about_image_url: uploadedUrl,
        about_title: title.trim(),
        about_description_1: description1.trim(),
        about_description_2: description2.trim(),
        about_stats: stats.filter((s) => s.value.trim() && s.label.trim()),
      };

      const res = await fetchAdminApi('/api/admin/store-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Lưu thất bại');
      }

      const saved = await res.json();
      setCurrentSettings(saved);
      setImageUrl(saved.about_image_url || '');
      setSelectedImageFile(null);
      setImagePreviewUrl('');
      toast.success('Đã lưu thành công nội dung "Về Chúng Tôi"!');
    } catch (err: any) {
      toast.error(err.message || 'Lưu thất bại.');
    }

    setSaving(false);
  };

  const previewSrc = imagePreviewUrl || (imageUrl ? getProxiedImageUrl(imageUrl) : '');

  const addStat = () => setStats((prev) => [...prev, { value: '', label: '' }]);
  const removeStat = (i: number) => setStats((prev) => prev.filter((_, idx) => idx !== i));
  const updateStat = (i: number, field: keyof AboutStat, val: string) =>
    setStats((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: val } : s)));

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Về Chúng Tôi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tuỳ chỉnh nội dung section giới thiệu quán trên trang chủ.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSettings}
          disabled={loading}
          className="h-10 px-4 rounded-xl border-border bg-card hover:bg-muted transition-colors"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-8">


          {/* Image Section */}
          <Card className="border-border/50 shadow-sm overflow-hidden rounded-[24px] bg-card">
            <CardHeader className="p-6 md:p-8 border-b border-border/50">
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Hình ảnh
              </CardTitle>
              <CardDescription>
                Ảnh minh hoạ hiển thị ở bên trái section "Về Chúng Tôi".
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Preview */}
                <div className="flex-shrink-0">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 block">
                    Xem trước
                  </Label>
                  <div className="relative w-52 h-64 rounded-2xl overflow-hidden bg-muted border border-border/50 shadow-sm">
                    {previewSrc ? (
                      <img
                        src={previewSrc}
                        alt="About preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground/40">
                        <BookOpen className="h-10 w-10" />
                        <p className="text-xs font-medium">Chưa có ảnh</p>
                        <p className="text-[10px] text-center px-4">
                          Sẽ hiển thị ảnh mặc định của quán
                        </p>
                      </div>
                    )}
                    {previewSrc && (
                      <button
                        type="button"
                        onClick={() => {
                          setImageUrl('');
                          setImagePreviewUrl('');
                          setSelectedImageFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 hover:bg-background backdrop-blur-sm border border-border flex items-center justify-center text-foreground hover:text-rose-500 transition-colors shadow-sm"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Upload controls */}
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Tải ảnh lên
                    </Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="about-image-upload"
                    />
                    <label
                      htmlFor="about-image-upload"
                      className="flex items-center gap-3 cursor-pointer rounded-2xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/20 hover:bg-primary/5 transition-all p-6 text-center"
                    >
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <div className="text-left">
                        <p className="text-sm font-bold text-foreground">
                          {selectedImageFile ? selectedImageFile.name : 'Chọn ảnh từ máy tính'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          PNG, JPG, WebP — tối đa 5MB
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-card px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        hoặc nhập URL
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      URL hình ảnh
                    </Label>
                    <Input
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setImagePreviewUrl('');
                        setSelectedImageFile(null);
                      }}
                      placeholder="https://..."
                      className="rounded-2xl border-border bg-muted/20 h-12 px-4 focus-visible:ring-primary/10 text-foreground"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Text Content */}
          <Card className="border-border/50 shadow-sm overflow-hidden rounded-[24px] bg-card">
            <CardHeader className="p-6 md:p-8 border-b border-border/50">
              <CardTitle className="text-lg text-foreground">Nội dung văn bản</CardTitle>
              <CardDescription>Tiêu đề và mô tả của section Về Chúng Tôi.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Tiêu đề nhỏ (eyebrow)
                </Label>
                <Input
                  value={eyebrow}
                  onChange={(e) => setEyebrow(e.target.value)}
                  placeholder="Câu chuyện của chúng tôi"
                  className="rounded-2xl border-border bg-muted/20 h-12 px-4 focus-visible:ring-primary/10 text-foreground"
                />
                <p className="text-[11px] text-muted-foreground ml-1">
                  Dòng chữ nhỏ phía trên tiêu đề chính (hiện tại chưa lưu vào DB, dùng mặc định)
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Tiêu đề chính
                </Label>
                <Input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Từ sự giản dị, tạo nên trải nghiệm."
                  className="rounded-2xl border-border bg-muted/20 h-12 px-4 focus-visible:ring-primary/10 text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Đoạn văn 1
                </Label>
                <textarea
                  required
                  value={description1}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription1(e.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-border bg-muted/20 px-4 py-3 text-foreground resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 transition-shadow text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Đoạn văn 2
                </Label>
                <textarea
                  value={description2}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription2(e.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-border bg-muted/20 px-4 py-3 text-foreground resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 transition-shadow text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="border-border/50 shadow-sm overflow-hidden rounded-[24px] bg-card">
            <CardHeader className="p-6 md:p-8 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-foreground">Thông số nổi bật</CardTitle>
                  <CardDescription className="mt-1">
                    Các con số / từ khoá hiển thị dưới dạng thẻ trong section About.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  onClick={addStat}
                  size="sm"
                  variant="outline"
                  className="rounded-xl h-9 px-3 border-border"
                >
                  <Plus className="h-4 w-4 mr-1" /> Thêm thẻ
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
              {stats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Chưa có thông số nào. Nhấn "Thêm thẻ" để tạo mới.
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.map((stat, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-4 rounded-2xl bg-muted/20 border border-border/50 group"
                    >
                      <GripVertical className="h-5 w-5 text-muted-foreground/30 flex-shrink-0" />
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                            Giá trị (VD: 100% / Chill)
                          </Label>
                          <Input
                            value={stat.value}
                            onChange={(e) => updateStat(i, 'value', e.target.value)}
                            placeholder="100%"
                            className="rounded-xl border-border bg-background h-10 px-3 text-foreground font-bold text-lg"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                            Nhãn (VD: Hạt cà phê sạch)
                          </Label>
                          <Input
                            value={stat.label}
                            onChange={(e) => updateStat(i, 'label', e.target.value)}
                            placeholder="Hạt cà phê sạch"
                            className="rounded-xl border-border bg-background h-10 px-3 text-foreground"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeStat(i)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Preview grid */}
              {stats.length > 0 && (
                <div className="mt-6 pt-6 border-t border-border/50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
                    Xem trước thẻ
                  </p>
                  <div className={`grid gap-4 ${stats.length === 1 ? 'grid-cols-1 max-w-xs' : 'grid-cols-2'}`}>
                    {stats.map((stat, i) => (
                      <div key={i} className="rounded-3xl border border-border/50 bg-background p-5">
                        <p className="text-2xl font-bold text-primary">{stat.value || '—'}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                          {stat.label || '—'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button
              type="submit"
              disabled={saving || uploading}
              className="h-12 px-8 rounded-2xl font-black text-base shadow-lg shadow-primary/20"
            >
              {saving || uploading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {uploading ? 'Đang upload...' : saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
