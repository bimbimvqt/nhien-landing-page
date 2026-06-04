'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Image as ImageIcon,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

import { toast } from 'sonner';
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
import { DEFAULT_GALLERY } from '@/lib/storeSettings';
import type { GalleryItem } from '@/types';

const GALLERY_IMAGE_BUCKET = 'product-images';

export default function GallerySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentSettings, setCurrentSettings] = useState<any>(null);


  // Gallery items state
  const [items, setItems] = useState<GalleryItem[]>(DEFAULT_GALLERY);

  // Image upload state for specific index
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);


  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {

      const res = await fetchAdminApi('/api/admin/store-settings');
      if (!res.ok) throw new Error('Không thể tải cài đặt');
      const data = await res.json();
      setCurrentSettings(data);
      if (Array.isArray(data.gallery) && data.gallery.length > 0) {
        setItems(data.gallery);
      } else {
        setItems(DEFAULT_GALLERY);
      }
    } catch (err: any) {
      toast.error(err.message || 'Không thể tải cài đặt gallery.');
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIndex(index);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', GALLERY_IMAGE_BUCKET);
      formData.append('folder', 'gallery');
      const res = await fetchAdminApi('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload thất bại');
      const data = await res.json();
      
      updateItemField(index, 'imageUrl', data.url as string);
    } catch {
      toast.warning('⚠️ Không thể upload ảnh lên CDN (môi trường dev). Hãy dán URL ảnh trực tiếp vào ô URL.');
    } finally {

      setUploadingIndex(null);
    }
  };

  const updateItemField = (index: number, field: keyof GalleryItem, value: string) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const addItem = () => {
    const newItem: GalleryItem = {
      id: `gallery-item-${Date.now()}`,
      imageUrl: '',
      title: 'Không Gian Mới',
      description: 'Mô tả góc nhỏ bình yên mới...',
    };
    setItems((prev) => [...prev, newItem]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSettings) return;
    setSaving(true);
    try {
      const validItems = items.filter((item) => item.imageUrl.trim() && item.title.trim());
      if (validItems.length === 0) {
        throw new Error('Cần có ít nhất 1 ảnh gallery hợp lệ (phải có tiêu đề và hình ảnh).');
      }

      const payload = {
        ...currentSettings,
        gallery: validItems,
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
      if (Array.isArray(saved.gallery) && saved.gallery.length > 0) {
        setItems(saved.gallery);
      }
      toast.success('Đã lưu thành công các hình ảnh Gallery! 🆾');
    } catch (err: any) {
      toast.error(err.message || 'Lưu thất bại.');
    }

    setSaving(false);
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Thư Viện Không Gian (Gallery Carousel)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tùy chỉnh tiêu đề, mô tả và hình ảnh hiển thị trong slider Carousel Gallery tại trang chủ.
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


          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Danh sách ảnh Carousel</h2>
            <Button
              type="button"
              onClick={addItem}
              size="sm"
              className="rounded-xl h-9 px-4 font-bold"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Thêm ảnh mới
            </Button>
          </div>

          <div className="grid gap-6">
            {items.map((item, index) => {
              const previewSrc = item.imageUrl ? getProxiedImageUrl(item.imageUrl) : '';

              return (
                <Card key={item.id} className="border-border/50 shadow-sm overflow-hidden rounded-[24px] bg-card group relative">
                  <CardHeader className="p-6 border-b border-border/50 bg-muted/10 flex flex-row items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-base text-foreground font-black">
                        Slide #{index + 1}: {item.title || 'Chưa đặt tiêu đề'}
                      </CardTitle>
                      <CardDescription>Cấu hình hình ảnh và thông tin của slide này.</CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeItem(index)}
                      className="h-9 w-9 p-0 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
                      title="Xóa slide này"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </Button>
                  </CardHeader>
                  <CardContent className="p-6 md:p-8">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Image Preview Container */}
                      <div className="flex-shrink-0">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2.5 block">
                          Hình ảnh xem trước
                        </Label>
                        <div className="relative w-44 h-56 rounded-2xl overflow-hidden bg-muted border border-border/50 shadow-sm">
                          {previewSrc ? (
                            <img
                              src={previewSrc}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground/30">
                              <ImageIcon className="h-8 w-8" />
                              <p className="text-[10px] font-bold text-center px-4">Chưa có ảnh</p>
                            </div>
                          )}
                          {previewSrc && (
                            <button
                              type="button"
                              onClick={() => updateItemField(index, 'imageUrl', '')}
                              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 hover:bg-background border border-border flex items-center justify-center text-foreground hover:text-rose-500 transition-colors shadow-sm"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Editing fields */}
                      <div className="flex-1 space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                              Tiêu đề Slide
                            </Label>
                            <Input
                              required
                              value={item.title}
                              onChange={(e) => updateItemField(index, 'title', e.target.value)}
                              placeholder="Góc Nhỏ Mộc Mạc"
                              className="rounded-2xl border-border bg-muted/20 h-11 px-4 text-sm font-bold"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                              Upload Ảnh mới
                            </Label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileChange(e, index)}
                              className="hidden"
                              id={`gallery-upload-${item.id}`}
                            />
                            <label
                              htmlFor={`gallery-upload-${item.id}`}
                              className="flex items-center justify-center gap-2 cursor-pointer rounded-2xl border border-dashed border-border hover:border-primary bg-muted/10 hover:bg-primary/5 transition-all h-11 text-center text-xs font-bold text-muted-foreground"
                            >
                              {uploadingIndex === index ? (
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              ) : (
                                <Upload className="h-4 w-4" />
                              )}
                              Tải tệp tin ảnh lên
                            </label>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            URL Hình ảnh
                          </Label>
                          <Input
                            value={item.imageUrl}
                            onChange={(e) => updateItemField(index, 'imageUrl', e.target.value)}
                            placeholder="https://images.unsplash.com/photo-..."
                            className="rounded-2xl border-border bg-muted/20 h-11 px-4 text-xs font-mono"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Mô tả Slide
                          </Label>
                          <textarea
                            value={item.description || ''}
                            onChange={(e) => updateItemField(index, 'description', e.target.value)}
                            placeholder="Mô tả sự tinh tế, góc bàn gỗ hay hương vị tách cà phê..."
                            rows={3}
                            className="w-full rounded-2xl border border-border bg-muted/20 px-4 py-3 text-foreground resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-shadow text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="submit"
              disabled={saving || uploadingIndex !== null}
              className="h-12 px-8 rounded-2xl font-black text-base shadow-lg shadow-primary/20"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Lưu cấu hình Gallery
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
